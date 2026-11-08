
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../client';
import { useAuth } from './useAuth';

export interface RecommendedUser {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    isFollowing: boolean;
}

export function useRecommendedUsers() {
    const { user } = useAuth();
    const [users, setUsers] = useState<RecommendedUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecommendedUsers = useCallback(async () => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // 1. Fetch profiles (limit to 10 for now)
            // In a real app, this would be a more complex query or edge function
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url, bio')
                .limit(20);

            if (profilesError) throw profilesError;
            if (!profiles) return;

            // Filter out current user
            let potentialUsers = profiles;
            if (user) {
                potentialUsers = profiles.filter((p: any) => p.id !== user.id);
            }

            // 2. Check following status
            let followingIds = new Set<string>();
            if (user) {
                const { data: follows } = await supabase
                    .from('follows')
                    .select('following_id')
                    .eq('follower_id', user.id);

                if (follows) {
                    follows.forEach((f: any) => followingIds.add(f.following_id));
                }
            }

            // 3. Format users
            const formattedUsers: RecommendedUser[] = potentialUsers.map((p: any) => ({
                id: p.id,
                username: p.username || 'user',
                displayName: p.display_name || p.username || 'User',
                avatarUrl: p.avatar_url,
                bio: p.bio,
                isFollowing: followingIds.has(p.id)
            }));

            // Optional: Filter out users already followed if we only want "new" recommendations
            // For now, let's keep them but show "Following" status, or maybe just filter them out 
            // to make it true "Recommendation" (you usually recommend people not yet followed).
            // Let's filter out followed users for better discovery experience.
            const newRecommendations = formattedUsers.filter(u => !u.isFollowing);

            // If we filtered everything out, maybe show some popular followed ones? 
            // For now, just return what we have.
            setUsers(newRecommendations.length > 0 ? newRecommendations : formattedUsers.slice(0, 5));

        } catch (error) {
            console.error('Error fetching recommended users:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchRecommendedUsers();
    }, [fetchRecommendedUsers]);

    const toggleFollowUser = async (userIdToFollow: string) => {
        if (!user) return;

        const userIndex = users.findIndex((u: RecommendedUser) => u.id === userIdToFollow);
        if (userIndex === -1) return;

        const targetUser = users[userIndex];
        const wasFollowing = targetUser.isFollowing;

        // Optimistic update
        const updatedUsers = [...users];
        updatedUsers[userIndex] = {
            ...targetUser,
            isFollowing: !wasFollowing
        };
        setUsers(updatedUsers);

        try {
            if (wasFollowing) {
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
            // Revert
            setUsers(users);
        }
    };

    return {
        users,
        loading,
        toggleFollowUser
    };
}
