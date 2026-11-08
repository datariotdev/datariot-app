import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AmbientGlowProps {
    color?: string;
    size?: number;
    duration?: number;
    delay?: number;
    opacity?: number;
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({
    color = 'rgba(217, 228, 255, 0.2)',
    size = 600,
    duration = 25000,
    delay = 0,
    opacity = 0.5,
}) => {
    const { width, height } = useWindowDimensions();
    const moveAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

    useEffect(() => {
        const startAnimation = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(moveAnim, {
                        toValue: { x: 40, y: -30 },
                        duration: duration * 0.33,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                    Animated.timing(moveAnim, {
                        toValue: { x: -30, y: 40 },
                        duration: duration * 0.33,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                    Animated.timing(moveAnim, {
                        toValue: { x: 0, y: 0 },
                        duration: duration * 0.33,
                        useNativeDriver: Platform.OS !== 'web',
                    }),
                ])
            ).start();
        };

        const timeout = setTimeout(startAnimation, delay);
        return () => clearTimeout(timeout);
    }, [moveAnim, duration, delay]);

    return (
        <Animated.View
            style={[
                styles.glow,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    opacity: opacity,
                    backgroundColor: 'transparent',
                    transform: moveAnim.getTranslateTransform(),
                },
            ]}
            pointerEvents="none"
        >
            <LinearGradient
                colors={[color, 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0.5 }}
                end={{ x: 1, y: 1 }}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    glow: {
        position: 'absolute',
        filter: Platform.OS === 'web' ? 'blur(100px)' : undefined, // React Native doesn't support blur on View easily without BlurView
    },
});
