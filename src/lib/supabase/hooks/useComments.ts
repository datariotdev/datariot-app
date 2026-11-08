import { useState, useCallback } from 'react';
import { supabase } from '../client';
import { useAuth } from './useAuth';

export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    timestamp: string;
    likes: number;
    isLiked: boolean;
    parentId: string | null;
    replies?: Comment[];
}

export function useComments(videoId: string | null) {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);

    const fetchComments = useCallback(async () => {
        if (!supabase || !videoId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*')
                .eq('video_id', videoId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!data) return;

            // Fetch profiles for comment authors
            const userIds = [...new Set(data.map((c: any) => c.user_id))];
            let profilesMap: Record<string, any> = {};
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, avatar_url')
                    .in('id', userIds);
                if (profiles) {
                    profiles.forEach((p: any) => { profilesMap[p.id] = p; });
                }
            }

            // Check liked comments
            let likedIds = new Set<string>();
            if (user) {
                const { data: likes } = await supabase
                    .from('comment_likes')
                    .select('comment_id')
                    .eq('user_id', user.id);
                if (likes) likes.forEach((l: any) => likedIds.add(l.comment_id));
            }

            const formatComment = (c: any): Comment => {
                const profile = profilesMap[c.user_id];
                const created = new Date(c.created_at);
                const pad = (n: number) => String(n).padStart(2, '0');
                const timestamp = `${pad(created.getDate())}/${pad(created.getMonth() + 1)} ${pad(created.getHours())}:${pad(created.getMinutes())}`;

                return {
                    id: c.id,
                    authorId: c.user_id,
                    authorName: profile?.display_name || profile?.username || 'User',
                    authorAvatar: profile?.avatar_url,
                    content: c.text || c.content || '',
                    timestamp,
                    likes: c.likes_count || 0,
                    isLiked: likedIds.has(c.id),
                    parentId: c.parent_id || null,
                };
            };

            // Build tree: top-level + replies nested
            const allComments = data.map(formatComment);
            const topLevel = allComments.filter((c: Comment) => !c.parentId);
            const repliesMap: Record<string, Comment[]> = {};
            allComments.filter((c: Comment) => c.parentId).forEach((c: Comment) => {
                if (!repliesMap[c.parentId!]) repliesMap[c.parentId!] = [];
                repliesMap[c.parentId!].push(c);
            });
            topLevel.forEach((c: Comment) => { c.replies = repliesMap[c.id] || []; });
            setComments(topLevel);
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setLoading(false);
        }
    }, [videoId, user]);

    const postComment = useCallback(async (content: string, parentId?: string) => {
        if (!supabase || !user || !videoId || !content.trim()) return;
        setPosting(true);
        try {
            const { error } = await supabase.from('comments').insert({
                video_id: videoId,
                user_id: user.id,
                text: content.trim(),
                parent_id: parentId || null,
            });
            if (error) throw error;
            await fetchComments();
        } catch (err) {
            console.error('Error posting comment:', err);
        } finally {
            setPosting(false);
        }
    }, [supabase, user, videoId, fetchComments]);

    const toggleLikeComment = useCallback(async (commentId: string) => {
        if (!supabase || !user) return;
        const idx = comments.findIndex(c => c.id === commentId);
        if (idx === -1) return;
        const c = comments[idx];
        const wasLiked = c.isLiked;
        // Optimistic
        const updated = [...comments];
        updated[idx] = { ...c, isLiked: !wasLiked, likes: wasLiked ? c.likes - 1 : c.likes + 1 };
        setComments(updated);
        try {
            if (wasLiked) {
                await supabase.from('comment_likes').delete().eq('user_id', user.id).eq('comment_id', commentId);
            } else {
                await supabase.from('comment_likes').insert({ user_id: user.id, comment_id: commentId });
            }
        } catch {
            setComments(comments); // revert
        }
    }, [supabase, user, comments]);

    const deleteComment = useCallback(async (commentId: string) => {
        if (!supabase || !user) return;
        const previous = [...comments];
        setComments(prev => prev.filter(c => c.id !== commentId).map(c => ({
            ...c,
            replies: c.replies?.filter(r => r.id !== commentId) || [],
        })));
        try {
            const { error } = await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id);
            if (error) throw error;
        } catch (err) {
            console.error('Error deleting comment:', err);
            setComments(previous);
        }
    }, [supabase, user, comments]);

    return { comments, loading, posting, fetchComments, postComment, toggleLikeComment, deleteComment };
}
