import type { SupabaseClient } from '@supabase/supabase-js';

export interface ActivityNotification {
    id: string;
    user_id: string;
    actor_id: string | null;
    type: string;
    title: string | null;
    body: string | null;
    video_id: string | null;
    post_id: string | null;
    comment_id: string | null;
    chat_id: string | null;
    created_at: string;
    is_read: boolean;
    actor?: { username: string; display_name: string | null; avatar_url: string | null } | null;
}

export type NotificationCursor = Pick<ActivityNotification, 'created_at' | 'id'>;
export const NOTIFICATION_PAGE_SIZE = 30;
const FIELDS = 'id,user_id,actor_id,type,title,body,video_id,post_id,comment_id,chat_id,created_at,is_read';

export async function fetchNotifications(client: SupabaseClient, userId: string, unreadOnly = false, cursor?: NotificationCursor, limit = NOTIFICATION_PAGE_SIZE) {
    let query = client.from('notifications').select(FIELDS).eq('user_id', userId)
        .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limit);
    if (unreadOnly) query = query.eq('is_read', false);
    if (cursor) query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data ?? []) as ActivityNotification[];
    const ids = [...new Set(rows.map(row => row.actor_id).filter((id): id is string => !!id))];
    if (!ids.length) return rows;
    const profiles = await client.from('profiles').select('id,username,display_name,avatar_url').in('id', ids);
    if (profiles.error) throw profiles.error;
    const actors = new Map((profiles.data ?? []).map(profile => [profile.id, profile]));
    return rows.map(row => ({ ...row, actor: row.actor_id ? actors.get(row.actor_id) ?? null : null }));
}

export async function fetchUnreadCount(client: SupabaseClient, userId: string) {
    const { count, error } = await client.from('notifications').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('is_read', false);
    if (error) throw error;
    return count ?? 0;
}

export async function markNotificationsRead(client: SupabaseClient, userId: string, options: { id: string } | { through: NotificationCursor }) {
    let query = client.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    if ('id' in options) query = query.eq('id', options.id);
    else {
        const cursor = options.through;
        // New arrivals stay unread, including those sharing the newest timestamp.
        query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lte.${cursor.id})`);
    }
    const { data, error } = await query.select('id');
    if (error) throw error;
    return (data ?? []).map(row => row.id as string);
}

export function notificationTarget(item: ActivityNotification) {
    if (item.type === 'follow' && item.actor_id) return { pathname: '/user/[id]' as const, params: { id: item.actor_id } };
    if (item.type === 'message' && item.chat_id) return { pathname: '/chat/[id]' as const, params: { id: item.chat_id, name: item.actor?.display_name || item.actor?.username || 'Chat' } };
    if (item.post_id) return { pathname: '/debate/[id]' as const, params: { id: item.post_id } };
    if (item.video_id) return { pathname: '/video-player' as const, params: { videoId: item.video_id, initialVideoId: item.video_id, openComments: item.comment_id ? '1' : '' } };
    return null;
}

export function notificationTime(value: string, now = Date.now()) {
    const date = new Date(value);
    const minutes = Math.max(0, Math.floor((now - date.getTime()) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
