import type { SupabaseClient } from '@supabase/supabase-js';

export interface SearchProfile {
    id: string;
    username: string;
    display_name: string | null;
    nickname: string | null;
    avatar_url: string | null;
}

export function normalizeUsernameQuery(query: string) {
    return query.trim().replace(/^@+/, '').trim();
}

const PROFILE_FIELDS = 'id, username, display_name, nickname, avatar_url';
const RESULT_LIMIT = 20;

export async function searchUsers(
    client: SupabaseClient,
    rawQuery: string,
    excludeUserId?: string,
    signal?: AbortSignal,
): Promise<SearchProfile[]> {
    const query = normalizeUsernameQuery(rawQuery);
    if (!query) return [];

    // A literal, case-insensitive regex also avoids PostgREST's '*' LIKE alias.
    const pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const request = (value: string) => {
        let builder = client.from('profiles').select(PROFILE_FIELDS)
            .filter('username', 'imatch', value).order('username').order('id').limit(RESULT_LIMIT);
        if (excludeUserId) builder = builder.neq('id', excludeUserId);
        if (signal) builder = builder.abortSignal(signal);
        return builder;
    };

    // Fetch exact matches independently so they cannot fall outside the partial limit.
    const [exact, partial] = await Promise.all([request(`^${pattern}$`), request(pattern)]);
    if (exact.error) throw exact.error;
    if (partial.error) throw partial.error;

    const profiles = new Map<string, SearchProfile>();
    for (const profile of [...(exact.data || []), ...(partial.data || [])]) {
        if (!profiles.has(profile.id)) profiles.set(profile.id, profile as SearchProfile);
    }
    return [...profiles.values()].slice(0, RESULT_LIMIT);
}
