import React from 'react';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '../Theme/ThemeProvider';

interface SafeAreaViewProps extends ViewProps {
    children: React.ReactNode;
    edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function SafeAreaView({ children, style, edges, ...props }: SafeAreaViewProps) {
    const { theme } = useTheme();
    return (
        <RNSafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }, style]} edges={edges} {...props}>
            {children}
        </RNSafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
