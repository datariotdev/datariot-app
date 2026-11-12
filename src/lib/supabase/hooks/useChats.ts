import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../client';
import { useAuth } from './useAuth';

export interface ChatPreview {
    id: string;
    chat_id: string;
    name: string;
    message: string;
    time: string;
    unreadCount: number;
    avatar_url: string | null;
    isAi?: boolean;
}

type InboxChat = {
    id: string;
    chat_participants: {
        user_id: string;
        profiles: { display_name: string | null; username: string; avatar_url: string | null } | null;
    }[];
    messages: { content: string | null; created_at: string; media_type: string | null }[];
};

export function useChats() {
    const { user, loading: authLoading } = useAuth();
    const userId = user?.id;
    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [loading, setLoading] = useState(true);
    const request = useRef(0);

    const fetchChats = useCallback(async () => {
        const sequence = ++request.current;
        if (authLoading) return;
        if (!userId || !supabase) {
            setChats([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // The chat and message policies limit this list to the user's memberships.
            const { data, error } = await supabase.from('chats')
                .select('id, chat_participants(user_id, profiles(display_name, username, avatar_url)), messages(content, created_at, media_type)')
                .order('created_at', { referencedTable: 'messages', ascending: false })
                .limit(1, { referencedTable: 'messages' });
            if (error) throw error;
            if (sequence !== request.current) return;

            const rows = (data ?? []) as InboxChat[];
            const previews = rows
                .filter(chat => chat.messages.length > 0)
                .sort((a, b) => Date.parse(b.messages[0].created_at) - Date.parse(a.messages[0].created_at))
                .map(chat => {
                    const participant = chat.chat_participants.find(member => member.user_id !== userId);
                    const profile = participant?.profiles;
                    const latest = chat.messages[0];
                    return {
                        id: participant?.user_id ?? chat.id,
                        chat_id: chat.id,
                        name: profile?.display_name || profile?.username || 'Unknown User',
                        message: latest.media_type ? `Sent a ${latest.media_type}` : latest.content ?? '',
                        time: new Date(latest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        unreadCount: 0,
                        avatar_url: profile?.avatar_url ?? null,
                    };
                });
            setChats(previews);
        } catch (error) {
            if (sequence === request.current) console.warn('Could not load conversations:', error);
        } finally {
            if (sequence === request.current) setLoading(false);
        }
    }, [authLoading, userId]);

    useEffect(() => {
        setChats([]);
        void fetchChats();
        if (!userId || !supabase) return;

        const channel = supabase.channel(`inbox:${userId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => { void fetchChats(); })
            .subscribe((status: string) => { if (status === 'SUBSCRIBED') void fetchChats(); });

        return () => {
            request.current++;
            void supabase.removeChannel(channel);
        };
    }, [fetchChats, userId]);

    return { chats, loading, refetch: fetchChats };
}
