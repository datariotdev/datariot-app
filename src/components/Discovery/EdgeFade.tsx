import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../Theme/ThemeProvider';

/**
 * Every horizontal row on the feed is wider than the column it sits in, so its
 * last card is always cut by the column edge. Unfaded that reads as broken
 * layout rather than "there is more, scroll". Web only — on a phone the rows
 * page instead of overflowing.
 */
export const EdgeFade = ({ width = 40 }: { width?: number }) => {
    const { theme } = useTheme();

    if (Platform.OS !== 'web') return null;

    const colour = theme.colors.background.primary;

    return (
        <>
            <LinearGradient
                pointerEvents="none"
                colors={[colour, 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.fade, { width, left: 0 }]}
            />
            <LinearGradient
                pointerEvents="none"
                colors={['transparent', colour]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.fade, { width, right: 0 }]}
            />
        </>
    );
};

const styles = StyleSheet.create({
    fade: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        zIndex: 5,
    },
});
