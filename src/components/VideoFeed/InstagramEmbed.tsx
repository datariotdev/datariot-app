import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { instagramEmbedUrl } from '../../lib/curated/reels';

interface Props { sourceUrl: string; title: string; onError: () => void }

export default function InstagramEmbed({ sourceUrl, onError }: Props) {
    return (
        <WebView
            source={{ uri: instagramEmbedUrl(sourceUrl) }}
            style={styles.player}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction
            startInLoadingState
            renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} size="large" />}
            onError={onError}
            onHttpError={event => { if (event.nativeEvent.statusCode >= 400) onError(); }}
            // Load Instagram's own player without extracting or replacing media.
            onShouldStartLoadWithRequest={request => {
                if (request.isTopFrame === false || request.url === 'about:blank') return true;
                const allowed = /^https:\/\/(?:www\.)?instagram\.com\/(?:reel|p)\/[A-Za-z0-9_-]+\/embed\//.test(request.url);
                if (!allowed) onError();
                return allowed;
            }}
        />
    );
}

const styles = StyleSheet.create({ player: { flex: 1, backgroundColor: '#fff' } });
