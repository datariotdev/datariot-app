import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Image, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../Theme/ThemeProvider';
import { Video } from '../../lib/supabase/hooks/useVideos';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const CARD_WIDTH = isWeb ? 252 : SCREEN_WIDTH * 0.75;
const CARD_HEIGHT = CARD_WIDTH * 1.32;
const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

interface DiscoveryCarouselProps {
    videos: Video[];
    onSelect: (id: string) => void;
}

const Card = ({ item, index, onSelect }: { item: Video; index: number; onSelect: () => void }) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const [hovered, setHovered] = useState(false);
    const accent = theme.colors.primary.DEFAULT;

    return (
        <Pressable
            onPress={onSelect}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={[
                styles.card,
                {
                    borderColor: hovered
                        ? (isDark ? 'rgba(217, 228, 255, 0.4)' : 'rgba(76, 110, 245, 0.4)')
                        : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'),
                    transform: [{ translateY: hovered ? -5 : 0 }],
                    shadowColor: isDark ? '#000' : '#6B7FCC',
                    shadowOpacity: hovered ? 0.5 : 0.22,
                    shadowRadius: hovered ? 26 : 12,
                    shadowOffset: { width: 0, height: hovered ? 12 : 5 },
                },
            ]}
        >
            <Image
                source={{ uri: item.thumbnailUrl || `https://picsum.photos/seed/${item.id}/500/700` }}
                style={[
                    StyleSheet.absoluteFillObject,
                    {
                        // @ts-ignore web transition
                        transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                        transform: [{ scale: hovered ? 1.06 : 1 }],
                    },
                ]}
                resizeMode="cover"
            />

            <LinearGradient
                colors={['rgba(4,5,9,0.25)', 'rgba(4,5,9,0.5)', 'rgba(4,5,9,0.95)']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
            />

            {/* Corner brackets on hover */}
            {hovered && (
                <>
                    <View style={[styles.bracket, styles.bTL, { borderColor: accent }]} pointerEvents="none" />
                    <View style={[styles.bracket, styles.bBR, { borderColor: accent }]} pointerEvents="none" />
                </>
            )}

            {/* Match badge */}
            <View style={styles.topRow} pointerEvents="none">
                <View style={[styles.matchBadge, { borderColor: 'rgba(52, 211, 153, 0.5)' }]}>
                    <View style={styles.matchDot} />
                    <Text style={[styles.matchText, { fontFamily: MONO }]}>{item.dnaMatch || 90}%</Text>
                </View>
                <Text style={[styles.slot, { color: 'rgba(255,255,255,0.45)', fontFamily: MONO }]}>
                    {String(index + 1).padStart(2, '0')}
                </Text>
            </View>

            {/* Rationale slides in on hover instead of sitting there permanently */}
            {hovered && (
                <View style={[styles.rationaleBox, { borderColor: isDark ? 'rgba(217, 228, 255, 0.25)' : 'rgba(76, 110, 245, 0.3)' }]} pointerEvents="none">
                    <Text style={[styles.rationaleText, { fontFamily: MONO }]} numberOfLines={3}>
                        {item.dnaRationale || 'Matches your interest in high-tech content'}
                    </Text>
                </View>
            )}

            <View style={styles.playWrap} pointerEvents="none">
                <View style={[styles.playRing, { borderColor: hovered ? accent : 'rgba(255,255,255,0.22)' }]}>
                    <Ionicons name="play" size={15} color={hovered ? accent : 'rgba(255,255,255,0.7)'} />
                </View>
            </View>

            <View style={styles.info} pointerEvents="none">
                <Text style={[styles.author, { color: accent, fontFamily: MONO }]} numberOfLines={1}>
                    {item.author ? `@${item.author.toLowerCase()}` : '@unknown'}
                </Text>
                <Text style={[styles.title, { fontFamily: theme.typography.fontFamilies.bold }]} numberOfLines={2}>
                    {item.title || 'UNTITLED'}
                </Text>
            </View>
        </Pressable>
    );
};

export const DiscoveryCarousel: React.FC<DiscoveryCarouselProps> = ({ videos, onSelect }) => {
    return (
        <View style={styles.container}>
            <FlatList
                data={videos}
                renderItem={({ item, index }) => (
                    <Card item={item} index={index} onSelect={() => onSelect(item.id)} />
                )}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + 14}
                decelerationRate="fast"
                contentContainerStyle={styles.contentContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: CARD_HEIGHT + 24,
    },
    contentContainer: {
        paddingHorizontal: isWeb ? 0 : 16,
        paddingVertical: 8,
        gap: 14,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
        backgroundColor: '#0B0C11',
        // @ts-ignore
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease, box-shadow 0.3s ease',
        // @ts-ignore
        cursor: 'pointer',
    },
    bracket: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderWidth: 1.5,
        zIndex: 6,
    },
    bTL: { top: 8, left: 8, borderRightWidth: 0, borderBottomWidth: 0 },
    bBR: { bottom: 8, right: 8, borderLeftWidth: 0, borderTopWidth: 0 },
    topRow: {
        position: 'absolute',
        top: 12,
        left: 14,
        right: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 5,
    },
    matchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 4,
        borderWidth: 1,
        backgroundColor: 'rgba(6, 30, 22, 0.7)',
    },
    matchDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#34D399',
    },
    matchText: {
        color: '#34D399',
        fontSize: 8.5,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    slot: {
        fontSize: 9.5,
        letterSpacing: 1.2,
    },
    rationaleBox: {
        position: 'absolute',
        top: 42,
        left: 14,
        right: 14,
        padding: 9,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: 'rgba(8, 9, 14, 0.82)',
        zIndex: 5,
    },
    rationaleText: {
        color: 'rgba(255, 255, 255, 0.78)',
        fontSize: 9,
        lineHeight: 14,
        letterSpacing: 0.4,
    },
    playWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playRing: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(6, 7, 12, 0.35)',
        // @ts-ignore
        transition: 'all 0.25s ease',
    },
    info: {
        position: 'absolute',
        bottom: 14,
        left: 14,
        right: 14,
    },
    author: {
        fontSize: 9.5,
        fontWeight: '700',
        marginBottom: 5,
        letterSpacing: 1,
    },
    title: {
        color: '#FFF',
        fontSize: 13,
        lineHeight: 17,
        letterSpacing: -0.1,
    },
});
