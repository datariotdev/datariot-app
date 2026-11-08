import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Dimensions, Pressable, ActivityIndicator, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { encodeVideoUrl } from '../../lib/utils/url';

export interface FullScreenPlayerHandle {
    seekTo: (positionMillis: number) => Promise<void>;
}

interface FullScreenPlayerProps {
    videoUrl: string;
    isActive: boolean;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onVideoEnd?: () => void;
    onProgress?: (status: { positionMillis: number, durationMillis?: number }) => void;
    onDoubleTap?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 75;

export const FullScreenPlayer = forwardRef<FullScreenPlayerHandle, FullScreenPlayerProps>(({
    videoUrl,
    isActive,
    onSwipeUp,
    onSwipeDown,
    onVideoEnd,
    onProgress,
    onDoubleTap,
}, ref) => {
    const player = useVideoPlayer(encodeVideoUrl(videoUrl), player => {
        player.loop = true;
        player.muted = true; // Mute for autoplay
    });

    const [isPlaying, setIsPlaying] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEventListener(player, 'statusChange', ({ status, error }) => {
        if (status === 'loading') {
            setIsLoading(true);
            setHasError(false);
        } else if (status === 'readyToPlay') {
            setIsLoading(false);
            setRetryCount(0);
        } else if (status === 'error') {
            const errorString = error?.message || 'Unknown error';
            console.error(`Video Load Error (Attempt ${retryCount + 1}):`, errorString);

            // Check for timeout error -1001 (iOS) or general timeout symptoms
            const isTimeout = errorString.includes('-1001') ||
                errorString.toLowerCase().includes('timeout') ||
                errorString.includes('NSURLErrorDomain');

            if (isTimeout && retryCount < 3) {
                console.log(`Auto-retrying video load (${retryCount + 1}/3)...`);
                setTimeout(() => {
                    handleRetry();
                }, 2000); // 2 second delay before retry
            } else {
                setIsLoading(false);
                setHasError(true);
            }
        }
    });

    useEventListener(player, 'timeUpdate', ({ currentTime }) => {
        if (onProgress) {
            onProgress({
                positionMillis: currentTime * 1000,
                durationMillis: (player.duration || 0) * 1000
            });
        }
    });

    useEventListener(player, 'playToEnd', () => {
        onVideoEnd?.();
    });

    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);

    useImperativeHandle(ref, () => ({
        seekTo: async (positionMillis: number) => {
            if (isMounted.current) {
                try {
                    player.currentTime = positionMillis / 1000;
                } catch (e) {
                    console.warn('[FullScreenPlayer] seekTo failed:', e);
                }
            }
        },
    }));

    useEffect(() => {
        if (!isMounted.current) return;
        try {
            if (isActive && videoUrl) {
                player.play();
                setIsPlaying(true);
            } else {
                player.pause();
                setIsPlaying(false);
            }
        } catch (e) {
            console.warn('[FullScreenPlayer] handleAutoPlay failed:', e);
        }
    }, [isActive, videoUrl]);

    const togglePlayPause = () => {
        if (!isMounted.current) return;
        try {
            if (isPlaying) {
                player.pause();
                setIsPlaying(false);
            } else if (videoUrl) {
                player.play();
                setIsPlaying(true);
            }
        } catch (e) {
            console.warn('[FullScreenPlayer] togglePlayPause failed:', e);
        }
    };

    const handleSwipeUp = () => {
        onSwipeUp?.();
    };

    const handleSwipeDown = () => {
        onSwipeDown?.();
    };

    const handleRetry = () => {
        setHasError(false);
        setIsLoading(true);
        setRetryCount(prev => prev + 1);
        player.replace(encodeVideoUrl(videoUrl));
    };

    const panGesture = Gesture.Pan()
        .onUpdate((event) => {
            translateY.value = event.translationY;
            opacity.value = 1 - Math.abs(event.translationY) / SCREEN_HEIGHT;
        })
        .onEnd((event) => {
            if (event.translationY < -SWIPE_THRESHOLD) {
                // Swipe up
                runOnJS(handleSwipeUp)();
                translateY.value = withTiming(0);
                opacity.value = withTiming(1);
            } else if (event.translationY > SWIPE_THRESHOLD) {
                // Swipe down
                runOnJS(handleSwipeDown)();
                translateY.value = withTiming(0);
                opacity.value = withTiming(1);
            } else {
                // Return to original position
                translateY.value = withTiming(0);
                opacity.value = withTiming(1);
            }
        });

    const singleTap = Gesture.Tap()
        .onEnd(() => {
            runOnJS(togglePlayPause)();
        });

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            if (onDoubleTap) {
                runOnJS(onDoubleTap)();
            }
        });

    const composedGesture = Gesture.Race(panGesture, Gesture.Exclusive(doubleTap, singleTap));

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.container, animatedStyle]}>
                <View style={styles.videoContainer}>
                    {videoUrl ? (
                        <VideoView
                            key={`${videoUrl}-${retryCount}`}
                            player={player}
                            style={styles.video}
                            contentFit="contain"
                            nativeControls={false}
                        />
                    ) : (
                        <View style={[styles.video, { justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="videocam-off" size={64} color="rgba(255,255,255,0.15)" />
                        </View>
                    )}
                    {isLoading && (
                        <View style={styles.centerOverlay}>
                            <ActivityIndicator size="large" color="#D9E4FF" />
                        </View>
                    )}
                    {hasError && (
                        <View style={styles.centerOverlay}>
                            <Text style={styles.errorText}>Video unavailable</Text>
                            <Text style={styles.errorSubText}>
                                {retryCount > 0 ? `Failed after ${retryCount + 1} attempts` : videoUrl.split('/').pop()}
                            </Text>
                            <Pressable
                                style={styles.retryButton}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleRetry();
                                }}
                            >
                                <Text style={styles.retryButtonText}>Try Again</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </Animated.View>
        </GestureDetector>
    );
});

FullScreenPlayer.displayName = 'FullScreenPlayer';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000814',
    },
    videoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    videoStyle: {
        width: '100%',
        height: '100%',
    },
    centerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    errorText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    errorSubText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#D9E4FF',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
