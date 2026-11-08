import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    runOnJS
} from 'react-native-reanimated';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView
} from 'react-native-gesture-handler';
import { PulseItem } from './PulseItem';
import { DNABackground } from './DNABackground';
import { useTheme } from '../../Theme/ThemeProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define node positions in a nebula-like grid
// We'll create a 3x3 grid but slightly offset for a more "organic" feel
const NODE_POSITIONS = [
    { x: 0, y: 0 }, // Center (Index 0)
    { x: -SCREEN_WIDTH * 0.7, y: -SCREEN_HEIGHT * 0.5 }, // Top Left
    { x: SCREEN_WIDTH * 0.7, y: -SCREEN_HEIGHT * 0.5 },  // Top Right
    { x: -SCREEN_WIDTH * 0.7, y: SCREEN_HEIGHT * 0.5 },  // Bottom Left
    { x: SCREEN_WIDTH * 0.7, y: SCREEN_HEIGHT * 0.5 },   // Bottom Right
    { x: 0, y: -SCREEN_HEIGHT * 0.8 },                   // Far Top
    { x: 0, y: SCREEN_HEIGHT * 0.8 },                    // Far Bottom
    { x: -SCREEN_WIDTH * 0.9, y: 0 },                    // Far Left
    { x: SCREEN_WIDTH * 0.9, y: 0 },                     // Far Right
];

interface PulseFeedProps {
    videos: any[];
    onLike: (id: string) => void;
    onComment: (id: string) => void;
    onSave: (id: string) => void;
    onMore: (id: string) => void;
    onFollow: (id: string) => void;
    isFocused?: boolean;
}

export const PulseFeed = ({
    videos,
    onLike,
    onComment,
    onSave,
    onMore,
    onFollow,
    isFocused = true
}: PulseFeedProps) => {
    const { theme } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);

    // Camera/Plane offset
    const offsetX = useSharedValue(0);
    const offsetY = useSharedValue(0);

    // To keep track of the offset at the start of a gesture
    const startX = useSharedValue(0);
    const startY = useSharedValue(0);

    const handleSelect = useCallback((index: number) => {
        setActiveIndex(index);
        // Center the selected node
        offsetX.value = withSpring(-NODE_POSITIONS[index % NODE_POSITIONS.length].x);
        offsetY.value = withSpring(-NODE_POSITIONS[index % NODE_POSITIONS.length].y);
    }, []);

    const panGesture = Gesture.Pan()
        .onStart(() => {
            startX.value = offsetX.value;
            startY.value = offsetY.value;
        })
        .onUpdate((event) => {
            offsetX.value = startX.value + event.translationX;
            offsetY.value = startY.value + event.translationY;
        })
        .onEnd((event) => {
            // Find the nearest node to the current center
            let nearestIndex = activeIndex;
            let minDistance = Infinity;

            // We only check against the nodes we have videos for
            const limit = Math.min(videos.length, NODE_POSITIONS.length);

            for (let i = 0; i < limit; i++) {
                const nodeX = NODE_POSITIONS[i].x;
                const nodeY = NODE_POSITIONS[i].y;

                // Distance from current "camera center" (-offsetX, -offsetY) to node
                const dist = Math.sqrt(
                    Math.pow(nodeX + offsetX.value, 2) +
                    Math.pow(nodeY + offsetY.value, 2)
                );

                if (dist < minDistance) {
                    minDistance = dist;
                    nearestIndex = i;
                }
            }

            runOnJS(handleSelect)(nearestIndex);
        });

    const animatedPlaneStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: offsetX.value },
                { translateY: offsetY.value }
            ],
        };
    });

    // Take only as many videos as we have positions
    const displayVideos = useMemo(() => videos.slice(0, NODE_POSITIONS.length), [videos]);

    return (
        <GestureHandlerRootView style={styles.container}>
            <DNABackground />

            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.plane, animatedPlaneStyle]}>
                    {displayVideos.map((video, index) => {
                        const pos = NODE_POSITIONS[index];
                        return (
                            <PulseItem
                                key={video.id}
                                video={video}
                                status={activeIndex === index ? 'focus' : 'satellite'}
                                position={{
                                    x: pos.x,
                                    y: pos.y
                                }}
                                onSelect={() => handleSelect(index)}
                                isMuted={activeIndex !== index}
                                isScreenFocused={isFocused}
                            />
                        );
                    })}
                </Animated.View>
            </GestureDetector>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    plane: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
