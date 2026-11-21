import React, { useState } from 'react';
import {
    ActivityIndicator, FlatList, Image, ImageSourcePropType, Modal, Pressable,
    StyleSheet, Text, useWindowDimensions, View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoSource, VideoView } from 'expo-video';
import { SafeAreaView } from '../components/UI/SafeAreaView';
import { useTheme } from '../components/Theme/ThemeProvider';
import { ANIMATED_SHORTS_CATEGORY } from '../lib/constants/categories';
import { useVideos } from '../lib/supabase/hooks/useVideos';

type Short = {
    id: string;
    title: string;
    credit: string;
    source: VideoSource;
    cover?: ImageSourcePropType;
    authorId?: string;
};

const pilots: Short[] = [
    {
        id: 'address-machine',
        title: 'The Address Machine',
        credit: 'Datariot Editorial · DNS',
        source: require('../../assets/animated-shorts/Datariot-The-Address-Machine.mp4'),
        cover: require('../../assets/animated-shorts/Datariot-The-Address-Machine.jpg'),
    },
    {
        id: 'signal-duet',
        title: 'The Signal Duet',
        credit: 'Datariot Editorial · Bluetooth',
        source: require('../../assets/animated-shorts/Datariot-The-Signal-Duet.mp4'),
        cover: require('../../assets/animated-shorts/Datariot-The-Signal-Duet.jpg'),
    },
    {
        id: 'thirsty-seed',
        title: 'The Thirsty Seed',
        credit: 'Datariot Editorial · Space gardening',
        source: require('../../assets/animated-shorts/Datariot-The-Thirsty-Seed.mp4'),
        cover: require('../../assets/animated-shorts/Datariot-The-Thirsty-Seed.jpg'),
    },
];

function ShortsPlayer({ short }: { short: Short }) {
    const { height } = useWindowDimensions();
    const player = useVideoPlayer(short.source);
    const { status } = useEvent(player, 'statusChange', { status: player.status });
    const maxHeight = Math.min(height * 0.77, 680);

    return (
        <View style={[styles.player, { width: Math.min(390, maxHeight * 9 / 16), height: maxHeight }]}>
            <VideoView player={player} nativeControls contentFit="contain" style={StyleSheet.absoluteFill} />
            {status === 'loading' && (
                <View pointerEvents="none" style={styles.playerState}>
                    <ActivityIndicator color="#D9E4FF" />
                </View>
            )}
            {status === 'error' && (
                <View style={styles.playerState}>
                    <Text style={styles.playerTitle}>Couldn’t load this short.</Text>
                </View>
            )}
        </View>
    );
}

export default function AnimatedShortsScreen() {
    const router = useRouter();
    const { theme, mode } = useTheme();
    const { width } = useWindowDimensions();
    const [selected, setSelected] = useState<Short | null>(null);
    const {
        videos, loading, refreshing, refresh, loadMore, fetchError,
    } = useVideos({ type: 'trending', category: ANIMATED_SHORTS_CATEGORY });

    const ink = theme.colors.text.primary;
    const secondaryInk = theme.colors.text.secondary;
    const paper = mode === 'dark' ? '#151D2D' : '#EAF0FA';
    const cardWidth = Math.min(208, Math.max(145, 316 * width / 720));
    const community = videos.map((video): Short => ({
        id: video.id,
        title: video.title,
        credit: video.author,
        source: video.videoUrl,
        cover: video.thumbnailUrl ? { uri: video.thumbnailUrl } : undefined,
        authorId: video.authorId,
    }));

    const closePlayer = () => setSelected(null);
    const back = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)/discover');
        }
    };

    function card(short: Short) {
        const { authorId } = short;
        return (
            <View style={[styles.card, { width: cardWidth }]}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Play ${short.title}`} onPress={() => setSelected(short)}>
                    <View style={[styles.cover, { backgroundColor: paper }]}>
                        {short.cover ? (
                            <Image source={short.cover} resizeMode="cover" style={StyleSheet.absoluteFill} />
                        ) : (
                            <Ionicons name="film-outline" size={52} color={secondaryInk} />
                        )}
                        <View style={styles.playIcon}>
                            <Ionicons name="play" size={17} color="#142338" />
                        </View>
                    </View>
                    <Text numberOfLines={2} style={[styles.cardTitle, { color: ink }]}>{short.title}</Text>
                </Pressable>
                {authorId ? (
                    <Pressable
                        accessibilityRole="link"
                        onPress={() => router.push({ pathname: '/user/[id]', params: { id: authorId } })}
                    >
                        <Text numberOfLines={1} style={[styles.credit, { color: secondaryInk }]}>{short.credit}</Text>
                    </Pressable>
                ) : (
                    <Text numberOfLines={2} style={[styles.credit, { color: secondaryInk }]}>{short.credit}</Text>
                )}
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.page}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.toolbar}>
                <Pressable accessibilityRole="button" accessibilityLabel="Back to Discover" hitSlop={8} onPress={back} style={styles.back}>
                    <Ionicons name="arrow-back" size={22} color={ink} />
                    <Text style={[styles.backText, { color: ink }]}>Discover</Text>
                </Pressable>
            </View>
            <FlatList
                data={community}
                keyExtractor={(short) => short.id}
                renderItem={({ item }) => card(item)}
                numColumns={width >= 680 ? 3 : 2}
                key={width >= 680 ? 3 : 2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.content}
                refreshing={refreshing}
                onRefresh={refresh}
                onEndReached={loadMore}
                ListHeaderComponent={(
                    <>
                        <View style={[styles.hero, { backgroundColor: paper }]}>
                            <Text accessibilityRole="header" style={[styles.title, { color: ink }]}>Animated Shorts</Text>
                            <Text style={[styles.subtitle, { color: secondaryInk }]}>Little stories about how things work.</Text>
                        </View>
                        <Text style={[styles.heading, { color: ink }]}>Datariot pilots</Text>
                        <View style={styles.pilots}>
                            {pilots.map((short) => <View key={short.id}>{card(short)}</View>)}
                        </View>
                        <View style={styles.communityHeader}>
                            <Text style={[styles.heading, { color: ink }]}>From creators</Text>
                            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/(tabs)/create', params: { category: ANIMATED_SHORTS_CATEGORY } })} style={[styles.upload, { backgroundColor: paper }]}>
                                <Ionicons name="add" size={18} color={ink} />
                                <Text style={[styles.backText, { color: ink }]}>Upload a short</Text>
                            </Pressable>
                        </View>
                    </>
                )}
                ListEmptyComponent={loading ? (
                    <ActivityIndicator color={ink} style={styles.empty} />
                ) : fetchError ? (
                    <Pressable accessibilityRole="button" onPress={refresh} style={styles.empty}>
                        <Text style={{ color: ink }}>Couldn’t load creator shorts. Tap to retry.</Text>
                    </Pressable>
                ) : (
                    <Text style={[styles.empty, { color: secondaryInk }]}>
                        Choose Animated Shorts when publishing to share your cartoon here.
                    </Text>
                )}
            />
            {selected && (
                <Modal animationType="fade" onRequestClose={closePlayer}>
                    <SafeAreaView style={styles.playerPage}>
                        <View style={styles.playerBar}>
                            <Text numberOfLines={2} style={styles.playerTitle}>{selected.title}</Text>
                            <Pressable accessibilityRole="button" accessibilityLabel="Close player" hitSlop={10} onPress={closePlayer}>
                                <Ionicons name="close" color="#F1F5FA" size={26} />
                            </Pressable>
                        </View>
                        <ShortsPlayer short={selected} />
                    </SafeAreaView>
                </Modal>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1 },
    toolbar: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    back: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, paddingVertical: 4 },
    backText: { fontSize: 14, fontWeight: '600' },
    content: { width: '100%', maxWidth: 880, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 36 },
    hero: { borderRadius: 22, padding: 22, marginBottom: 24 },
    title: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 36, letterSpacing: -1.7 },
    subtitle: { fontSize: 15, marginTop: 5 },
    heading: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 22 },
    pilots: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', marginTop: 12, marginBottom: 20 },
    row: { flexWrap: 'wrap', columnGap: 14 },
    card: { paddingBottom: 12 },
    cover: { width: '100%', aspectRatio: 540 / 744, borderRadius: 15, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    playIcon: { position: 'absolute', right: 9, bottom: 9, width: 34, height: 34, borderRadius: 17, backgroundColor: '#EDF4FF', alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '700', marginTop: 7 },
    credit: { fontSize: 12, marginTop: 3 },
    communityHeader: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    upload: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 10, borderRadius: 13 },
    empty: { paddingVertical: 14, lineHeight: 22 },
    playerPage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0E18' },
    playerBar: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', maxWidth: 440, paddingHorizontal: 20, paddingBottom: 12 },
    playerTitle: { flex: 1, color: '#F1F5FA', fontSize: 18, fontWeight: '700' },
    player: { overflow: 'hidden', borderRadius: 14, backgroundColor: '#101827' },
    playerState: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: 20 },
});
