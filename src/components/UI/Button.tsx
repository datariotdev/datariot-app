import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps } from 'react-native';
import { theme } from '@design-system/theme';

interface ButtonProps extends PressableProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
}

export function Button({
    title,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    fullWidth = false,
    style,
    ...props
}: ButtonProps) {
    return (
        <Pressable
            style={(state) => [
                styles.base,
                styles[variant],
                styles[size],
                fullWidth && styles.fullWidth,
                (disabled || loading) && styles.disabled,
                state.pressed && styles.pressed,
                typeof style === 'function' ? style(state) : style,
            ]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? theme.colors.primary.DEFAULT : theme.colors.white} />
            ) : (
                <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`]]}>
                    {title}
                </Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius.lg,
        flexDirection: 'row',
    },
    fullWidth: {
        width: '100%',
    },

    // Variants
    primary: {
        backgroundColor: theme.colors.primary.DEFAULT,
    },
    secondary: {
        backgroundColor: theme.colors.secondary.DEFAULT,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.primary.DEFAULT,
    },
    ghost: {
        backgroundColor: 'transparent',
    },

    // Sizes
    small: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 36,
    },
    medium: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        minHeight: 48,
    },
    large: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        minHeight: 56,
    },

    // Text styles
    text: {
        fontWeight: '600',
    },
    primaryText: {
        color: theme.colors.white,
    },
    secondaryText: {
        color: theme.colors.white,
    },
    outlineText: {
        color: theme.colors.primary.DEFAULT,
    },
    ghostText: {
        color: theme.colors.primary.DEFAULT,
    },
    smallText: {
        fontSize: theme.typography.sizes.sm,
    },
    mediumText: {
        fontSize: theme.typography.sizes.base,
    },
    largeText: {
        fontSize: theme.typography.sizes.lg,
    },

    // States
    pressed: {
        opacity: 0.8,
    },
    disabled: {
        opacity: 0.5,
    },
});
