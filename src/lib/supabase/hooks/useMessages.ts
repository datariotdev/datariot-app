import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../client';
import { useAuth } from './useAuth';

console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
console.log('!!! USE_MESSAGES_HOOK_LOADED_VERSION_DEBUG_01 !!!');
console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

export interface ChatMessage {
    id: string;
    chat_id: string;
    sender_id: string;
    content: string;
    media_url: string | null;
    media_type: 'image' | 'video' | 'audio' | null;
    created_at: string;
    // Client-side properties
    sender: 'me' | 'them';
    time: string;
}

export function useMessages(chatId: string) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // We need a ref to track the REAL chat ID if we create it on the fly
    const [activeChatId, setActiveChatId] = useState<string>(chatId);

    // Keep activeChatId in sync if the prop changes
    useEffect(() => {
        setActiveChatId(chatId);
    }, [chatId]);

    const fetchMessages = useCallback(async () => {
        if (!user || !activeChatId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Fetch messages for the specific chat
            const { data, error: fetchError } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', activeChatId)
                .order('created_at', { ascending: true }); // older on top

            if (fetchError) {
                // If the activeChatId is actually a user ID because we came from a profile,
                // this might fail or return empty gracefully. We tolerate it.
                if (fetchError.code === '22P02') {
                    // Invalid UUID syntax could happen, but we assume it's valid UUID format
                    setMessages([]);
                    return;
                }
            }

            if (data) {
                const formatted: ChatMessage[] = data.map((msg: any) => ({
                    ...msg,
                    sender: msg.sender_id === user.id ? 'me' : 'them',
                    time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }));
                setMessages(formatted);
            } else {
                setMessages([]);
            }
        } catch (err: any) {
            console.error('Error fetching messages for chatId:', activeChatId);
            console.error('Details:', err?.message || err);
            // Don't show hard error if it's just a missing chat room
            setMessages([]);
        } finally {
            setLoading(false);
        }
    }, [user, activeChatId]);

    useEffect(() => {
        fetchMessages();

        if (!user || !activeChatId) return;

        // Subscribing to real-time new messages
        const channel = supabase.channel(`chat_${activeChatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chat_id=eq.${activeChatId}`
                },
                (payload: any) => {
                    const newMsg = payload.new;
                    setMessages(prev => {
                        // Prevent duplicates
                        if (prev.find(m => m.id === newMsg.id)) return prev;

                        return [...prev, {
                            ...newMsg,
                            sender: newMsg.sender_id === user.id ? 'me' : 'them',
                            time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchMessages, user, activeChatId]);

    const ensureChatRoom = async (targetUserId: string): Promise<string | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[JIT Chat] Session active:", !!session);
        console.log("[JIT Chat] Auth User ID:", session?.user?.id);

        if (!user || user.id !== session?.user?.id) {
            console.warn("[JIT Chat] User mismatch or missing:", user?.id, session?.user?.id);
        }
        if (!user) return null;

        try {
            console.log("[JIT Chat] Verifying destination:", targetUserId);

            // 1. Is it already a valid chat room? 
            const { data: chatRoom } = await supabase
                .from('chats')
                .select('id')
                .eq('id', targetUserId)
                .single();

            if (chatRoom) {
                console.log("[JIT Chat] Destination is already a valid chat room ID.");
                return targetUserId;
            }

            // 2. Search for an EXISTING chat between us
            const { data: myParticipations } = await supabase
                .from('chat_participants')
                .select('chat_id')
                .eq('user_id', user.id);

            if (myParticipations && myParticipations.length > 0) {
                const myChatIds = myParticipations.map((p: { chat_id: string }) => p.chat_id);
                const { data: commonParticipations } = await supabase
                    .from('chat_participants')
                    .select('chat_id')
                    .in('chat_id', myChatIds)
                    .eq('user_id', targetUserId);

                if (commonParticipations && commonParticipations.length > 0) {
                    const existingChatId = commonParticipations[0].chat_id;
                    console.log("[JIT Chat] Found existing shared chat room:", existingChatId);
                    return existingChatId;
                }
            }

            // 3. Last resort: Create a new room
            console.log("[JIT Chat] No existing room found. Attempting to create...");
            const { data: newChat, error: createError } = await supabase
                .from('chats')
                .insert({ type: 'direct' })
                .select('id')
                .single();

            if (createError) {
                console.warn("[JIT Chat] RLS blocks chat creation:", createError.message);
                return null;
            }

            const newChatId = newChat.id;
            console.log("[JIT Chat] Room created:", newChatId);

            // Add participants
            await supabase.from('chat_participants').insert([
                { chat_id: newChatId, user_id: user.id },
                { chat_id: newChatId, user_id: targetUserId }
            ]);

            return newChatId;
        } catch (err) {
            console.error('[JIT Chat] Unexpected error:', err);
            return null;
        }
    };

    const sendMessage = async (content: string, mediaUrl: string | null = null, mediaType: string | null = null) => {
        if (!user || !activeChatId) return;

        let workingChatId = activeChatId;

        try {
            if (messages.length === 0) {
                console.log("[JIT Chat] No messages, checking room...");
                const realId = await ensureChatRoom(activeChatId);
                if (realId) {
                    workingChatId = realId;
                    if (realId !== activeChatId) {
                        setActiveChatId(realId);
                    }
                }
            }
        } catch (err) {
            console.error("[JIT Chat] Hook error:", err);
        }

        console.log("[JIT Chat] User:", user?.id);
        console.log("[JIT Chat] Inserting message to:", workingChatId);

        // Optimistic update
        const tempId = Date.now().toString();
        const optimisticMsg: ChatMessage = {
            id: tempId,
            chat_id: workingChatId,
            sender_id: user.id,
            content,
            media_url: mediaUrl,
            media_type: mediaType as any,
            created_at: new Date().toISOString(),
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    chat_id: workingChatId,
                    sender_id: user.id,
                    content,
                    media_url: mediaUrl,
                    media_type: mediaType
                })
                .select()
                .single();

            if (error) {
                console.error("Supabase insert error details:", error);
                throw error;
            }

            // Replace optimistic with real
            setMessages(prev => prev.map(m => m.id === tempId ? {
                ...data,
                sender: 'me',
                time: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            } : m));

        } catch (error) {
            console.error('Error sending message completely:', error);
            // Revert optimistic on fail
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    return {
        messages,
        loading,
        error,
        sendMessage
    };
}
