import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../client';
import { useAuth } from './useAuth';

export interface Argument {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    side: 'FOR' | 'AGAINST' | 'NEUTRAL';
    timestamp: string;
    strength: number;
    isVoted: boolean;
    videoUrl?: string; // Optional video content
}

export function useDebateArguments(postId: string | null) {
    const { user } = useAuth();
    const [argumentsList, setArguments] = useState<Argument[]>([]);
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);

    const fetchArguments = useCallback(async () => {
        if (!supabase || !postId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*, videos(url)') // Join with videos to get the URL
                .eq('post_id', postId)
                .order('likes_count', { ascending: false });

            if (error) throw error;
            if (!data) return;

            // Fetch profiles in parallel
            const userIds = [...new Set(data.map((c: any) => c.user_id).filter(Boolean))];
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

            // Check voted arguments
            let votedIds = new Set<string>();
            if (user) {
                const { data: likes } = await supabase
                    .from('comment_likes')
                    .select('comment_id')
                    .eq('user_id', user.id);
                if (likes) likes.forEach((l: any) => votedIds.add(l.comment_id));
            }

            const formatArgument = (c: any): Argument => {
                const profile = profilesMap[c.user_id] || {};
                const now = new Date();
                const created = new Date(c.created_at || new Date());
                const diffMs = now.getTime() - created.getTime();
                const diffMin = Math.floor(diffMs / 60000);
                const timestamp = diffMin < 1 ? 'just now'
                    : diffMin < 60 ? `${diffMin}m ago`
                        : diffMin < 1440 ? `${Math.floor(diffMin / 60)}h ago`
                            : `${Math.floor(diffMin / 1440)}d ago`;

                let rawText = c.text || c.content || '';
                let side: 'FOR' | 'AGAINST' | 'NEUTRAL' = 'NEUTRAL';

                if (rawText.startsWith('FOR:|')) {
                    side = 'FOR';
                    rawText = rawText.substring(5);
                } else if (rawText.startsWith('AGAINST:|')) {
                    side = 'AGAINST';
                    rawText = rawText.substring(9);
                }

                return {
                    id: c.id,
                    authorId: c.user_id,
                    authorName: profile.display_name ||
                        profile.username ||
                        (user?.id === c.user_id ? (user?.user_metadata?.display_name || user?.user_metadata?.username || user?.email?.split('@')[0]) : 'User'),
                    authorAvatar: profile.avatar_url,
                    content: rawText,
                    side,
                    timestamp,
                    strength: c.likes_count || 0,
                    isVoted: votedIds.has(c.id),
                    videoUrl: c.videos?.url, // From the join
                };
            };

            setArguments(data.map(formatArgument));
        } catch (err) {
            console.error('Error fetching arguments:', err);
        } finally {
            setLoading(false);
        }
    }, [postId, user]);

    useEffect(() => {
        if (postId) {
            fetchArguments();
        }
    }, [fetchArguments, postId]);

    const postArgument = useCallback(async (content: string, side: 'FOR' | 'AGAINST') => {
        if (!supabase || !user || !postId || !content.trim()) return;
        setPosting(true);
        try {
            const prefix = side === 'FOR' ? 'FOR:|' : 'AGAINST:|';
            const { error } = await supabase.from('comments').insert({
                post_id: postId,
                user_id: user.id,
                text: prefix + content.trim(),
            });
            if (error) throw error;
            await fetchArguments();
        } catch (err) {
            console.error('Error posting argument:', err);
        } finally {
            setPosting(false);
        }
    }, [supabase, user, postId, fetchArguments]);

    const toggleVoteArgument = useCallback(async (argumentId: string) => {
        if (!supabase || !user) return;
        const idx = argumentsList.findIndex(c => c.id === argumentId);
        if (idx === -1) return;
        const c = argumentsList[idx];
        const wasVoted = c.isVoted;

        // Optimistic
        const updated = [...argumentsList];
        updated[idx] = { ...c, isVoted: !wasVoted, strength: wasVoted ? c.strength - 1 : c.strength + 1 };

        // Re-sort by strength
        updated.sort((a, b) => b.strength - a.strength);
        setArguments(updated);

        try {
            if (wasVoted) {
                await supabase.from('comment_likes').delete().eq('user_id', user.id).eq('comment_id', argumentId);
            } else {
                await supabase.from('comment_likes').insert({ user_id: user.id, comment_id: argumentId });
            }
        } catch {
            fetchArguments(); // revert on fail
        }
    }, [supabase, user, argumentsList, fetchArguments]);

    const deleteArgument = useCallback(async (argumentId: string) => {
        if (!supabase || !user) return;

        // Optimistic update
        const previousArguments = [...argumentsList];
        setArguments(argumentsList.filter(a => a.id !== argumentId));

        try {
            const { error } = await supabase.from('comments').delete().eq('id', argumentId).eq('user_id', user.id);
            if (error) throw error;
        } catch (err) {
            console.error('Error deleting argument:', err);
            setArguments(previousArguments); // revert on fail
        }
    }, [supabase, user, argumentsList]);

    return { argumentsList, loading, posting, fetchArguments, postArgument, toggleVoteArgument, deleteArgument };
}
