import { useEffect, useState } from 'react';
import { supabase } from '../client';
import { normalizeUsernameQuery, searchUsers, SearchProfile } from '../searchUsers';

export function useUserSearch(rawQuery: string, excludeUserId?: string) {
    const query = normalizeUsernameQuery(rawQuery);
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState<{
        query: string;
        excludeUserId?: string;
        users: SearchProfile[];
        loading: boolean;
        error: string | null;
    }>({ query: '', users: [], loading: false, error: null });

    useEffect(() => {
        if (!query) return;
        let active = true;
        const controller = new AbortController();
        setResult({ query, excludeUserId, users: [], loading: true, error: null });
        const timer = setTimeout(async () => {
            try {
                if (!supabase) throw new Error('Search is unavailable');
                const users = await searchUsers(supabase, query, excludeUserId, controller.signal);
                if (active) setResult({ query, excludeUserId, users, loading: false, error: null });
            } catch {
                if (active) setResult({ query, excludeUserId, users: [], loading: false, error: 'Couldn’t search users. Please try again.' });
            }
        }, 300);

        return () => {
            active = false;
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, excludeUserId, attempt]);

    // Never show the previous query's rows, even before the effect runs.
    const current = !!query && result.query === query && result.excludeUserId === excludeUserId;
    return {
        users: current ? result.users : [],
        loading: !!query && (!current || result.loading),
        error: current ? result.error : null,
        retry: () => setAttempt(value => value + 1),
    };
}
