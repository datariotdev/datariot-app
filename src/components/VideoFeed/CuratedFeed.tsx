import React, { useEffect, useMemo, useState } from 'react';
import {
    FlatList, Image, Linking, Modal, Pressable, StyleSheet,
    Text, useWindowDimensions, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../Theme/ThemeProvider';
import type { Video } from '../../lib/supabase/hooks/useVideos';
import { CuratedFeedEntry, CuratedReel, mergeFeedEntries } from '../../lib/curated/reels';
import InstagramEmbed from './InstagramEmbed';

interface Props {
    videos: Video[];
    reels: CuratedReel[];
    grid: boolean;
    isFocused: boolean;
    paddingTop: number;
    onEndReached: () => void;
    onSelectNative: (id: string) => void;
}

function readableDuration(seconds: number | null) {
    return seconds ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : null;
}

function FeedCard({ entry, onPress, grid }: { entry: CuratedFeedEntry; onPress: () => void; grid: boolean }) {
    const { theme } = useTheme();
    const external = entry.kind === 'instagram';
    const title = external ? entry.reel.title : entry.video.title;
    const creator = external ? entry.reel.creator : entry.video.author;
    const topic = external ? entry.reel.topic || entry.reel.category : entry.video.category;
    const duration = external ? readableDuration(entry.reel.duration_seconds) : null;
    const thumbnail = entry.kind === 'native' ? entry.video.thumbnailUrl : null;
    const realThumbnail = thumbnail && !/picsum\.photos|pravatar\.cc/.test(thumbnail);

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Watch ${title} by ${creator}`}
            style={[styles.card, { backgroundColor: theme.colors.surface.card,
                borderColor: theme.colors.surface.border, minHeight: grid ? 250 : 210 }]}
        >
            {realThumbnail && <Image source={{ uri: thumbnail }} style={styles.thumbnail} accessibilityIgnoresInvertColors />}
            <View style={styles.cardTop}>
                <Text style={[styles.source, { color: theme.colors.text.secondary }]}>{external ? 'INSTAGRAM' : 'DATARIOT'}</Text>
                {duration && <Text style={[styles.duration, { color: theme.colors.text.secondary }]}>{duration}</Text>}
            </View>
            <View style={[styles.play, { backgroundColor: theme.colors.primary.glow }]}>
                <Ionicons name="play" size={24} color={theme.colors.primary.DEFAULT} />
            </View>
            <Text style={[styles.topic, { color: theme.colors.primary.DEFAULT }]} numberOfLines={1}>{topic}</Text>
            <Text style={[styles.title, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}
                numberOfLines={grid ? 4 : 3}>{title}</Text>
            <Text style={[styles.creator, { color: theme.colors.text.secondary }]} numberOfLines={2}>{creator}</Text>
            {external && <Text style={[styles.watch, { color: theme.colors.primary.DEFAULT }]}>Watch reel ↗</Text>}
        </Pressable>
    );
}

export function CuratedFeed({ videos, reels, grid, isFocused, paddingTop, onEndReached, onSelectNative }: Props) {
    const { theme } = useTheme();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);
    const [openingError, setOpeningError] = useState(false);
    const data = useMemo(() => mergeFeedEntries(videos, reels), [videos, reels]);
    const columns = grid ? (width > 1100 ? 3 : 2) : 1;
    const selectedIndex = reels.findIndex(reel => reel.source_url === selectedUrl);
    const selected = reels[selectedIndex];

    useEffect(() => {
        if (!isFocused) setSelectedUrl(null);
    }, [isFocused]);
    useEffect(() => { setFailed(false); setOpeningError(false); }, [selectedUrl]);

    const openOriginal = async () => {
        if (!selected) return;
        try { await Linking.openURL(selected.source_url); }
        catch { setOpeningError(true); }
    };

    return (
        <>
            <FlatList
                key={`curated-${columns}`}
                data={data}
                keyExtractor={entry => entry.key}
                numColumns={columns}
                contentContainerStyle={{ paddingTop, paddingBottom: 120, paddingHorizontal: 8 }}
                showsVerticalScrollIndicator={false}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.3}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={5}
                ListHeaderComponent={
                    <View style={styles.heading}>
                        <Text style={[styles.headingTitle, { color: theme.colors.text.primary }]}>Worth your time</Text>
                        <Text style={{ color: theme.colors.text.secondary }}>
                            {reels.length} selected reels · ideas, science & how things work
                        </Text>
                    </View>
                }
                ListEmptyComponent={<Text style={[styles.heading, { color: theme.colors.text.secondary }]}>No videos in this category.</Text>}
                renderItem={({ item }) => (
                    <View style={{ width: `${100 / columns}%`, padding: 6 }}>
                        <FeedCard entry={item} grid={columns > 1} onPress={() => {
                            if (item.kind === 'instagram') setSelectedUrl(item.reel.source_url);
                            else onSelectNative(item.video.id);
                        }} />
                    </View>
                )}
            />
            {selected && isFocused && (
                <Modal visible animationType="slide" onRequestClose={() => setSelectedUrl(null)}>
                    <View style={[styles.modal, { backgroundColor: theme.colors.background.primary,
                        paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                        <View style={styles.toolbar}>
                            <Pressable accessibilityRole="button" accessibilityLabel="Close Instagram player"
                                onPress={() => setSelectedUrl(null)} style={styles.iconButton}>
                                <Ionicons name="close" size={25} color={theme.colors.text.primary} />
                            </Pressable>
                            <Text style={[styles.source, { color: theme.colors.text.secondary }]}>INSTAGRAM · {selectedIndex + 1} / {reels.length}</Text>
                            <Pressable accessibilityRole="link" accessibilityLabel="Open original on Instagram"
                                onPress={openOriginal} style={styles.iconButton}>
                                <Ionicons name="open-outline" size={22} color={theme.colors.text.primary} />
                            </Pressable>
                        </View>
                        <View style={styles.caption}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]} numberOfLines={2}>{selected.title}</Text>
                            <Text style={{ color: theme.colors.text.secondary }} numberOfLines={1}>{selected.creator}</Text>
                        </View>
                        <View style={styles.embed}>
                            {failed ? (
                                <View style={[styles.fallback, { backgroundColor: theme.colors.surface.card }]}>
                                    <Ionicons name="logo-instagram" size={36} color={theme.colors.primary.DEFAULT} />
                                    <Text style={[styles.failureText, { color: theme.colors.text.primary }]}>Instagram couldn’t load this reel here.</Text>
                                    <Pressable accessibilityRole="link" onPress={openOriginal} style={styles.openButton}>
                                        <Text style={{ color: theme.colors.primary.DEFAULT }}>Open original on Instagram ↗</Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <InstagramEmbed key={selected.source_url} sourceUrl={selected.source_url}
                                    title={selected.title} onError={() => setFailed(true)} />
                            )}
                        </View>
                        <View style={styles.playerFooter}>
                            <Pressable accessibilityRole="button" accessibilityLabel="Previous reel" disabled={selectedIndex === 0}
                                onPress={() => setSelectedUrl(reels[selectedIndex - 1].source_url)}
                                style={[styles.iconButton, selectedIndex === 0 && styles.disabled]}>
                                <Ionicons name="chevron-back" size={25} color={theme.colors.text.primary} />
                            </Pressable>
                            <Pressable accessibilityRole="link" onPress={openOriginal} style={styles.openButton}>
                                <Text style={{ color: theme.colors.primary.DEFAULT }}>Open Instagram ↗</Text>
                            </Pressable>
                            <Pressable accessibilityRole="button" accessibilityLabel="Next reel" disabled={selectedIndex === reels.length - 1}
                                onPress={() => setSelectedUrl(reels[selectedIndex + 1].source_url)}
                                style={[styles.iconButton, selectedIndex === reels.length - 1 && styles.disabled]}>
                                <Ionicons name="chevron-forward" size={25} color={theme.colors.text.primary} />
                            </Pressable>
                        </View>
                        {openingError && <Text style={[styles.failureText, { color: theme.colors.text.secondary }]}>Couldn’t open Instagram. Please try again.</Text>}
                    </View>
                </Modal>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    heading: { paddingHorizontal: 12, paddingVertical: 20, gap: 6 },
    headingTitle: { fontSize: 24, fontWeight: '800' },
    card: { borderWidth: 1, borderRadius: 18, padding: 16, overflow: 'hidden' },
    thumbnail: { height: 130, width: '100%', borderRadius: 10, marginBottom: 12 },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
    source: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    duration: { fontSize: 11 },
    play: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
    topic: { fontSize: 10, fontWeight: '700', marginBottom: 6 },
    title: { fontSize: 16, lineHeight: 21, fontWeight: '700', marginBottom: 8 },
    creator: { fontSize: 11, lineHeight: 16 },
    watch: { marginTop: 14, fontSize: 11, fontWeight: '700' },
    modal: { flex: 1 },
    toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
    iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    caption: { paddingHorizontal: 20, paddingBottom: 12, gap: 4 },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    embed: { flex: 1, width: '100%', maxWidth: 540, alignSelf: 'center', minHeight: 250, backgroundColor: '#fff' },
    fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
    failureText: { textAlign: 'center', paddingHorizontal: 20, paddingBottom: 8 },
    playerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
    openButton: { padding: 14, minHeight: 44, justifyContent: 'center' },
    disabled: { opacity: 0.3 },
});
