/**
 * Datariot Theme — Ultra Premium
 * Deep Obsidian base with Ice Blue (#D9E4FF) luminous accents
 * Layered depth system with glass morphism & colored glow
 */

export const colors = {
    // Primary - Vivid Ice Blue (Logo Accent) — KEPT ORIGINAL
    primary: {
        DEFAULT: '#D9E4FF',
        light: '#EAF0FF',
        dark: '#BDEBFF',
        ultra: '#E0F2FE',
        brand: '#D9E4FF',
        onPrimary: '#000000',
        glow: 'rgba(217, 228, 255, 0.25)',
        glowStrong: 'rgba(217, 228, 255, 0.45)',
        glowSubtle: 'rgba(217, 228, 255, 0.08)',
    },

    // Secondary — KEPT ORIGINAL + enhanced
    secondary: {
        DEFAULT: '#BDEBFF',
        dark: '#A5C6FF',
        light: '#FFFFFF',
        onSecondary: '#000000',
        glow: 'rgba(189, 235, 255, 0.2)',
    },

    // Backgrounds — Ultra Deep Obsidian Layers
    background: {
        primary: '#08090D',
        DEFAULT: '#08090D',
        paper: '#0C0D12',
        secondary: '#0E1017',
        tertiary: '#13151D',
        web: '#08090D',
        webSecondary: '#0C0D12',
    },

    // Surfaces — Glass Morphism System
    surface: {
        DEFAULT: '#0E1017',
        light: '#13151D',
        elevated: '#181B25',
        overlay: 'rgba(0, 0, 0, 0.85)',
        card: '#111318',
        glass: 'rgba(255, 255, 255, 0.03)',
        glassHover: 'rgba(255, 255, 255, 0.06)',
        border: 'rgba(255, 255, 255, 0.05)',
        borderHover: 'rgba(255, 255, 255, 0.10)',
        borderActive: 'rgba(217, 228, 255, 0.20)',
    },

    // Text colors — Premium Hierarchy
    text: {
        primary: '#EEEEF0',
        secondary: '#8E90A0',
        muted: '#55576A',
        accent: '#D9E4FF',
    },

    // Semantic colors
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',

    // Special
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
} as const;

// Premium Gradient Pairs
export const gradients = {
    primary: ['#D9E4FF', '#A5C6FF', '#7AA2FF'] as const,
    primarySoft: ['rgba(217, 228, 255, 0.20)', 'rgba(217, 228, 255, 0.02)'] as const,
    ambient: ['rgba(217, 228, 255, 0.08)', 'rgba(217, 228, 255, 0.01)', 'transparent'] as const,
    surface: ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.01)'] as const,
    surfaceHover: ['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0.03)'] as const,
    aurora: ['#D9E4FF', '#BDEBFF', '#E0F2FE'] as const,
    auroraAmbient: ['rgba(217, 228, 255, 0.12)', 'rgba(189, 235, 255, 0.05)', 'transparent'] as const,
    cardShine: ['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.00)'] as const,
    darkFade: ['rgba(8, 9, 13, 0)', 'rgba(8, 9, 13, 0.8)', '#08090D'] as const,
} as const;

export const typography = {
    fontFamilies: {
        light: 'Outfit_300Light',
        regular: 'Outfit_400Regular',
        medium: 'Outfit_500Medium',
        semibold: 'Outfit_600SemiBold',
        bold: 'Outfit_700Bold',
        extrabold: 'Outfit_800ExtraBold',
        black: 'Outfit_900Black',
        tech: 'SpaceGrotesk_500Medium',
        brand: 'Syncopate_700Bold',
        mono: 'SpaceGrotesk_400Regular',
    },

    sizes: {
        xs: 11,
        sm: 13,
        base: 15,
        lg: 17,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
    },

    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
} as const;

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
} as const;

export const borderRadius = {
    none: 0,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
} as const;

export const shadows = {
    sm: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    },
    glow: {
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    glowSubtle: {
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
} as const;

export const animation = {
    duration: {
        fast: 120,
        normal: 220,
        slow: 350,
        dramatic: 500,
    },
    easing: {
        default: 'ease-in-out',
        elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
    },
} as const;

export const theme = {
    colors,
    gradients,
    typography,
    spacing,
    borderRadius,
    shadows,
    animation,
} as const;

export type Theme = typeof theme;
