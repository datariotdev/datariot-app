import { useState, useEffect, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../client';
import { useAuth } from './useAuth';

type MessageRow = {
    id: string;
    chat_id: string;
    sender_id: string | null;
    content: string | null;
    media_url: string | null;
    media_type: 'image' | 'video' | 'audio' | null;
    created_at: string;
};

type ChatMessage = MessageRow & { sender: 'me' | 'them'; time: string };

type Conversation = {
    scope: string;
    id: string | null;
    messages: ChatMessage[];
    error: string | null;
};

function formatMessage(message: MessageRow, userId: string): ChatMessage {
    return {
        ...message,
        sender: message.sender_id === userId ? 'me' : 'them',
        time: new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
}

export function useMessages(chatId: string, recipientId?: string) {
    const { user, loading: authLoading } = useAuth();
    const userId = user?.id;
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [attempt, setAttempt] = useState(0);
    const scope = JSON.stringify([userId, chatId, recipientId, attempt]);
    const current = conversation?.scope === scope ? conversation : null;

    const appendMessage = useCallback((message: ChatMessage) => {
        setConversation(previous => {
            if (previous?.scope !== scope || previous.messages.some(item => item.id === message.id)) return previous;
            return { ...previous, messages: [...previous.messages, message] };
        });
    }, [scope]);

    useEffect(() => {
        if (authLoading) return;
        if (!userId || !supabase) {
            setConversation({ scope, id: null, messages: [], error: 'Sign in to open this conversation.' });
            return;
        }

        let active = true;
        let channel: RealtimeChannel | undefined;
        const pending: ChatMessage[] = [];
        let initialLoadDone = false;

        async function loadConversation(senderId: string) {
            try {
                const id = recipientId
                    ? await supabase.rpc('get_or_create_direct_chat', { recipient_id: recipientId })
                    : await supabase.from('chats').select('id').eq('id', chatId).maybeSingle();
                const resolvedId = recipientId ? id.data : id.data?.id;
                if (id.error || typeof resolvedId !== 'string') throw id.error ?? new Error('Chat unavailable');
                if (!active) return;

                channel = supabase.channel(`messages:${resolvedId}`)
                    .on('postgres_changes', {
                        event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${resolvedId}`,
                    }, ({ new: row }: { new: MessageRow }) => {
                        if (!active) return;
                        const message = formatMessage(row, senderId);
                        if (initialLoadDone) appendMessage(message);
                        else pending.push(message);
                    })
                    .subscribe();

                const { data, error } = await supabase.from('messages').select('*')
                    .eq('chat_id', resolvedId).order('created_at');
                if (error) throw error;
                if (!active) return;

                const history = ((data ?? []) as MessageRow[]).map(row => formatMessage(row, senderId));
                const byId = new Map([...history, ...pending].map(message => [message.id, message]));
                const messages = [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
                setConversation({ scope, id: resolvedId, messages, error: null });
                initialLoadDone = true;
            } catch (error) {
                if (!active) return;
                console.warn('Could not open conversation:', error);
                setConversation({ scope, id: null, messages: [], error: 'Couldn’t open this conversation.' });
            }
        }

        void loadConversation(userId);
        return () => {
            active = false;
            if (channel) void supabase.removeChannel(channel);
        };
    }, [authLoading, userId, chatId, recipientId, scope, appendMessage]);

    const sendMessage = async (content: string, mediaUrl: string | null = null, mediaType: MessageRow['media_type'] = null) => {
        if (!current?.id || !userId || !supabase) throw new Error('Chat unavailable');
        const { data, error } = await supabase.from('messages').insert({
            chat_id: current.id, sender_id: userId, content, media_url: mediaUrl, media_type: mediaType,
        }).select().single();
        if (error) throw error;
        appendMessage(formatMessage(data as MessageRow, userId));
    };

    return {
        chatId: current?.id ?? null,
        messages: current?.messages ?? [],
        loading: !current,
        error: current?.error ?? null,
        retry: () => setAttempt(value => value + 1),
        sendMessage,
    };
}
