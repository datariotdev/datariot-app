import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../client';
import { useAuth } from './useAuth';

export interface Post {
    id: string;
    userId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    imageUrl?: string;
    videoUrl?: string; // Link to video content
    likes: number;
    comments: number;
    isLiked: boolean;
    createdAt: string;
    timestamp: string;
    logicStats?: {
        forScore: number;
        againstScore: number;
        forPercentage: number;
    };
    isAiAssisted?: boolean;
}

export function usePosts(filterUserId?: string) {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = useCallback(async () => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Fetch posts
            let query = supabase
                .from('posts')
                .select('*')
                .eq('is_published', true);

            if (filterUserId) {
                query = query.eq('user_id', filterUserId);
            }

            const { data, error } = await query
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!data) return;

            // Fetch profiles in parallel
            const userIds = [...new Set(data.map((p: any) => p.user_id).filter(Boolean))];
            let profilesMap: Record<string, any> = {};

            if (userIds.length > 0) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, avatar_url')
                    .in('id', userIds);

                if (!profileError && profileData) {
                    profilesMap = profileData.reduce((acc: any, p: any) => {
                        acc[p.id] = p;
                        return acc;
                    }, {});
                }
            }

            // Check if post is liked by current user
            let likedPostIds = new Set<string>();
            if (user) {
                const { data: likes } = await supabase
                    .from('post_likes')
                    .select('post_id')
                    .eq('user_id', user.id);

                if (likes) {
                    likes.forEach((l: any) => likedPostIds.add(l.post_id));
                }
            }

            // Fetch logic stats for these posts
            let logicStatsMap: Record<string, { forScore: number, againstScore: number }> = {};
            if (data.length > 0) {
                const postIds = data.map((p: any) => p.id);
                const { data: commentData } = await supabase
                    .from('comments')
                    .select('post_id, text, likes_count')
                    .in('post_id', postIds);

                if (commentData) {
                    commentData.forEach((c: any) => {
                        const pid = c.post_id;
                        if (!logicStatsMap[pid]) logicStatsMap[pid] = { forScore: 0, againstScore: 0 };

                        let text = c.text || '';
                        if (text.startsWith('AI_ORACLE:|')) {
                            text = text.replace('AI_ORACLE:|', '');
                        }

                        if (text.startsWith('FOR:|')) {
                            logicStatsMap[pid].forScore += c.likes_count || 0;
                        } else if (text.startsWith('AGAINST:|')) {
                            logicStatsMap[pid].againstScore += c.likes_count || 0;
                        }
                    });
                }
            }

            const aiAssistedMap = new Set<string>();
            if (data.length > 0) {
                const postIds = data.map((p: any) => p.id);
                // Check if any comment in the post starts with AI_ORACLE
                const { data: aiCommentData } = await supabase
                    .from('comments')
                    .select('post_id, text')
                    .in('post_id', postIds)
                    .like('text', 'AI_ORACLE:|%');

                if (aiCommentData) {
                    aiCommentData.forEach((c: any) => aiAssistedMap.add(c.post_id));
                }
            }

            const formattedPosts: Post[] = data.map((p: any) => {
                const profile = profilesMap[p.user_id];
                const authorName = profile?.display_name ||
                    profile?.username ||
                    (user?.id === p.user_id ? (user?.user_metadata?.display_name || user?.user_metadata?.username || user?.email?.split('@')[0]) : 'User');

                // Format timestamp (simple version)
                const date = new Date(p.created_at);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const timestamp = diffHours < 1 ? 'Just now' : `${diffHours}h ago`;

                return {
                    id: p.id,
                    userId: p.user_id,
                    authorName,
                    authorAvatar: profile?.avatar_url,
                    content: p.content,
                    imageUrl: p.image_url,
                    videoUrl: p.video_url,
                    likes: p.likes_count || 0,
                    comments: p.comments_count || 0,
                    isLiked: likedPostIds.has(p.id),
                    createdAt: p.created_at,
                    timestamp,
                    logicStats: logicStatsMap[p.id] ? {
                        forScore: logicStatsMap[p.id].forScore,
                        againstScore: logicStatsMap[p.id].againstScore,
                        forPercentage: (logicStatsMap[p.id].forScore + logicStatsMap[p.id].againstScore) > 0
                            ? (logicStatsMap[p.id].forScore / (logicStatsMap[p.id].forScore + logicStatsMap[p.id].againstScore)) * 100
                            : 50
                    } : { forScore: 0, againstScore: 0, forPercentage: 50 },
                    isAiAssisted: aiAssistedMap.has(p.id)
                };
            });

            setPosts(formattedPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    }, [user, filterUserId]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const toggleLike = async (postId: string) => {
        if (!user) return;

        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return;

        const post = posts[postIndex];
        const wasLiked = post.isLiked;

        // Optimistic update
        const updatedPosts = [...posts];
        updatedPosts[postIndex] = {
            ...post,
            isLiked: !wasLiked,
            likes: wasLiked ? Math.max(0, post.likes - 1) : post.likes + 1
        };
        setPosts(updatedPosts);

        try {
            if (wasLiked) {
                await supabase
                    .from('post_likes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('post_id', postId);
            } else {
                await supabase
                    .from('post_likes')
                    .insert({ user_id: user.id, post_id: postId });
            }
        } catch (error) {
            console.error('Error toggling post like:', error);
            // Revert on error
            setPosts(posts);
        }
    };

    const deletePost = async (postId: string) => {
        if (!supabase || !user) return;

        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId)
                .eq('user_id', user.id);

            if (error) throw error;

            setPosts(prev => prev.filter(p => p.id !== postId));
        } catch (error) {
            console.error('Error deleting post:', error);
            throw error;
        }
    };

    return {
        posts,
        loading,
        refresh: fetchPosts,
        toggleLike,
        deletePost
    };
}

