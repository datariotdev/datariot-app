import { ActivityNotification, NotificationCursor, NOTIFICATION_PAGE_SIZE } from './supabase/notifications';

interface NotificationsApi {
    list: (userId: string, unreadOnly: boolean, cursor?: NotificationCursor, limit?: number) => Promise<ActivityNotification[]>;
    count: (userId: string) => Promise<number>;
    read: (userId: string, options: { id: string } | { through: NotificationCursor }) => Promise<string[]>;
}

export const emptyNotifications = {
    userId: null as string | null, items: [] as ActivityNotification[], unreadCount: 0,
    filter: 'all' as 'all' | 'unread', loading: false, refreshing: false, loadingMore: false,
    markingRead: false, hasMore: false, error: null as string | null, actionError: null as string | null,
};

export class NotificationsStore {
    private state = { ...emptyNotifications };
    private listeners = new Set<() => void>();
    private generation = 0;
    private scope = 0;
    private reading = false;
    private disposed = false;

    constructor(private api: NotificationsApi) {}
    getSnapshot = () => this.state;
    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    };
    private set(patch: Partial<typeof emptyNotifications>) {
        this.state = { ...this.state, ...patch };
        this.listeners.forEach(listener => listener());
    }
    setUser(userId: string | null) {
        const wasDisposed = this.disposed;
        this.disposed = false;
        if (userId === this.state.userId) {
            if (wasDisposed && userId) void this.refresh();
            return;
        }
        this.scope++;
        this.generation++;
        this.reading = false;
        this.set({ ...emptyNotifications, userId });
        if (userId) void this.refresh();
    }
    dispose() {
        this.disposed = true;
        this.scope++;
        this.generation++;
    }
    setFilter = (filter: 'all' | 'unread') => {
        if (filter === this.state.filter) return;
        this.set({ filter, items: [], hasMore: false });
        void this.refresh();
    };
    refresh = async () => {
        const { userId, filter } = this.state;
        if (!userId || this.disposed || this.reading) return;
        const generation = ++this.generation;
        const limit = Math.max(NOTIFICATION_PAGE_SIZE, Math.min(this.state.items.length, 1000));
        this.set({ loading: !this.state.items.length, refreshing: true, loadingMore: false, error: null });
        try {
            const [items, unreadCount] = await Promise.all([this.api.list(userId, filter === 'unread', undefined, limit), this.api.count(userId)]);
            if (generation !== this.generation || this.disposed) return;
            this.set({ items, unreadCount, hasMore: items.length === limit });
        } catch {
            if (generation === this.generation && !this.disposed) this.set({ error: 'Couldn’t load notifications. Please try again.' });
        } finally {
            if (generation === this.generation && !this.disposed) this.set({ loading: false, refreshing: false });
        }
    };
    loadMore = async () => {
        const { userId, filter, items, hasMore, refreshing, loadingMore } = this.state;
        if (!userId || !hasMore || refreshing || loadingMore || this.reading || this.disposed) return;
        const generation = this.generation;
        this.set({ loadingMore: true, error: null });
        try {
            const rows = await this.api.list(userId, filter === 'unread', items[items.length - 1]);
            if (generation !== this.generation || this.disposed) return;
            const merged = new Map([...this.state.items, ...rows].map(item => [item.id, item]));
            this.set({ items: [...merged.values()], hasMore: rows.length === NOTIFICATION_PAGE_SIZE });
        } catch {
            if (generation === this.generation && !this.disposed) this.set({ error: 'Couldn’t load older notifications. Please try again.' });
        } finally {
            if (generation === this.generation && !this.disposed) this.set({ loadingMore: false });
        }
    };
    markRead = async (id?: string) => {
        const { userId, items } = this.state;
        if (!userId || this.reading || this.disposed) return false;
        const item = id ? items.find(row => row.id === id) : items[0];
        if (!item || (id && item.is_read)) return true;
        const scope = this.scope;
        this.generation++; // An earlier GET cannot resurrect read badges.
        this.reading = true;
        this.set({ markingRead: true, actionError: null, loadingMore: false });
        let success = false;
        try {
            const ids = new Set(await this.api.read(userId, id ? { id } : { through: item }));
            if (scope !== this.scope || this.disposed) return false;
            const updated = this.state.items.map(row => ids.has(row.id) ? { ...row, is_read: true } : row);
            this.set({ items: this.state.filter === 'unread' ? updated.filter(row => !row.is_read) : updated,
                unreadCount: Math.max(0, this.state.unreadCount - ids.size) });
            success = true;
        } catch {
            if (scope === this.scope && !this.disposed) this.set({ actionError: 'Couldn’t mark notifications as read. Please try again.' });
        } finally {
            if (scope === this.scope && !this.disposed) {
                this.reading = false;
                this.set({ markingRead: false });
                await this.refresh();
            }
        }
        return success;
    };
}
