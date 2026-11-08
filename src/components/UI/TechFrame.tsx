import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@design-system/theme';

interface TechFrameProps {
    children: React.ReactNode;
    style?: ViewStyle;
    borderColor?: string;
    showBrackets?: boolean;
}

export const TechFrame: React.FC<TechFrameProps> = ({
    children,
    style,
    borderColor = 'rgba(255, 255, 255, 0.1)',
    showBrackets = true,
}) => {
    return (
        <View style={[styles.container, { borderColor }, style]}>
            {showBrackets && (
                <>
                    {/* Corner Brackets */}
                    <View style={[styles.bracket, styles.topLeft, { borderLeftColor: borderColor, borderTopColor: borderColor }]} />
                    <View style={[styles.bracket, styles.topRight, { borderRightColor: borderColor, borderTopColor: borderColor }]} />
                    <View style={[styles.bracket, styles.bottomLeft, { borderLeftColor: borderColor, borderBottomColor: borderColor }]} />
                    <View style={[styles.bracket, styles.bottomRight, { borderRightColor: borderColor, borderBottomColor: borderColor }]} />
                </>
            )}
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    bracket: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderWidth: 1.5,
        backgroundColor: 'transparent',
        zIndex: 5,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
});
