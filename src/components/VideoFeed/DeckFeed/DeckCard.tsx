import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import { useTheme } from '../../Theme/ThemeProvider';
import { encodeVideoUrl } from '../../../lib/utils/url';
import type { Video } from '../../../lib/supabase/hooks/useVideos';

const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

export type CardScale = 'hero' | 'wide' | 'standard' | 'compact';

interface DeckCardProps {
    item: Video;
    index: number;
    scale: CardScale;
    height: number;
    onSelect: () => void;
    onLike: () => void;
    onComment: () => void;
    onMore: () => void;
}

const formatNumber = (num: number): string => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
};

/** Deterministic per-id pseudo-random so the "signal" bars don't reshuffle on rerender. */
const signalFor = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return 55 + (h % 45);
};

export const DeckCard = ({
    item,
    index,
    scale,
    height,
    onSelect,
    onLike,
    onComment,
    onMore,
}: DeckCardProps) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const [hovered, setHovered] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Only the hovered card ever mounts a <Video>, so at most one decodes at a time.
    useEffect(() => {
        if (hovered && item.videoUrl) {
            hoverTimer.current = setTimeout(() => setPreviewing(true), 380);
        } else {
            if (hoverTimer.current) clearTimeout(hoverTimer.current);
            setPreviewing(false);
        }
        return () => {
            if (hoverTimer.current) clearTimeout(hoverTimer.current);
        };
    }, [hovered, item.videoUrl]);

    const isBig = scale === 'hero' || scale === 'wide';
    const titleSize = scale === 'hero' ? 22 : scale === 'wide' ? 17 : scale === 'standard' ? 15 : 13;
    const accent = theme.colors.primary.DEFAULT;
    const signal = signalFor(item.id);

    const thumb = item.thumbnailUrl || `https://picsum.photos/seed/${item.id}/900/600`;

    return (
        <Pressable
            onPress={onSelect}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={[
                styles.card,
                {
                    height,
                    borderColor: hovered
                        ? (isDark ? 'rgba(217, 228, 255, 0.4)' : 'rgba(76, 110, 245, 0.45)')
                        : (isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.08)'),
                    backgroundColor: isDark ? '#0B0C11' : '#EDEEF3',
                    shadowColor: isDark ? '#000' : '#6B7FCC',
                    shadowOpacity: hovered ? (isDark ? 0.55 : 0.18) : 0.25,
                    shadowRadius: hovered ? 30 : 14,
                    shadowOffset: { width: 0, height: hovered ? 14 : 6 },
                    transform: [{ translateY: hovered ? -4 : 0 }],
                },
            ]}
        >
            {/* Media */}
            <View style={styles.mediaLayer}>
                <Image
                    source={{ uri: thumb }}
                    style={[
                        StyleSheet.absoluteFillObject,
                        {
                            // @ts-ignore — web transition
                            transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), filter 0.4s ease',
                            transform: [{ scale: hovered ? 1.07 : 1 }],
                            // @ts-ignore
                            filter: hovered ? 'saturate(1.1)' : 'saturate(0.85)',
                        },
                    ]}
                    resizeMode="cover"
                />

                {previewing && item.videoUrl ? (
                    <ExpoVideo
                        source={{ uri: encodeVideoUrl(item.videoUrl) || '' }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay
                        isLooping
                        isMuted
                    />
                ) : null}
            </View>

            {/* Scrim — heavier at the foot where the copy sits */}
            <LinearGradient
                colors={['rgba(4,5,9,0.15)', 'rgba(4,5,9,0.55)', 'rgba(4,5,9,0.94)']}
                locations={[0, 0.48, 1]}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
            />

            {/* Accent wash on hover */}
            {hovered && (
                <LinearGradient
                    colors={['transparent', isDark ? 'rgba(217, 228, 255, 0.10)' : 'rgba(76, 110, 245, 0.12)']}
                    start={{ x: 0.2, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                />
            )}

            {/* Shine sweep */}
            {hovered && Platform.OS === 'web' && (
                /* @ts-ignore web-only element */
                <div
                    className="dr-sweep"
                    style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        width: '35%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent)',
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* Corner brackets — the HUD signature, drawn on hover */}
            {hovered && (
                <>
                    <View style={[styles.bracket, styles.bTL, { borderColor: accent }]} pointerEvents="none" />
                    <View style={[styles.bracket, styles.bTR, { borderColor: accent }]} pointerEvents="none" />
                    <View style={[styles.bracket, styles.bBL, { borderColor: accent }]} pointerEvents="none" />
                    <View style={[styles.bracket, styles.bBR, { borderColor: accent }]} pointerEvents="none" />
                </>
            )}

            {/* Top strip: index + status */}
            <View style={styles.topStrip} pointerEvents="box-none">
                <Text style={[styles.indexText, { color: hovered ? accent : 'rgba(255,255,255,0.55)', fontFamily: MONO }]}>
                    {String(index + 1).padStart(2, '0')}
                </Text>

                <View style={styles.topRight}>
                    {item.isHighSynergy && (
                        <View style={[styles.chip, { borderColor: 'rgba(52, 211, 153, 0.55)', backgroundColor: 'rgba(6, 30, 22, 0.75)' }]}>
                            <View style={[styles.chipDot, { backgroundColor: '#34D399' }]} />
                            <Text style={[styles.chipText, { color: '#34D399', fontFamily: MONO }]}>
                                {item.dnaMatch || 90}% MATCH
                            </Text>
                        </View>
                    )}
                    {item.category ? (
                        <View style={[styles.chip, { borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(6, 7, 12, 0.7)' }]}>
                            <Text style={[styles.chipText, { color: 'rgba(255,255,255,0.8)', fontFamily: MONO }]}>
                                {item.category.toUpperCase()}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </View>

            {/* Play affordance */}
            <View style={styles.playWrap} pointerEvents="none">
                <View
                    style={[
                        styles.playRing,
                        {
                            borderColor: hovered ? accent : 'rgba(255,255,255,0.25)',
                            backgroundColor: hovered ? 'rgba(217, 228, 255, 0.14)' : 'rgba(6, 7, 12, 0.35)',
                            width: isBig ? 58 : 44,
                            height: isBig ? 58 : 44,
                            opacity: previewing ? 0 : 1,
                        },
                    ]}
                >
                    <Ionicons name="play" size={isBig ? 22 : 17} color={hovered ? accent : 'rgba(255,255,255,0.7)'} />
                </View>
            </View>

            {/* Foot: copy + telemetry */}
            <View style={styles.foot} pointerEvents="box-none">
                <Text numberOfLines={1} style={[styles.author, { color: accent, fontFamily: MONO }]}>
                    {item.author ? `@${item.author.toLowerCase()}` : '@unknown'}
                </Text>

                <Text
                    numberOfLines={2}
                    style={[
                        styles.title,
                        {
                            fontSize: titleSize,
                            lineHeight: titleSize * 1.25,
                            fontFamily: theme.typography.fontFamilies.bold,
                        },
                    ]}
                >
                    {item.title || 'UNTITLED'}
                </Text>

                {/* Signal bar — a tiny bit of instrumentation instead of a like count row */}
                {scale !== 'compact' && (
                    <View style={styles.signalRow}>
                        <View style={styles.signalTrack}>
                            <LinearGradient
                                colors={[accent, isDark ? '#7DE2FF' : '#7DA2FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.signalFill, { width: `${signal}%` }]}
                            />
                        </View>
                        <Text style={[styles.signalText, { fontFamily: MONO }]}>SIG {signal}</Text>
                    </View>
                )}

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Feather name="eye" size={11} color="rgba(255,255,255,0.5)" />
                        <Text style={[styles.statText, { fontFamily: MONO }]}>{formatNumber(item.views)}</Text>
                    </View>

                    <Pressable onPress={onLike} style={styles.statItem} hitSlop={6}>
                        <Ionicons
                            name={item.isLiked ? 'heart' : 'heart-outline'}
                            size={12}
                            color={item.isLiked ? '#F87171' : 'rgba(255,255,255,0.5)'}
                        />
                        <Text style={[styles.statText, { fontFamily: MONO }]}>{formatNumber(item.likes)}</Text>
                    </Pressable>

                    <Pressable onPress={onComment} style={styles.statItem} hitSlop={6}>
                        <Feather name="message-square" size={11} color="rgba(255,255,255,0.5)" />
                        <Text style={[styles.statText, { fontFamily: MONO }]}>{formatNumber(item.comments)}</Text>
                    </Pressable>

                    <View style={{ flex: 1 }} />

                    <Pressable onPress={onMore} style={styles.moreBtn} hitSlop={6}>
                        <Feather name="more-horizontal" size={14} color="rgba(255,255,255,0.55)" />
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
        // @ts-ignore — web transition
        transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease, box-shadow 0.3s ease',
        // @ts-ignore
        cursor: 'pointer',
    },
    mediaLayer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    bracket: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderWidth: 1.5,
        zIndex: 6,
    },
    bTL: { top: 8, left: 8, borderRightWidth: 0, borderBottomWidth: 0 },
    bTR: { top: 8, right: 8, borderLeftWidth: 0, borderBottomWidth: 0 },
    bBL: { bottom: 8, left: 8, borderRightWidth: 0, borderTopWidth: 0 },
    bBR: { bottom: 8, right: 8, borderLeftWidth: 0, borderTopWidth: 0 },
    topStrip: {
        position: 'absolute',
        top: 14,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        zIndex: 4,
    },
    indexText: {
        fontSize: 11,
        letterSpacing: 1.5,
        fontWeight: '700',
    },
    topRight: {
        flexDirection: 'row',
        gap: 6,
        flexShrink: 1,
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 4,
        borderWidth: 1,
    },
    chipDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    chipText: {
        fontSize: 8.5,
        letterSpacing: 0.8,
        fontWeight: '700',
    },
    playWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
    },
    playRing: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 999,
        borderWidth: 1,
        // @ts-ignore
        transition: 'all 0.25s ease',
    },
    foot: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 14,
        zIndex: 5,
    },
    author: {
        fontSize: 10,
        letterSpacing: 1,
        marginBottom: 5,
        fontWeight: '700',
    },
    title: {
        color: '#FFFFFF',
        letterSpacing: -0.2,
    },
    signalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 10,
    },
    signalTrack: {
        flex: 1,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderRadius: 1,
        overflow: 'hidden',
        maxWidth: 140,
    },
    signalFill: {
        height: '100%',
    },
    signalText: {
        fontSize: 8.5,
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: 1,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 10,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    statText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 0.5,
    },
    moreBtn: {
        padding: 2,
    },
});
