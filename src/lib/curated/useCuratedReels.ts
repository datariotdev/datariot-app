import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { BUNDLED_REELS, CuratedReel, instagramCode } from './reels';

export function useCuratedReels(enabled: boolean, category?: string | null) {
    const [selection, setSelection] = useState<CuratedReel[]>(BUNDLED_REELS);

    useEffect(() => {
        if (!enabled || !supabase) return;
        let cancelled = false;
        const load = async () => {
            try {
                const { data, error } = await supabase.from('curated_reels')
                    .select('source_url,title,title_ru,creator,category,topic,language,duration_seconds,position')
                    .eq('is_active', true).order('position', { ascending: true }).limit(500);
                if (error) throw error;
                if (!cancelled) {
                    setSelection((data ?? []).filter((row: CuratedReel) => instagramCode(row.source_url)));
                }
            } catch {
                // The shipped public selection keeps Expo/offline previews useful.
                // A successful empty response remains authoritative (e.g. moderation).
            }
        };
        void load();
        return () => { cancelled = true; };
    }, [enabled]);

    return enabled ? selection.filter(reel => !category || reel.category === category) : [];
}
