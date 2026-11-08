import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, useWindowDimensions, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@design-system/theme';
import { encodeVideoUrl } from '@lib/utils/url';
import { Video, ResizeMode } from 'expo-av';
import { EdgeFade } from './EdgeFade';

interface FeaturedVideo {
    id: string;
    title: string;
    author: string;
    avatarUrl: string;
    videoUrl: string;
    thumbnailUrl?: string; // Added thumbnail support
    views: number;
    likes: number;
    /** Real tally from the debate's replies, when the room has voted. */
    logicStats?: { forScore: number; againstScore: number; forPercentage: number };
}

const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

/** Stable per-debate hue so a card without artwork still has an identity. */
const washFor = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return {
        hue: 196 + (h % 48),            // cyan through to the brand blue
        light: 22 + ((h >> 5) % 12),    // keeps neighbouring cards from matching
    };
};

interface FeaturedHeroProps {
    featuredVideos: FeaturedVideo[];
    onVideoPress: (videoId: string) => void;
}

const FeaturedVideoPlayer = ({ videoUrl, isCurrent }: { videoUrl: string, isCurrent: boolean }) => {
    const videoRef = React.useRef<Video>(null);

    return (
        <Video
            ref={videoRef}
            source={{ uri: encodeVideoUrl(videoUrl) || '' }}
            style={[styles.video, StyleSheet.absoluteFill, { opacity: isCurrent ? 1 : 0 }]}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isCurrent}
            isLooping
            isMuted={true}
        />
    );
};

export const FeaturedHero = ({ featuredVideos, onVideoPress }: FeaturedHeroProps) => {
    const { width: screenWidth } = useWindowDimensions();
    const isWeb = Platform.OS === 'web' && screenWidth > 768;

    // Measure the real column instead of guessing from the viewport — the deck
    // width now depends on whether the instrument dock is mounted.
    const [measuredWidth, setMeasuredWidth] = useState(0);
    const containerWidth = isWeb ? (measuredWidth || screenWidth - 460) : screenWidth;
    const cardWidth = isWeb ? Math.max(200, (containerWidth - 32) / 3) : containerWidth;
    const cardHeight = isWeb ? cardWidth * 0.78 : cardWidth;
    const scrollInterval = isWeb ? cardWidth + 16 : cardWidth;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const renderFeaturedItem = (item: FeaturedVideo, index: number) => {
        const isCurrent = index === currentIndex;
        const isHovered = hoveredId === item.id;

        const cardPadding = isWeb ? 14 : 24;
        const titleSize = isWeb ? 15 : 24;
        const titleLineHeight = isWeb ? 19 : 30;

        const { hue, light } = washFor(item.id);
        const tally = item.logicStats;
        const pro = tally ? Math.round(tally.forPercentage) : null;

        return (
            <Pressable
                onPress={() => onVideoPress(item.id)}
                onHoverIn={() => setHoveredId(item.id)}
                onHoverOut={() => setHoveredId(null)}
                style={[
                    styles.heroContainer,
                    {
                        width: cardWidth,
                        height: cardHeight,
                        marginRight: isWeb ? 16 : 0,
                        borderColor: isHovered ? `hsla(${hue}, 90%, 72%, 0.55)` : 'rgba(255,255,255,0.09)',
                        transform: [{ translateY: isHovered && isWeb ? -4 : 0 }],
                    }
                ]}
            >
                <View style={styles.videoContainer}>
                    {/* Identity wash. Most debates have no artwork yet, and a
                        bare <Image> left the card a black rectangle. */}
                    <LinearGradient
                        colors={[`hsl(${hue}, 64%, ${light + 8}%)`, `hsl(${hue + 18}, 56%, ${light - 8}%)`, '#05070C']}
                        locations={[0, 0.55, 1]}
                        start={{ x: 0.1, y: 0 }}
                        end={{ x: 0.9, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient
                        colors={[`hsla(${hue}, 95%, 70%, 0.22)`, 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0.7, y: 0.7 }}
                        style={StyleSheet.absoluteFill}
                    />

                    {item.thumbnailUrl ? (
                        <Image
                            source={{ uri: item.thumbnailUrl }}
                            style={styles.video}
                            resizeMode="cover"
                            // @ts-ignore
                            crossOrigin="anonymous"
                        />
                    ) : null}

                    {item.videoUrl ? (
                        <FeaturedVideoPlayer videoUrl={item.videoUrl} isCurrent={isCurrent} />
                    ) : null}

                    <View style={styles.overlay}>
                        <LinearGradient
                            colors={['rgba(3,5,10,0.55)', 'transparent', 'rgba(3,5,10,0.86)', '#03050A']}
                            locations={[0, 0.34, 0.74, 1]}
                            style={StyleSheet.absoluteFill}
                        />

                        {/* instrument bar */}
                        <View style={styles.topBar}>
                            <View style={styles.liveTag}>
                                <View style={[styles.liveDot, { backgroundColor: '#F43F5E' }]} />
                                <Text style={styles.liveText}>LIVE_DEBATE</Text>
                            </View>
                            {!(isWeb && isHovered) && (
                                <Text style={styles.watching}>{formatNumber(item.views)} WATCHING</Text>
                            )}
                        </View>

                        <View style={[styles.infoCard, { padding: cardPadding }]}>
                            <View style={styles.infoContent}>
                                <Text style={[styles.authorName, { fontSize: isWeb ? 11 : 14 }]}>
                                    {item.author ? `> @${item.author.toUpperCase()}` : ''}
                                </Text>
                                <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleLineHeight }]} numberOfLines={2}>
                                    {item.title ? item.title.toUpperCase() : ''}
                                </Text>

                                {/* The tally is what makes this a debate and not
                                    a video. Shown only when the room has voted. */}
                                {pro !== null ? (
                                    <View style={styles.tally}>
                                        <View style={styles.tallyLabels}>
                                            <Text style={[styles.tallySide, { color: '#7DD3FC' }]}>PRO {pro}%</Text>
                                            <Text style={[styles.tallySide, { color: '#C4B5FD' }]}>{100 - pro}% CON</Text>
                                        </View>
                                        <View style={styles.tallyTrack}>
                                            <View style={[styles.tallyFill, { width: `${pro}%`, backgroundColor: '#38BDF8' }]} />
                                            <View style={[styles.tallyFill, { width: `${100 - pro}%`, backgroundColor: '#8B7BF0' }]} />
                                        </View>
                                        <Text style={styles.tallyMeta}>{formatNumber(item.likes)} VOTES CAST</Text>
                                    </View>
                                ) : (
                                    <View style={styles.tally}>
                                        <View style={styles.tallyTrackEmpty} />
                                        <Text style={styles.tallyMeta}>NO VERDICT YET — FLOOR IS OPEN</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* corner ticks, the instrument language used across the deck */}
                        <View style={[styles.tick, styles.tickTL]} />
                        <View style={[styles.tick, styles.tickBR]} />

                        {isWeb && isHovered && (
                            <View style={styles.enterChip}>
                                <Text style={styles.enterText}>[ ENTER ]</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
        );
    };

    const handleScrollEnd = React.useCallback((e: any) => {
        const xOffset = e.nativeEvent.contentOffset.x;
        const index = Math.round(xOffset / scrollInterval);
        if (index !== currentIndex) {
            setCurrentIndex(index);
        }
    }, [scrollInterval, currentIndex]);

    return (
        <View
            style={[styles.container, { paddingHorizontal: 0 }]}
            onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w && Math.abs(w - measuredWidth) > 1) setMeasuredWidth(w);
            }}
        >
            <ScrollView
                horizontal
                pagingEnabled={!isWeb}
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                onMomentumScrollEnd={handleScrollEnd}
                scrollEventThrottle={16}
                snapToInterval={scrollInterval}
                snapToAlignment="start"
                decelerationRate="fast"
            >
                {featuredVideos.map((item, index) => (
                    <React.Fragment key={`${item.id}-${index}`}>
                        {renderFeaturedItem(item, index)}
                    </React.Fragment>
                ))}
            </ScrollView>

            {isWeb && <EdgeFade />}

            {/* Pagination Dots - Square */}
            {!isWeb && featuredVideos.length > 1 && (
                <View style={styles.pagination}>
                    {featuredVideos.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === currentIndex && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.xl,
        position: 'relative',
    },
    heroContainer: {
        height: 400, // Slightly shorter
        borderWidth: 1,
        overflow: 'hidden',
        // @ts-ignore — web only
        transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease',
    },
    videoContainer: {
        flex: 1,
        backgroundColor: '#05070C',
    },
    video: {
        width: '100%',
        height: '100%',
        opacity: 0.8, // Slightly dim video for better text contrast
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 11,
    },
    liveTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: 'rgba(5, 8, 15, 0.72)',
        borderWidth: 1,
        borderColor: 'rgba(244, 63, 94, 0.45)',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    liveText: {
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 1.6,
        color: '#FDA4AF',
        fontFamily: MONO,
    },
    watching: {
        fontSize: 8,
        fontWeight: '600',
        letterSpacing: 1.4,
        color: 'rgba(226, 238, 255, 0.72)',
        fontFamily: MONO,
    },
    tally: {
        marginTop: 8,
        gap: 5,
    },
    tallyLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    tallySide: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1.2,
        fontFamily: MONO,
    },
    tallyTrack: {
        flexDirection: 'row',
        height: 5,
        backgroundColor: 'rgba(226, 238, 255, 0.14)',
        overflow: 'hidden',
    },
    tallyTrackEmpty: {
        height: 5,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(226, 238, 255, 0.24)',
    },
    tallyFill: {
        height: '100%',
    },
    tallyMeta: {
        fontSize: 8,
        letterSpacing: 1.3,
        color: 'rgba(226, 238, 255, 0.55)',
        fontFamily: MONO,
    },
    tick: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderColor: 'rgba(226, 238, 255, 0.5)',
    },
    tickTL: {
        top: 6,
        left: 6,
        borderLeftWidth: 1,
        borderTopWidth: 1,
    },
    tickBR: {
        bottom: 6,
        right: 6,
        borderRightWidth: 1,
        borderBottomWidth: 1,
    },
    enterChip: {
        position: 'absolute',
        top: 11,
        right: 12,
        paddingHorizontal: 9,
        paddingVertical: 4,
        backgroundColor: 'rgba(56, 189, 248, 0.16)',
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.6)',
    },
    enterText: {
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 1.6,
        color: '#BAE6FD',
        fontFamily: MONO,
    },
    infoCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.xl,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    infoContent: {
        flex: 1,
        gap: 8,
        marginRight: 16,
    },

    authorName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#38BDF8',
        letterSpacing: 0.5,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        lineHeight: 30,
        letterSpacing: -0.5,
        textTransform: 'uppercase',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statLabel: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
        letterSpacing: 0.5,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    statText: {
        fontSize: 12,
        color: '#FFF',
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    trendingBadge: {
        position: 'absolute',
        top: 20,
        left: 20,
        backgroundColor: 'rgba(8, 9, 13, 0.65)',
        borderWidth: 1,
        borderColor: '#38BDF8',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
        zIndex: 20,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#38BDF8',
        letterSpacing: 1,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: -16,
        marginBottom: theme.spacing.md,
    },
    dot: {
        width: 6,
        height: 6,
        backgroundColor: '#333',
    },
    activeDot: {
        backgroundColor: theme.colors.primary.light,
    },
    vsContainer: {
        position: 'absolute',
        top: '40%',
        left: '50%',
        marginLeft: -30,
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#D9E4FF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'rgba(217, 228, 255, 0.1)',
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
    vsText: {
        color: '#D9E4FF',
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 1,
    },
});
