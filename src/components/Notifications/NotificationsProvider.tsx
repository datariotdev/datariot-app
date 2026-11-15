import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { supabase } from '../../lib/supabase/client';
import { fetchNotifications, fetchUnreadCount, markNotificationsRead } from '../../lib/supabase/notifications';
import { emptyNotifications, NotificationsStore } from '../../lib/notificationsStore';

const NotificationsContext = createContext<{ store: NotificationsStore; userId: string | null } | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const [store] = useState(() => new NotificationsStore({
        list: (id, unread, cursor, limit) => fetchNotifications(supabase, id, unread, cursor, limit),
        count: id => fetchUnreadCount(supabase, id),
        read: (id, options) => markNotificationsRead(supabase, id, options),
    }));

    useEffect(() => {
        store.setUser(userId);
        if (!userId || !supabase) return;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const schedule = () => {
            clearTimeout(timer);
            timer = setTimeout(() => { void store.refresh(); }, 150);
        };
        const channel = supabase.channel(`notifications:${userId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, schedule)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, schedule)
            .subscribe((status: string) => { if (status === 'SUBSCRIBED') schedule(); });
        const foreground = AppState.addEventListener('change', state => { if (state === 'active') schedule(); });
        // Reconcile after network interruptions even when Realtime is unavailable.
        const poll = setInterval(() => { if (AppState.currentState === 'active') schedule(); }, 30000);
        return () => {
            store.dispose();
            clearTimeout(timer);
            clearInterval(poll);
            foreground.remove();
            void supabase.removeChannel(channel);
        };
    }, [store, userId]);

    return <NotificationsContext.Provider value={{ store, userId }}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (!context) throw new Error('NotificationsProvider is missing');
    const { store, userId } = context;
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
    // Hide the previous account immediately, before effects dispose its requests.
    const visible = state.userId === userId ? state : emptyNotifications;
    return { ...visible, refresh: store.refresh, loadMore: store.loadMore, setFilter: store.setFilter, markRead: store.markRead };
}
