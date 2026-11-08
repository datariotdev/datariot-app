import selection from './selection.json';
import type { Video } from '../supabase/hooks/useVideos';

export interface CuratedReel {
    source_url: string;
    title: string;
    title_ru: string | null;
    creator: string;
    category: string;
    topic: string | null;
    language: string | null;
    duration_seconds: number | null;
    position: number;
}

export const BUNDLED_REELS: CuratedReel[] = selection;

export function instagramCode(url: string): string | null {
    return /^https:\/\/www\.instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)\/$/.exec(url)?.[1] ?? null;
}

export function instagramEmbedUrl(url: string): string {
    if (!instagramCode(url)) throw new Error('Invalid Instagram source');
    return `${url}embed/`;
}

export type CuratedFeedEntry =
    | { key: string; kind: 'native'; video: Video }
    | { key: string; kind: 'instagram'; reel: CuratedReel };

export function mergeFeedEntries(videos: Video[], reels: CuratedReel[]): CuratedFeedEntry[] {
    const result: CuratedFeedEntry[] = [];
    const seen = new Set<string>();
    let nativeIndex = 0;
    for (const reel of reels) {
        const code = instagramCode(reel.source_url);
        if (!code || seen.has(code)) continue;
        seen.add(code);
        result.push({ key: `instagram:${code}`, kind: 'instagram', reel });
        if (seen.size % 6 === 0 && nativeIndex < videos.length) {
            const video = videos[nativeIndex++];
            result.push({ key: `native:${video.id}`, kind: 'native', video });
        }
    }
    for (const video of videos.slice(nativeIndex)) {
        result.push({ key: `native:${video.id}`, kind: 'native', video });
    }
    return result;
}
