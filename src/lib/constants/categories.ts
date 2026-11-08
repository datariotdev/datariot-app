export const VIDEO_CATEGORIES = [
    'Sport',
    'E-sports',
    'Engineering',
    'Logic',
    'AI',
    'Gaming',
    'Education',
    'Comedy',
    'Viral',
    'Lifestyle',
    'Debate',
    'Politics'
] as const;

export type VideoCategory = typeof VIDEO_CATEGORIES[number];

export const CATEGORY_DISPLAY_NAMES: Record<VideoCategory, string> = {
    'Sport': 'Sport',
    'E-sports': 'E-sports',
    'Engineering': 'Engineering',
    'Logic': 'Logic',
    'AI': 'AI',
    'Gaming': 'Gaming',
    'Education': 'Education',
    'Comedy': 'Comedy',
    'Viral': 'Trending',
    'Lifestyle': 'Lifestyle',
    'Debate': 'Debate',
    'Politics': 'Politics'
};
