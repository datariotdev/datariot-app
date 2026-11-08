import { useState, useEffect, useCallback } from 'react';
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

export function useChats() {
    const { user } = useAuth();
    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchChats = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // COMPLETE BYPASS of chat_participants to avoid RLS recursion:
            // Let's try to infer your chats purely from messages you've sent or received
            // Note: This relies on messages having a user_id or similar.

            // First, get ALL messages sent by the user
            console.log('--- fetchChats START ---');
            console.log('Querying messages for user:', user.id);
            const { data: myMsgs, error: mError } = await supabase
                .from('messages')
                .select('chat_id')
                .eq('sender_id', user.id);

            console.log('mError:', !!mError);

            if (mError) {
                // If even THIS triggers recursion, the backend policies are hopelessly entangled 
                // and the user must fix the SQL policies on Supabase.
                throw mError;
            }

            if (!myMsgs || myMsgs.length === 0) {
                setChats([]);
                return;
            }

            const chatIds = [...new Set(myMsgs.map((m: any) => m.chat_id))];

            console.log('Found chatIds:', chatIds);
            console.log('Querying latest messages...');

            // Now get the latest message for these chatIds
            const { data: latestMessages, error: lError } = await supabase
                .from('messages')
                .select('chat_id, sender_id, content, created_at, media_type')
                .in('chat_id', chatIds)
                .order('created_at', { ascending: false });

            console.log('lError:', !!lError);

            if (lError) throw lError;

            const lastMsgs = new Map();
            const interactors = new Set<string>();

            if (latestMessages) {
                for (const msg of latestMessages) {
                    if (!lastMsgs.has(msg.chat_id)) {
                        lastMsgs.set(msg.chat_id, msg);
                    }
                    if (msg.sender_id && msg.sender_id !== user.id) {
                        interactors.add(msg.sender_id);
                    }
                }
            }

            let profilesMap: Record<string, any> = {};

            console.log('Querying profiles for interactors:', Array.from(interactors));

            if (interactors.size > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, avatar_url')
                    .in('id', Array.from(interactors));

                if (profilesData) {
                    profilesMap = profilesData.reduce((acc: any, curr: any) => {
                        acc[curr.id] = curr;
                        return acc;
                    }, {} as Record<string, any>);
                }
            }

            const finalChats: ChatPreview[] = [];
            for (const cId of chatIds) {
                // Try to guess the other user from interactors
                // (Find the first profile in interactors that appeared in this chat's messages)
                const chatMsgs = latestMessages?.filter((m: any) => m.chat_id === cId) || [];
                const otherUserId = chatMsgs.find((m: any) => m.sender_id !== user.id)?.sender_id;

                const profile = otherUserId ? profilesMap[otherUserId] : null;
                const lastMsg = lastMsgs.get(cId);

                finalChats.push({
                    id: profile?.id || (cId as string),
                    chat_id: cId as string,
                    name: profile ? (profile.display_name || profile.username) : 'Unknown User',
                    message: lastMsg ? (lastMsg.media_type ? `Sent a ${lastMsg.media_type}` : lastMsg.content) : 'Started a conversation',
                    time: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'New',
                    unreadCount: 0,
                    avatar_url: profile?.avatar_url || null
                });
            }

            setChats(finalChats);

        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchChats();

        // Optional: subscribe to new messages
        if (!user) return;

        const channel = supabase.channel('chats-updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload: any) => {
                    // Update latest message in chat list
                    fetchChats(); // Simplest way to refresh
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchChats, user]);

    return {
        chats,
        loading,
        refetch: fetchChats
    };
}
