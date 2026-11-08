import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { theme } from '@design-system/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMELINE_HEIGHT = 60;
const HANDLE_WIDTH = 20;
const TIMELINE_PADDING = 20;
const TIMELINE_WIDTH = SCREEN_WIDTH - (TIMELINE_PADDING * 2);

export default function EditorScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const videoUri = params.videoUri as string;

    const player = useVideoPlayer(videoUri || null, player => {
        player.timeUpdateEventInterval = 0.05; // Update every 50ms for smooth timeline
    });

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0); // in milliseconds
    const [position, setPosition] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);

    useEventListener(player, 'playingChange', ({ isPlaying }) => {
        setIsPlaying(isPlaying);
    });

    useEventListener(player, 'timeUpdate', ({ currentTime }) => {
        const positionMillis = currentTime * 1000;
        setPosition(positionMillis);

        // Loop within trim
        if (player.playing && trimEnd > 0 && positionMillis >= trimEnd) {
            player.currentTime = trimStart / 1000;
        }
    });

    useEventListener(player, 'statusChange', ({ status }) => {
        if (status === 'readyToPlay' && !isLoaded && player.duration > 0) {
            const ms = player.duration * 1000;
            setDuration(ms);
            setTrimEnd(ms);
            setIsLoaded(true);
        }
    });

    // Animated values for handles
    const leftHandleX = useSharedValue(0);
    const rightHandleX = useSharedValue(TIMELINE_WIDTH);

    useEffect(() => {
        if (!videoUri) {
            Alert.alert("Error", "No video loaded");
            router.back();
        }
    }, [videoUri, router]);

    // Update trim times when handles move
    const updateTrimTimes = (leftX: number, rightX: number) => {
        if (duration > 0) {
            const start = (leftX / TIMELINE_WIDTH) * duration;
            const end = (rightX / TIMELINE_WIDTH) * duration;
            setTrimStart(start);
            setTrimEnd(end);
        }
    };

    function seekTo(millis: number) {
        player.currentTime = millis / 1000;
    }

    // Gestures
    const leftHandleGesture = Gesture.Pan()
        .onUpdate((e) => {
            const newX = Math.max(0, Math.min(e.absoluteX - TIMELINE_PADDING, rightHandleX.value - HANDLE_WIDTH * 2));
            leftHandleX.value = newX;
            runOnJS(updateTrimTimes)(newX, rightHandleX.value);
        })
        .onEnd(() => {
            runOnJS(seekTo)(leftHandleX.value / TIMELINE_WIDTH * duration);
        });

    const rightHandleGesture = Gesture.Pan()
        .onUpdate((e) => {
            const newX = Math.max(leftHandleX.value + HANDLE_WIDTH * 2, Math.min(e.absoluteX - TIMELINE_PADDING, TIMELINE_WIDTH));
            rightHandleX.value = newX;
            runOnJS(updateTrimTimes)(leftHandleX.value, newX);
        })
        .onEnd(() => {
            runOnJS(seekTo)(rightHandleX.value / TIMELINE_WIDTH * duration);
        });

    const leftHandleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: leftHandleX.value }],
    }));

    const rightHandleStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: rightHandleX.value }],
    }));

    // Middle overlay style
    const selectedRegionStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: leftHandleX.value }],
        width: rightHandleX.value - leftHandleX.value,
    }));

    const togglePlay = () => {
        if (isPlaying) {
            player.pause();
        } else {
            // If we are at the end of the trim, restart from trim start
            if (position >= trimEnd) {
                player.currentTime = trimStart / 1000;
            }
            player.play();
        }
    };


    const handleSave = () => {
        // Navigate to upload/publish screen with the trimmed parameters
        router.push({
            pathname: '/publish',
            params: {
                videoUri,
                trimStart,
                trimEnd
            }
        });
    };

    const formatTime = (millis: number) => {
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Editor</Text>
                    <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                        <Text style={styles.saveButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>

                {/* Video Preview */}
                <View style={styles.videoContainer}>
                    <VideoView
                        player={player}
                        style={styles.video}
                        contentFit="contain"
                        nativeControls={false}
                    />
                    {!isPlaying && (
                        <TouchableOpacity style={styles.playOverlay} onPress={togglePlay}>
                            <Ionicons name="play" size={50} color="white" />
                        </TouchableOpacity>
                    )}
                    {isPlaying && (
                        <TouchableOpacity style={styles.pauseOverlay} onPress={togglePlay} />
                    )}
                </View>

                {/* Controls Area */}
                <View style={styles.controlsContainer}>
                    <View style={styles.timeInfo}>
                        <Text style={styles.timeText}>{formatTime(position)} / {formatTime(duration)}</Text>
                    </View>

                    {/* Timeline Trimmer */}
                    <View style={styles.timelineContainer}>
                        {/* Background track */}
                        <View style={styles.timelineTrack} />

                        {/* Selected Region (Yellow highlight) */}
                        <Animated.View style={[styles.selectedRegion, selectedRegionStyle]} />

                        {/* Left Handle */}
                        <GestureDetector gesture={leftHandleGesture}>
                            <Animated.View style={[styles.handle, styles.leftHandle, leftHandleStyle]}>
                                <View style={styles.handleBar} />
                            </Animated.View>
                        </GestureDetector>

                        {/* Right Handle */}
                        <GestureDetector gesture={rightHandleGesture}>
                            <Animated.View style={[styles.handle, styles.rightHandle, rightHandleStyle]}>
                                <View style={styles.handleBar} />
                            </Animated.View>
                        </GestureDetector>
                    </View>

                    <Text style={styles.hintText}>Drag ends to trim</Text>
                </View>

            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        zIndex: 10,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: theme.colors.primary.DEFAULT,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    videoContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 20,
        borderRadius: 50,
    },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    controlsContainer: {
        height: 200,
        backgroundColor: '#111',
        padding: 20,
        justifyContent: 'center',
    },
    timeInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    timeText: {
        color: 'white',
        fontVariant: ['tabular-nums'],
    },
    timelineContainer: {
        height: TIMELINE_HEIGHT,
        width: TIMELINE_WIDTH,
        alignSelf: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    timelineTrack: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#333',
        borderRadius: 8,
        overflow: 'hidden',
    },
    selectedRegion: {
        position: 'absolute',
        height: '100%',
        backgroundColor: 'rgba(217, 228, 255, 0.3)', // Logo Blue with opacity
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderColor: '#D9E4FF',
    },
    handle: {
        position: 'absolute',
        width: HANDLE_WIDTH,
        height: TIMELINE_HEIGHT + 10, // Slightly taller
        backgroundColor: '#D9E4FF',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        top: -5,
    },
    leftHandle: {
        left: 0,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
    rightHandle: {
        left: -HANDLE_WIDTH, // Offset because translateX handles position
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
    },
    handleBar: {
        width: 4,
        height: 20,
        backgroundColor: '#000',
        borderRadius: 2,
    },
    hintText: {
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
        fontSize: 12,
    },
});
