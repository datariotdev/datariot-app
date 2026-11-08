import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@design-system/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';

interface VideoControlsProps {
    isPlaying: boolean;
    title: string;
    author: string;
    authorId: string;
    avatarUrl?: string;
    hashtag?: string;
    currentTime?: number;
    duration?: number;
    onSeek?: (value: number) => void;
    likes: number;
    comments: number;
    saved: number;
    isLiked: boolean;
    isSaved: boolean;
    isFollowing: boolean;
    isLive?: boolean;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onMore: () => void;
    onFollow: () => void;
}

const VideoScrubber = ({ currentTime = 0, duration = 0, onSeek }: { currentTime: number, duration: number, onSeek?: (value: number) => void }) => {
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);
    const trackHeightAnim = useRef(new Animated.Value(2)).current; // Initial ultra thin height
    const thumbScaleAnim = useRef(new Animated.Value(1)).current;

    const displayTime = isSeeking ? seekValue : currentTime;
    const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(trackHeightAnim, {
                toValue: isSeeking ? 6 : 2, // Thicker when seeking
                duration: 150,
                useNativeDriver: false, // height is not supported by native driver
            }),
            Animated.timing(thumbScaleAnim, {
                toValue: isSeeking ? 1.5 : 1,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start();
    }, [isSeeking, trackHeightAnim, thumbScaleAnim]);

    const formatTime = (millis: number) => {
        const totalSeconds = millis / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleSlidingStart = () => {
        setIsSeeking(true);
    };

    const handleValueChange = (value: number) => {
        if (!isSeeking) setIsSeeking(true);
        setSeekValue(value);
    };

    const handleSlidingComplete = (value: number) => {
        onSeek?.(value);
        // Small delay before looking "inactive" so the jump isn't jarring
        setTimeout(() => setIsSeeking(false), 200);
    };

    return (
        <View style={styles.scrubberContainer} pointerEvents="box-none">
            <View style={styles.sliderContainer} pointerEvents="box-none">
                {/* Background Track */}
                <View style={styles.trackBase} pointerEvents="none" />

                {/* Progress Fill */}
                <View
                    style={[
                        styles.trackFill,
                        { width: `${progressPercent}%` }
                    ]}
                    pointerEvents="none"
                />

                {/* Actual Slider Layer */}
                <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={duration > 0 ? duration : 100}
                    value={isSeeking ? seekValue : currentTime}
                    minimumTrackTintColor="transparent"
                    maximumTrackTintColor="transparent"
                    thumbTintColor="#FFFFFF" // Making thumb visible definitively
                    onSlidingStart={handleSlidingStart}
                    onValueChange={handleValueChange}
                    onSlidingComplete={handleSlidingComplete}
                />
            </View>

            <View style={styles.timeWrapper}>
                <Text style={styles.timeText}>
                    {formatTime(displayTime)} / {formatTime(duration)}
                </Text>
            </View>
        </View>
    );
};

export function VideoControls({
    title,
    author,
    authorId,
    avatarUrl,
    hashtag,
    currentTime = 0,
    duration = 0,
    onSeek,
    likes,
    comments,
    saved,
    isLiked,
    isSaved,
    isFollowing,
    isLive,
    onLike,
    onComment,
    onSave,
    onMore,
    onFollow,
}: VideoControlsProps) {
    const insets = useSafeAreaInsets();
    const [imageError, setImageError] = React.useState(false);
    const router = useRouter();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const animateLike = () => {
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1.4,
                useNativeDriver: true,
                speed: 50,
                bounciness: 10,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                speed: 50,
                bounciness: 10,
            }),
        ]).start();
    };

    const handleNavigateProfile = () => {
        if (authorId) {
            router.push(`/user/${authorId}`);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)', '#000000']}
                style={StyleSheet.absoluteFill}
            />

            <View style={[
                styles.contentContainer,
                { paddingBottom: Platform.OS === 'web' ? 60 : insets.bottom + 24 }
            ]}>
                {/* Information Section - Hidden on Web */}
                {Platform.OS !== 'web' && (
                    <View style={styles.infoSection}>
                        <View style={styles.authorRow}>
                            <Pressable onPress={handleNavigateProfile} style={[styles.avatarContainer, isLive && styles.avatarContainerLive]}>
                                {avatarUrl && !imageError ? (
                                    <Image
                                        source={{ uri: avatarUrl }}
                                        style={[styles.avatar, isLive && styles.avatarLive]}
                                        resizeMode="cover"
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <View style={[styles.avatar, styles.avatarPlaceholder, isLive && styles.avatarLive]}>
                                        <Text style={styles.avatarText}>{author[0]?.toUpperCase()}</Text>
                                    </View>
                                )}
                            </Pressable>

                            <Pressable style={styles.authorInfo} onPress={handleNavigateProfile}>
                                <Text style={styles.username}>@{author}</Text>
                            </Pressable>
                        </View>

                        <View style={styles.titleContainer}>
                            <Text style={styles.title}>{title}</Text>
                            {hashtag && (
                                <Text style={styles.hashtag}> #{hashtag}</Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Interaction Section - Visible on all platforms */}
                <View style={[styles.interactionSection, Platform.OS === 'web' && { marginBottom: 10 }]}>
                    <View style={styles.leftActions}>
                        <Pressable onPress={() => { animateLike(); onLike(); }} style={styles.actionButton}>
                            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                <Text style={[styles.actionIcon, { color: isLiked ? '#D9E4FF' : 'white' }]}>✦</Text>
                            </Animated.View>
                            <Text style={styles.actionLabel}>Like</Text>
                            <Text style={styles.actionCount}>{formatCount(likes)}</Text>
                        </Pressable>


                        <Pressable onPress={onComment} style={styles.actionButton}>
                            <Ionicons name="chatbubble" size={24} color="white" />
                            <Text style={styles.actionLabel}>Comment</Text>
                            <Text style={styles.actionCount}>{formatCount(comments)}</Text>
                        </Pressable>

                        <Pressable onPress={onSave} style={styles.actionButton}>
                            <Ionicons
                                name="bookmark"
                                size={24}
                                color="white"
                            />
                            <Text style={styles.actionLabel}>Save</Text>
                            <Text style={styles.actionCount}>{formatCount(saved)}</Text>
                        </Pressable>

                        <Pressable onPress={onMore} style={styles.actionButton}>
                            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
                            <Text style={styles.actionLabel}>More</Text>
                        </Pressable>
                    </View>

                    <Pressable onPress={onComment} style={styles.commentBar}>
                        <Text style={styles.commentPlaceholder}>Add a comment...</Text>
                        <View style={styles.sendIcon}>
                            <Ionicons name="arrow-up" size={16} color="#000" />
                        </View>
                    </Pressable>
                </View>
                {/* Video Duration Slider - Integrated into flow for WEB ONLY */}
                {Platform.OS === 'web' && (
                    <View style={{ marginTop: 10, width: '100%' }}>
                        <VideoScrubber
                            currentTime={currentTime}
                            duration={duration}
                            onSeek={onSeek}
                        />
                    </View>
                )}
            </View>

            {/* Video Duration Slider - Absolute for MOBILE ONLY */}
            {Platform.OS !== 'web' && (
                <View
                    style={[
                        styles.absoluteScrubberContainer,
                        { bottom: Math.max(insets.bottom, 20) }
                    ]}
                    pointerEvents="box-none"
                >
                    <VideoScrubber
                        currentTime={currentTime}
                        duration={duration}
                        onSeek={onSeek}
                    />
                </View>
            )}
        </View>
    );
}

function formatCount(count: number): string {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    contentContainer: {
        width: '100%',
    },
    infoSection: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarContainer: {
        marginRight: 10,
        position: 'relative',
    },
    avatarContainerLive: {
        borderWidth: 2,
        borderColor: '#FF0050',
        borderRadius: 22,
        padding: 2,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarLive: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarPlaceholder: {
        backgroundColor: theme.colors.surface.DEFAULT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
    },
    followBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#FF0050',
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#000',
    },
    authorInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontFamily: theme.typography.fontFamilies.bold,
        color: 'white',
        letterSpacing: 0.5,
    },
    titleContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    title: {
        color: 'white',
        fontFamily: theme.typography.fontFamilies.regular,
        fontSize: 15,
    },
    hashtag: {
        color: '#0EA5E9',
        fontFamily: theme.typography.fontFamilies.bold,
    },

    interactionSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    leftActions: {
        flexDirection: 'row',
        gap: 20,
        alignItems: 'center',
    },
    actionButton: {
        alignItems: 'center',
    },
    actionIcon: {
        fontSize: 24,
        color: 'white',
    },
    actionIconActive: {
        color: '#0EA5E9',
        textShadowColor: 'rgba(14, 165, 233, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },

    actionLabel: {
        color: 'white',
        fontSize: 10,
        fontFamily: theme.typography.fontFamilies.medium,
        marginTop: 2,
    },
    actionCount: {
        color: 'white',
        fontSize: 12,
        fontFamily: theme.typography.fontFamilies.bold,
        marginTop: 2,
    },
    commentBar: {
        flex: 1,
        height: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20, // Rounded pill look
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginLeft: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    commentPlaceholder: {
        color: 'rgba(255,255,255,0.5)',
        fontFamily: theme.typography.fontFamilies.regular,
        flex: 1,
    },
    sendIcon: {
        width: 24,
        height: 24,
        borderRadius: 12, // Circular button look
        backgroundColor: '#D9E4FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    absoluteScrubberContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        paddingHorizontal: 0,
        zIndex: 1000,
    },
    scrubberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 32,
        width: '100%',
        paddingHorizontal: 16,
    },
    sliderContainer: {
        flex: 1,
        height: 32,
        justifyContent: 'center',
        marginRight: 12,
        position: 'relative',
    },
    trackBase: {
        position: 'absolute',
        top: 14,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    trackFill: {
        position: 'absolute',
        top: 14,
        left: 0,
        height: 2,
        backgroundColor: '#D9E4FF',
        zIndex: 1,
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    timeWrapper: {
        justifyContent: 'center',
        height: 32,
    },
    timeText: {
        color: '#FFFFFF',
        fontFamily: theme.typography.fontFamilies.bold,
        fontSize: 11,
        textAlign: 'right',
        minWidth: 80,
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    slider: {
        width: '100%',
        height: 32,
        zIndex: 10,
    },
});
