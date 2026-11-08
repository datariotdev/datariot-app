import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    interpolate,
    Extrapolation
} from 'react-native-reanimated';
import { useTheme } from '../../Theme/ThemeProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NODE_COUNT = 15;
const NODE_SIZE = 8;
const STRAND_GAP = 60;

const DNANode = ({ index, color, delay }: { index: number; color: string; delay: number }) => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(1, {
                duration: 4000,
                easing: Easing.linear
            }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const verticalPos = (index / NODE_COUNT) * SCREEN_HEIGHT;
        // Add a vertical oscillation
        const verticalOffset = Math.sin(rotation.value * Math.PI * 2 + index * 0.5) * 10;

        // Orbital horizontal position
        const angle = rotation.value * Math.PI * 2 + (index * 0.4) + delay;
        const horizontalOffset = Math.sin(angle) * STRAND_GAP;

        // Z-index effect using scale and opacity
        const zIndex = Math.cos(angle);
        const scale = interpolate(zIndex, [-1, 1], [0.6, 1.2], Extrapolation.CLAMP);
        const opacity = interpolate(zIndex, [-1, 1], [0.1, 0.4], Extrapolation.CLAMP);

        return {
            position: 'absolute',
            top: verticalPos + verticalOffset,
            left: (SCREEN_WIDTH / 2) - (NODE_SIZE / 2) + horizontalOffset,
            width: NODE_SIZE,
            height: NODE_SIZE,
            borderRadius: NODE_SIZE / 2,
            backgroundColor: color,
            opacity,
            transform: [{ scale }],
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
        };
    });

    return <Animated.View style={animatedStyle} />;
};

export const DNABackground = () => {
    const { theme } = useTheme();

    const nodes = Array.from({ length: NODE_COUNT });

    return (
        <View style={[StyleSheet.absoluteFill, styles.container]}>
            {/* Background Glow */}
            <View style={[styles.glow, { backgroundColor: theme.colors.primary.DEFAULT, opacity: 0.05 }]} />

            {/* Strand 1 (Primary Blue) */}
            {nodes.map((_, i) => (
                <DNANode
                    key={`s1-${i}`}
                    index={i}
                    color={theme.colors.primary.DEFAULT}
                    delay={0}
                />
            ))}

            {/* Strand 2 (Secondary/AI Purple-ish) */}
            {nodes.map((_, i) => (
                <DNANode
                    key={`s2-${i}`}
                    index={i}
                    color={theme.colors.secondary?.DEFAULT || '#D9E4FF'}
                    delay={Math.PI} // Opposite side
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        top: -SCREEN_HEIGHT * 0.2,
        left: -SCREEN_WIDTH * 0.2,
        width: SCREEN_WIDTH * 1.4,
        height: SCREEN_HEIGHT * 1.4,
        borderRadius: SCREEN_WIDTH,
    }
});
