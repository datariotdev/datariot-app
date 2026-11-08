import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../Theme/ThemeProvider';

export const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

/** A dock module: label, hairline rule out to the edge, optional right-hand status. */
export const DockModule = ({
    title,
    right,
    children,
    gap = 32,
}: {
    title: string;
    right?: React.ReactNode;
    children: React.ReactNode;
    gap?: number;
}) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <View style={{ marginBottom: gap }}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.secondary, fontFamily: MONO }]}>
                    {title}
                </Text>
                <View style={[styles.rule, { backgroundColor: isDark ? 'rgba(217, 228, 255, 0.12)' : 'rgba(0,0,0,0.09)' }]} />
                {right}
            </View>
            {children}
        </View>
    );
};

/** The panel surface every dock card sits on. */
export const useDockSurface = () => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    return {
        theme,
        isDark,
        accent: theme.colors.primary.DEFAULT,
        /** Opaque — charts need a known surface colour to draw rings and gaps against. */
        surface: isDark ? '#0B0C11' : '#FFFFFF',
        cardBg: isDark ? 'rgba(15, 17, 24, 0.75)' : 'rgba(255, 255, 255, 0.9)',
        cardBorder: isDark ? 'rgba(217, 228, 255, 0.10)' : 'rgba(0, 0, 0, 0.07)',
        hairline: isDark ? 'rgba(217, 228, 255, 0.12)' : 'rgba(0,0,0,0.09)',
    };
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    title: {
        fontSize: 9.5,
        letterSpacing: 2.4,
        fontWeight: '700',
        flexShrink: 0,
    },
    rule: {
        flex: 1,
        minWidth: 10,
        height: 1,
    },
});
