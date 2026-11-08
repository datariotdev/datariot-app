import React, { useRef, useState, memo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Animated, Image, Platform, useWindowDimensions } from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../Theme/ThemeProvider';
import { theme } from '../../design-system/theme';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { encodeVideoUrl } from '../../lib/utils/url';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
// Constants moved inside component for responsiveness


interface FeedItemProps {
    item: any;
    isActive: boolean;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onMore: () => void;
    onSelect: () => void;
}

const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
};

interface VideoPlayerLayerProps {
    videoUrl: string;
    isActive: boolean;
    isFocused: boolean;
    isPaused: boolean;
    isMuted: boolean;
    onTimeUpdate: (currentTime: number, duration: number) => void;
}

const VideoPlayerLayer = ({ videoUrl, isActive, isFocused, isPaused, isMuted, onTimeUpdate }: VideoPlayerLayerProps) => {
    const videoRef = useRef<Video>(null);

    return (
        <View style={StyleSheet.absoluteFillObject}>
            <Video
                ref={videoRef}
                source={{ uri: encodeVideoUrl(videoUrl) || '' }}
                style={StyleSheet.absoluteFillObject}
                resizeMode={ResizeMode.COVER}
                shouldPlay={isActive && isFocused && !isPaused}
                isLooping
                isMuted={isMuted}
                onPlaybackStatusUpdate={(status: any) => {
                    if (status.isLoaded && status.durationMillis) {
                        onTimeUpdate(status.positionMillis, status.durationMillis);
                    }
                }}
            />
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFillObject} />

            {/* Foreground Sharp Layer (shows full content) */}
            <Video
                source={{ uri: encodeVideoUrl(videoUrl) || '' }}
                style={StyleSheet.absoluteFillObject}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={isActive && isFocused && !isPaused}
                isLooping
                isMuted={isMuted}
            />
        </View>
    );
};

export const CoubClassicItem = memo(({
    item,
    isActive,
    onLike,
    onComment,
    onSave,
    onMore,
    onSelect,
}: FeedItemProps) => {
    const [isMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const { width: windowWidth } = useWindowDimensions();
    const { theme, mode } = useTheme();

    const isWeb = Platform.OS === 'web';
    const isMobileWeb = isWeb && windowWidth <= 768;
    const isDark = mode === 'dark';

    const cardMargin = isWeb ? (isMobileWeb ? 0 : 0) : 16; // Maintain 0 for web to fill column
    const cardWidth = isWeb ? '100%' as any : windowWidth - (cardMargin * 2);
    const videoHeight = isWeb ? (isMobileWeb ? (windowWidth * 9 / 16) : 380) : (windowWidth - 32) * (9 / 16);

    const router = useRouter();
    const isFocused = useIsFocused();

    // Animation for like button
    const likeScale = useRef(new Animated.Value(1)).current;

    const togglePlayback = () => {
        setIsPaused(!isPaused);
    };


    const handleNavigateProfile = () => {
        if (item.authorId) {
            router.push(`/user/${item.authorId}`);
        }
    };

    const handleLike = () => {
        Animated.sequence([
            Animated.spring(likeScale, {
                toValue: 1.5,
                useNativeDriver: true,
                speed: 50,
                bounciness: 10,
            }),
            Animated.spring(likeScale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 50,
                bounciness: 10,
            }),
        ]).start();
        onLike();
    };

    return (
        <View style={[
            styles.card,
            {
                width: isWeb ? '100%' : windowWidth,
                paddingHorizontal: isWeb ? 16 : cardMargin,
            },
            isWeb && !isMobileWeb && {
                // @ts-ignore — web only: center card
                alignSelf: 'center',
                maxWidth: 700,
            }
        ]}>
            {/* Main Video Container with premium glow shadow */}
            <Pressable style={[
                styles.videoContainer,
                { width: cardWidth, height: videoHeight },
                isDark ? {
                    shadowColor: '#D9E4FF',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.08,
                    shadowRadius: 32,
                } : {
                    shadowColor: '#6B7FCC',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.06,
                    shadowRadius: 24,
                },
                isWeb && !isMobileWeb && isDark && {
                    // @ts-ignore — web only: side bloom glow
                    boxShadow: '-40px 0 80px rgba(165,198,255,0.10), 40px 0 80px rgba(217,228,255,0.10), 0 12px 40px rgba(0,0,0,0.5)',
                },
                isWeb && !isMobileWeb && !isDark && {
                    // @ts-ignore — web only: side bloom glow light mode
                    boxShadow: '-32px 0 60px rgba(107,127,204,0.08), 32px 0 60px rgba(107,127,204,0.08), 0 8px 32px rgba(107,127,204,0.12)',
                },
            ]} onPress={togglePlayback}>

                {/* Cyberpunk Category Badge */}
                <View style={styles.cyberBadge}>
                    <Text style={styles.cyberBadgeText}>
                        {`[ SYSTEM.${(item.category || 'TRENDING').toUpperCase()} ]`}
                    </Text>
                </View>

                {/* Background Blurred Layer (fills everything) */}
                {item.videoUrl ? (
                    <VideoPlayerLayer
                        videoUrl={item.videoUrl}
                        isActive={isActive}
                        isFocused={isFocused}
                        isPaused={isPaused}
                        isMuted={isMuted}
                        onTimeUpdate={(current, duration) => setProgress(current / duration)}
                    />
                ) : (
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#06070A', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="videocam-off" size={48} color="rgba(255,255,255,0.06)" />
                    </View>
                )}

                {/* Dark Gradient Overlay for better text visibility */}
                <View style={styles.overlayGradient} pointerEvents="none" />

                {/* Unmute Icon */}
                {isMuted && (
                    <View style={styles.mutedOverlay}>
                        <Ionicons name="volume-mute" size={18} color="rgba(255,255,255,0.7)" />
                    </View>
                )}

                {/* Center Pause Icon */}
                {isPaused && (
                    <View style={styles.pauseOverlay}>
                        <View style={styles.pauseIconContainer}>
                            <Ionicons name="pause" size={36} color="white" />
                        </View>
                    </View>
                )}

                {/* Premium Gradient Progress Bar */}
                <View style={styles.progressBarContainer} pointerEvents="none">
                    <LinearGradient
                        colors={['#D9E4FF', '#A5C6FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
                    />
                    {/* Glow dot at progress tip */}
                    {progress > 0 && (
                        <View style={[styles.progressGlowDot, { left: `${progress * 100}%` }]} />
                    )}
                </View>


            </Pressable>

            {/* Overlapping Glass Panel for Info & Actions */}
            <View style={[styles.infoPanelWrapper, { width: isWeb ? (isMobileWeb ? '92%' : '88%') : cardWidth - 32, alignSelf: 'center' }]}>
                <View style={[
                    styles.infoPanel,
                    {
                        backgroundColor: isDark ? 'rgba(14, 16, 23, 0.8)' : 'rgba(255, 255, 255, 0.75)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(107, 127, 204, 0.12)',
                    },
                    isDark ? {
                        shadowColor: '#000',
                        shadowOpacity: 0.25,
                        shadowRadius: 12,
                    } : {
                        shadowColor: '#6B7FCC',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.04,
                        shadowRadius: 10,
                    }
                ]}>
                    {/* Subtle gradient shine overlay */}
                    {isDark && (
                        <LinearGradient
                            colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.00)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
                        />
                    )}
                    <View style={[styles.infoPanelContent, isExpanded && styles.infoPanelContentExpanded]}>
                        {/* Left Side: Info */}
                        <View style={[styles.infoSection, isExpanded && styles.infoSectionExpanded]}>
                            {/* Author Handle Link */}
                            <Pressable onPress={handleNavigateProfile} style={styles.authorContainer}>
                                <Text style={styles.authorHandleText}>
                                    {`> @${(item.author || 'unknown').toUpperCase()}`}
                                </Text>
                            </Pressable>

                            {/* Title */}
                            <Pressable onPress={() => setIsExpanded(!isExpanded)}>
                                <Text
                                    style={[styles.title, { color: theme.colors.text.primary }]}
                                    numberOfLines={isExpanded ? undefined : 2}
                                >
                                    {item.title ? item.title.toUpperCase() : ''}
                                </Text>
                            </Pressable>

                            {/* Hashtag */}
                            {item.hashtag && (
                                <Text style={styles.hashtag}>
                                    {`[ #${item.hashtag.toUpperCase()} ]`}
                                </Text>
                            )}

                            {/* Cyber Stats */}
                            <Text style={styles.cyberStatsText}>
                                {`VIEWS: ${formatNumber(item.views || 0)}    LIKES: ${formatNumber(item.likes || 0)}`}
                            </Text>

                            {!isExpanded && item.title && item.title.length > 50 && (
                                <Pressable onPress={() => setIsExpanded(!isExpanded)}>
                                    <Text style={styles.readMoreText}>more</Text>
                                </Pressable>
                            )}

                            {/* Logic Balance Bar (Who's Winning) */}
                            {item.logicStats && (
                                <View style={[styles.logicBalanceWrapper, {
                                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)',
                                }]}>
                                    <View style={[styles.logicBalanceTrack, {
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                                    }]}>
                                        <View
                                            style={[
                                                styles.logicBalanceFill,
                                                { width: `${item.logicStats.forPercentage}%`, backgroundColor: theme.colors.success || '#34D399' }
                                            ]}
                                        />
                                        <View
                                            style={[
                                                styles.logicBalanceFill,
                                                { width: `${100 - item.logicStats.forPercentage}%`, backgroundColor: theme.colors.error || '#F87171' }
                                            ]}
                                        />
                                    </View>
                                    <View style={styles.logicScoreRow}>
                                        <Text style={[styles.logicScoreText, { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)' }]}>{item.logicStats.forScore} FOR</Text>
                                        <Text style={[styles.logicScoreText, { color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)' }]}>{item.logicStats.againstScore} AGAINST</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Right Side: Action Row */}
                        <View style={styles.actionRow}>
                            {/* Like */}
                            <Pressable style={styles.actionIconBtn} onPress={handleLike}>
                                <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                                    <Ionicons
                                        name={item.isLiked ? "star" : "star-outline"}
                                        size={22}
                                        color={item.isLiked ? theme.colors.primary.DEFAULT : theme.colors.text.secondary}
                                        style={styles.plainIcon}
                                    />
                                </Animated.View>
                                <Text style={[styles.actionIconText, { color: theme.colors.text.muted }]}>{formatNumber(item.likes)}</Text>
                            </Pressable>

                            {/* Comment */}
                            <Pressable style={styles.actionIconBtn} onPress={onComment}>
                                <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text.secondary} style={styles.plainIcon} />
                                <Text style={[styles.actionIconText, { color: theme.colors.text.muted }]}>{formatNumber(item.comments)}</Text>
                            </Pressable>

                            {/* Recoub / Share */}
                            <Pressable style={styles.actionIconBtn} onPress={onSave}>
                                <Ionicons
                                    name={item.isSaved ? "bookmark" : "bookmark-outline"}
                                    size={20}
                                    color={item.isSaved ? theme.colors.primary.DEFAULT : theme.colors.text.secondary}
                                    style={styles.plainIcon}
                                />
                                <Text style={[styles.actionIconText, { color: theme.colors.text.muted }]}>{formatNumber(item.shares)}</Text>
                            </Pressable>



                            {/* More */}
                            <Pressable style={styles.actionIconBtn} onPress={onMore}>
                                <Ionicons name="ellipsis-horizontal-outline" size={20} color={theme.colors.text.secondary} style={styles.plainIcon} />
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>

        </View>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.isActive === nextProps.isActive &&
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.likes === nextProps.item.likes &&
        prevProps.item.isLiked === nextProps.item.isLiked &&
        prevProps.item.saved === nextProps.item.saved &&
        prevProps.item.isSaved === nextProps.item.isSaved
    );
});

CoubClassicItem.displayName = 'CoubClassicItem';

const styles = StyleSheet.create({
    card: {
        marginBottom: isWeb ? 28 : 36,
        alignItems: 'center',
    },
    videoContainer: {
        backgroundColor: '#06070A',
        borderRadius: 28,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 12,
    },

    overlayGradient: {
        ...StyleSheet.absoluteFillObject,
        // Removed heavy dark gradient overlay since text is no longer on the video
    },

    infoPanelWrapper: {
        marginTop: -14,
        zIndex: 10,
    },
    infoPanel: {
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingVertical: 16,
        overflow: 'hidden',
        borderWidth: 1,
        // Premium glass shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    infoPanelContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    infoPanelContentExpanded: {
        flexDirection: 'column',
        alignItems: 'stretch',
    },
    infoSection: {
        flex: 1,
        marginRight: 16,
        justifyContent: 'center',
    },
    infoSectionExpanded: {
        marginRight: 0,
        marginBottom: 16,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 24,
    },
    cyberBadge: {
        position: 'absolute',
        top: 14,
        left: 14,
        backgroundColor: 'rgba(8, 9, 13, 0.6)',
        borderWidth: 1,
        borderColor: '#38BDF8',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
        zIndex: 20,
    },
    cyberBadgeText: {
        fontSize: 11,
        color: '#38BDF8',
        fontWeight: '700',
        letterSpacing: 1,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    authorContainer: {
        marginBottom: 6,
    },
    authorHandleText: {
        fontSize: 13,
        color: '#38BDF8',
        fontWeight: '700',
        letterSpacing: 0.5,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 24,
        marginBottom: 6,
        color: '#FFF',
        textTransform: 'uppercase',
        fontFamily: theme.typography.fontFamilies.bold,
        letterSpacing: 0.2,
    },
    hashtag: {
        fontSize: 12,
        color: '#38BDF8',
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    cyberStatsText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.55)',
        fontWeight: '600',
        letterSpacing: 0.8,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginTop: 4,
        marginBottom: 4,
    },
    readMoreText: {
        fontSize: 11,
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        letterSpacing: 0.5,
    },
    actionIconBtn: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    customIcon: {
        fontSize: 26,
        lineHeight: 28,
        textAlign: 'center',
    },
    plainIcon: {
        marginBottom: 2,
    },
    actionIconText: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
        letterSpacing: 0.2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    mutedOverlay: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        // @ts-ignore
        backdropFilter: 'blur(8px)',
    },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    pauseIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        // @ts-ignore
        backdropFilter: 'blur(8px)',
    },

    progressBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    progressBarFill: {
        height: '100%',
        borderTopRightRadius: 3,
        borderBottomRightRadius: 3,
    },
    progressGlowDot: {
        position: 'absolute',
        top: -3,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D9E4FF',
        marginLeft: -4,
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
    },
    // Logic Balance Styles for Feed
    logicBalanceWrapper: {
        marginTop: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    logicBalanceTrack: {
        height: 3,
        borderRadius: 1.5,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    logicBalanceFill: {
        height: '100%',
    },
    logicScoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    logicScoreText: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.8,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
});
