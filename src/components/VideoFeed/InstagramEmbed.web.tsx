import React from 'react';
import { instagramEmbedUrl } from '../../lib/curated/reels';

interface Props { sourceUrl: string; title: string; onError: () => void }

export default function InstagramEmbed({ sourceUrl, title, onError }: Props) {
    return React.createElement('iframe', {
        src: instagramEmbedUrl(sourceUrl),
        title: `${title} — Instagram player`,
        allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture',
        allowFullScreen: true,
        onError,
        style: { width: '100%', height: '100%', border: 0, backgroundColor: '#fff' },
    });
}
