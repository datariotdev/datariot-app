import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../client';
import { useAuth } from './useAuth';
import { encodeVideoUrl } from '../../utils/url';

export interface Video {
    id: string;
    videoUrl: string;
    title: string;
    description: string;
    author: string;
    authorId: string;
    avatarUrl?: string;
    hashtag?: string;
    progress?: { current: number; total: number };
    likes: number;
    comments: number;
    saved: number;
    views: number;
    shares: number;
    isLiked: boolean;
    isSaved: boolean;
    isFollowing: boolean;
    thumbnailUrl?: string; // Optional thumbnail URL
    category?: string;
    dnaRationale?: string;
    isHighSynergy?: boolean;
    dnaMatch?: number;
    logicStats?: {
        forScore: number;
        againstScore: number;
        forPercentage: number;
    };
}

export type FeedType = 'trending' | 'following' | 'ai' | 'user' | 'search';

interface UseVideosProps {
    type: FeedType;
    userId?: string;
    searchQuery?: string;
    hashtag?: string;
    category?: string;
    sort?: 'recent' | 'popular';
}

export function useVideos({ type, userId, searchQuery, hashtag, category, sort = 'recent' }: UseVideosProps) {
    const { user } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const formatVideo = useCallback((video: any, profile?: any, isLiked: boolean = false): Video => {
        const authorName = profile?.display_name || profile?.username || profile?.nickname || 'Unknown';

        // Sanitize title: remove Russian strings and specific placeholders
        let sanitizedTitle = video.title || '';
        const isPlaceholder = !sanitizedTitle ||
            sanitizedTitle.length <= 2 ||
            sanitizedTitle.toLowerCase().includes('video') ||
            sanitizedTitle.toLowerCase().includes('название') || // "Title" in Russian
            /[а-яА-ЯёЁ]/.test(sanitizedTitle); // Detect any Cyrillic characters

        const finalTitle = !isPlaceholder ? sanitizedTitle : `Orvelis ${video.category || 'Strategic'} Insight #${video.id.slice(0, 4)}`;

        return {
            id: video.id,
            videoUrl: encodeVideoUrl(video.url || video.s3_url) || '',
            title: finalTitle,
            description: video.description || '',
            author: authorName,
            authorId: video.user_id || '',
            avatarUrl: profile?.avatar_url || 'https://i.pravatar.cc/150?u=' + video.user_id,
            likes: video.likes_count || video.likes || 0,
            comments: video.comments_count || video.comments || 0,
            saved: video.saved_count || video.saved || 0,
            views: video.views_count || video.views || 0,
            shares: video.shares_count || video.shares || 0,
            isLiked: isLiked,
            isSaved: false,
            isFollowing: false,
            thumbnailUrl: video.thumbnail_url || video.thumbnail || `https://picsum.photos/seed/${video.id}/800/1200`,
            category: video.category || null,
            dnaRationale: Math.random() > 0.5 ? "Matches your interest in Engineering & Dev" : "Popular in your local DNA community",
            isHighSynergy: (video.id.charCodeAt(0) % 10 < 7) || Math.random() > 0.3, // ~70-80% chance for synergy to ensure sections aren't empty
            dnaMatch: 85 + Math.floor(Math.random() * 14),
        };
    }, []);

    const fetchVideos = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
        if (!supabase) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            if (!isRefresh) setLoading(true);

            // 1. Fetch videos - Increased range to fetch more in case many are filtered out
            let query = supabase
                .from('videos')
                .select('*');

            if (sort === 'popular') {
                query = query.order('likes', { ascending: false }); // Assuming 'likes' column exists (mapped from likes_count?) or use 'likes_count'
                // Fallback if likes doesn't exist directly or needs count... 
                // The formatVideo uses `video.likes_count || video.likes`.
                // I'll try ordering by `likes` first, usually simpler.
            } else {
                query = query.order('created_at', { ascending: false });
            }

            if (userId) {
                query = query.eq('user_id', userId);
            }

            if (hashtag) {
                // Assuming hashtag is stored in description or a separate array
                query = query.textSearch('description', `'${hashtag}'`);
            } else if (searchQuery) {
                query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
            }

            if (category) {
                query = query.eq('category', category);
            }

            const { data: videoData, error: videoError } = await query
                .range(pageNum * 12, (pageNum + 1) * 12 - 1); // Load 12 at a time (optimized)

            if (videoError) throw videoError;
            if (!videoData) return;

            // 2. Parallelize dependent fetches (Profiles and Likes)
            const userIds = [...new Set(videoData.map((v: any) => v.user_id).filter(Boolean))];
            const videoIds = videoData.map((v: any) => v.id);

            const fetchProfilesPromise = (async () => {
                if (userIds.length > 0) {
                    // console.log('Fetching profiles for userIds:', userIds.length);
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .in('id', userIds);

                    if (profileError) {
                        console.error('Profile fetch error:', profileError);
                        return {};
                    }
                    return (profileData || []).reduce((acc: any, p: any) => {
                        acc[p.id] = p;
                        return acc;
                    }, {});
                }
                return {};
            })();

            const fetchLikesPromise = (async () => {
                if (user && videoData.length > 0) {
                    const { data: likeData } = await supabase
                        .from('likes')
                        .select('video_id')
                        .eq('user_id', user.id)
                        .in('video_id', videoIds);

                    const likedSet = new Set<string>();
                    if (likeData) {
                        likeData.forEach((l: any) => likedSet.add(l.video_id));
                    }
                    return likedSet;
                }
                return new Set<string>();
            })();

            // Fetch Logic Stats (Who's Winning) for these videos
            const fetchLogicStatsPromise = (async () => {
                const urls = videoData.map((v: any) => v.url || v.s3_url).filter(Boolean);
                if (urls.length === 0) return {};

                // 1. Find posts matching these video URLs
                const { data: postData } = await supabase
                    .from('posts')
                    .select('id, video_url')
                    .in('video_url', urls);

                if (!postData || postData.length === 0) return {};

                const postIds = postData.map((p: any) => p.id);
                const urlToPostId: Record<string, string> = {};
                postData.forEach((p: any) => { if (p.video_url) urlToPostId[p.video_url] = p.id; });

                // 2. Fetch comments for these posts
                const { data: commentData } = await supabase
                    .from('comments')
                    .select('post_id, text, likes_count')
                    .in('post_id', postIds);

                const statsMap: Record<string, { forScore: number, againstScore: number }> = {};
                if (commentData) {
                    commentData.forEach((c: any) => {
                        const pid = c.post_id;
                        if (!statsMap[pid]) statsMap[pid] = { forScore: 0, againstScore: 0 };
                        const text = c.text || '';
                        if (text.startsWith('FOR:|')) statsMap[pid].forScore += c.likes_count || 0;
                        else if (text.startsWith('AGAINST:|')) statsMap[pid].againstScore += c.likes_count || 0;
                    });
                }

                // 3. Map back to video URLs
                const finalMap: Record<string, any> = {};
                Object.entries(urlToPostId).forEach(([url, pid]) => {
                    if (statsMap[pid]) {
                        const s = statsMap[pid];
                        finalMap[url] = {
                            forScore: s.forScore,
                            againstScore: s.againstScore,
                            forPercentage: (s.forScore + s.againstScore) > 0 ? (s.forScore / (s.forScore + s.againstScore)) * 100 : 50
                        };
                    }
                });
                return finalMap;
            })();

            const [profilesMap, likedVideoIds, videoLogicMap] = await Promise.all([
                fetchProfilesPromise,
                fetchLikesPromise,
                fetchLogicStatsPromise
            ]);

            // 4. Format videos - filter for "real" user-uploaded content
            const placeholderPatterns = [
                'BigBuckBunny',
                'ElephantsDream',
                'gtv-videos-bucket',
                'commondatastorage.googleapis.com',
                '/sample/',
                'big-buck-bunny'
            ];

            const formattedVideos = videoData
                .map((v: any) => {
                    const formatted = formatVideo(v, profilesMap[v.user_id], likedVideoIds.has(v.id));
                    const videoUrl = v.url || v.s3_url;
                    if (videoUrl && videoLogicMap[videoUrl]) {
                        formatted.logicStats = videoLogicMap[videoUrl];
                    }
                    return formatted;
                })
                .filter((v: Video) => {
                    // Profile grids must show the owner's records, even when the video
                    // is externally hosted or its playback URL is temporarily missing.
                    if (type === 'user') return true;
                    // 1. Must have a valid URL
                    if (!v.videoUrl || v.videoUrl.length === 0) return false;

                    // 2. Must have a valid author/user ID to be considered "user-uploaded"
                    if (!v.authorId || v.authorId === '00000000-0000-0000-0000-000000000000') return false;

                    // 3. Check if it's a known test sample
                    const isTestSample = placeholderPatterns.some(pattern =>
                        v.videoUrl.toLowerCase().includes(pattern.toLowerCase())
                    );
                    if (isTestSample) return false;

                    // 4. Prefer videos from the official Supabase storage bucket
                    const isSupabaseVideo = v.videoUrl.includes('/storage/v1/object/public/videos/');

                    // Allow only Supabase videos OR videos that don't match any obvious placeholders 
                    // and have a real author.
                    return isSupabaseVideo || !v.videoUrl.includes('placeholder');
                });

            // console.log('Formatted and filtered videos:', formattedVideos.length);
            if (formattedVideos.length > 0) {
                console.log('[useVideos] Fetched URLs:', formattedVideos.map((v: Video) => v.videoUrl));
            }

            if (isRefresh) {
                setVideos(formattedVideos);
            } else {
                setVideos(prev => [...prev, ...formattedVideos]);
            }

            setHasMore(videoData.length === 12);
        } catch (error) {
            console.error('Error fetching videos:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [type, userId, searchQuery, hashtag, category, user, formatVideo, sort]);

    useEffect(() => {
        // console.log('useVideos component mounted or dependencies changed.');
        setPage(0);
        fetchVideos(0, true);
    }, [type, userId, searchQuery, hashtag, category, user, fetchVideos]);

    const loadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchVideos(nextPage);
        }
    };

    const refresh = () => {
        setRefreshing(true);
        setPage(0);
        fetchVideos(0, true);
    };

    const toggleLike = async (videoId: string) => {
        if (!user) return;

        const videoIndex = videos.findIndex(v => v.id === videoId);
        if (videoIndex === -1) return;

        const video = videos[videoIndex];
        const wasLiked = video.isLiked;

        // Optimistic update
        const updatedVideos = [...videos];
        updatedVideos[videoIndex] = {
            ...video,
            isLiked: !wasLiked,
            likes: wasLiked ? Math.max(0, video.likes - 1) : video.likes + 1
        };
        setVideos(updatedVideos);

        try {
            if (!supabase) return;
            if (wasLiked) {
                await supabase
                    .from('likes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('video_id', videoId);
            } else {
                await supabase
                    .from('likes')
                    .insert({ user_id: user.id, video_id: videoId });
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            // Revert on error
            setVideos(videos);
        }
    };

    const toggleFollow = async (userIdToFollow: string) => {
        if (!user || user.id === userIdToFollow) return;

        const isFollowing = videos.some(v => v.authorId === userIdToFollow && v.isFollowing);

        // Optimistic update for all videos by this author
        setVideos(prev => prev.map(v =>
            v.authorId === userIdToFollow ? { ...v, isFollowing: !isFollowing } : v
        ));

        try {
            if (!supabase) return;
            if (isFollowing) {
                await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', userIdToFollow);
            } else {
                await supabase
                    .from('follows')
                    .insert({ follower_id: user.id, following_id: userIdToFollow });
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            // Revert (harder to revert nested state, maybe just re-fetch or use a more robust state manager)
        }
    };

    return {
        videos,
        loading,
        refreshing,
        hasMore,
        loadMore,
        refresh,
        toggleLike,
        toggleFollow,
    };
}
