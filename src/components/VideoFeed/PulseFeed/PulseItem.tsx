import React, { memo, useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Text, Pressable, Image, Animated as RNAnimated } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    interpolate,
    Extrapolation,
    withTiming,
    useSharedValue
} from 'react-native-reanimated';
import { VideoView, useVideoPlayer } from 'expo-video';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../Theme/ThemeProvider';
import { theme } from '@design-system/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FOCUS_WIDTH = SCREEN_WIDTH * 0.85;
const SATELLITE_WIDTH = SCREEN_WIDTH * 0.45;

interface PulseItemProps {
    video: any;
    status: 'focus' | 'satellite';
    position: { x: number; y: number };
    onSelect: () => void;
    isMuted: boolean;
    isScreenFocused: boolean;
}

interface PulseVideoProps {
    videoUrl: string;
    isActive: boolean;
    isMuted: boolean;
}

import { encodeVideoUrl } from '../../../lib/utils/url';

const PulseVideo = ({ videoUrl, isActive, isMuted }: PulseVideoProps) => {
    const player = useVideoPlayer(encodeVideoUrl(videoUrl), (player) => {
        player.loop = true;
        player.muted = isMuted;
    });

    useEffect(() => {
        if (isActive) {
            const playVideo = async () => {
                try {
                    await player.play();
                } catch (e: any) {
                    if (e.name !== 'AbortError') {
                        console.error("PulseItem: Playback failed", e);
                    }
                }
            };
            playVideo();
        } else {
            player.pause();
        }
    }, [isActive, player]);

    return (
        <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
        />
    );
};

export const PulseItem = memo(({
    video,
    status,
    position,
    onSelect,
    isMuted,
    isScreenFocused
}: PulseItemProps) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const isFocus = status === 'focus';

    const [isPaused, setIsPaused] = useState(false);

    const togglePlayback = () => {
        if (isFocus) {
            setIsPaused(!isPaused);
        } else {
            onSelect();
        }
    };

    const animatedStyle = useAnimatedStyle(() => {
        const width = withSpring(isFocus ? FOCUS_WIDTH : SATELLITE_WIDTH);
        const height = withSpring(isFocus ? FOCUS_WIDTH * (16 / 9) : SATELLITE_WIDTH * (16 / 9));

        return {
            width,
            height,
            transform: [
                { translateX: withSpring(position.x - (isFocus ? FOCUS_WIDTH / 2 : SATELLITE_WIDTH / 2)) },
                { translateY: withSpring(position.y - (isFocus ? FOCUS_WIDTH * 16 / 9 / 2 : SATELLITE_WIDTH * 16 / 9 / 2)) },
                { scale: withSpring(isFocus ? 1 : 0.8) }
            ],
            opacity: withSpring(isFocus ? 1 : 0.6),
            zIndex: isFocus ? 100 : 10,
        };
    });

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <Pressable onPress={togglePlayback} style={StyleSheet.absoluteFill}>

                {/* Neon Glow Border for Focus */}
                {isFocus && (
                    <LinearGradient
                        colors={[theme.colors.primary.DEFAULT, '#D9E4FF']}
                        style={styles.neonBorder}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                )}

                <View style={styles.contentContainer}>
                    {video.videoUrl ? (
                        <PulseVideo
                            videoUrl={video.videoUrl}
                            isActive={isFocus && isScreenFocused && !isPaused}
                            isMuted={isMuted}
                        />
                    ) : (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="videocam-off" size={32} color="rgba(255,255,255,0.1)" />
                        </View>
                    )}

                    {/* Blur Overlay for Satellites */}
                    {!isFocus && (
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    )}

                    {/* Video Metadata Overlay (only for focus) */}
                    {isFocus && (
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={styles.overlay}
                        >
                            <View style={styles.header}>
                                <View style={styles.authorBadge}>
                                    <Image source={{ uri: video.avatarUrl || 'https://i.pravatar.cc/100' }} style={styles.avatar} />
                                    <Text style={styles.authorName}>{video.author}</Text>
                                </View>
                            </View>

                            <View style={styles.footer}>
                                <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
                                <View style={styles.statsRow}>
                                    <View style={styles.stat}>
                                        <Ionicons name="flame" size={14} color={theme.colors.primary.light} />
                                        <Text style={styles.statText}>{video.likes}</Text>
                                    </View>
                                    <View style={styles.stat}>
                                        <Ionicons name="chatbubble" size={14} color="#FFF" />
                                        <Text style={styles.statText}>{video.comments}</Text>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    )}

                    {/* Muted indicator */}
                    {isMuted && isFocus && (
                        <View style={styles.mutedIcon}>
                            <Ionicons name="volume-mute" size={16} color="#FFF" />
                        </View>
                    )}

                    {isPaused && isFocus && (
                        <View style={styles.pauseOverlay}>
                            <Ionicons name="pause" size={48} color="white" />
                        </View>
                    )}
                </View>

            </Pressable>
        </Animated.View>
    );
});
PulseItem.displayName = 'PulseItem';

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        borderRadius: 30,
        overflow: 'visible',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    neonBorder: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 32,
        opacity: 0.8,
    },
    contentContainer: {
        flex: 1,
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    authorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: 4,
        borderRadius: 20,
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 8,
    },
    authorName: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        paddingRight: 8,
        fontFamily: theme.typography.fontFamilies.bold,
    },
    footer: {
        gap: 8,
    },
    title: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        fontFamily: theme.typography.fontFamilies.medium,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: theme.typography.fontFamilies.tech,
    },
    mutedIcon: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
