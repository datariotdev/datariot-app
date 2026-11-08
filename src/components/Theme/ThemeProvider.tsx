import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme as baseTheme, Theme } from '../../design-system/theme';

export type ThemeMode = 'light' | 'dark';

// Define the shape of our context
interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => void;
    // We provide the full theme object, but with colors swapped based on mode
    theme: Theme;
}

const THEME_STORAGE_KEY = '@orvelis_theme_mode';

// Default values for context creation
const defaultContext: ThemeContextType = {
    mode: 'dark', // App is dark by default (Obsidian Premium)
    toggleTheme: () => { },
    setThemeMode: () => { },
    theme: baseTheme,
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

// --- Theme Palettes ---
// We keep the original colors in baseTheme.colors as the "dark" theme (blue-focused dark mode)
// We extract specific semantic overrides for light mode.

const darkColors = { ...baseTheme.colors };

const lightColors = {
    ...baseTheme.colors,
    primary: {
        DEFAULT: '#4C6EF5', // Premium high-contrast Royal Blue
        light: '#EDF2FF',
        dark: '#364FC7',
        ultra: '#DBE4FF',
        brand: '#4C6EF5',
        onPrimary: '#FFFFFF',
        glow: 'rgba(76, 110, 245, 0.12)',
        glowStrong: 'rgba(76, 110, 245, 0.25)',
        glowSubtle: 'rgba(76, 110, 245, 0.05)',
    },
    background: {
        primary: '#F8F8FA',
        DEFAULT: '#F8F8FA',
        secondary: '#F0F0F4',
        tertiary: '#E8E8EE',
        web: '#F8F8FA',
        webSecondary: '#FFFFFF',
        paper: '#FFFFFF',
    },
    surface: {
        ...baseTheme.colors.surface,
        DEFAULT: '#FFFFFF',
        light: '#FFFFFF',
        elevated: '#FFFFFF',
        overlay: 'rgba(248, 248, 250, 0.95)',
        card: '#FFFFFF',
        glass: 'rgba(255, 255, 255, 0.7)',
        glassHover: 'rgba(255, 255, 255, 0.85)',
        border: 'rgba(0, 0, 0, 0.05)',
        borderHover: 'rgba(0, 0, 0, 0.1)',
        borderActive: 'rgba(76, 110, 245, 0.2)',
    },
    text: {
        primary: '#111118',
        secondary: '#52526A',
        muted: '#8E8E9E',
        accent: '#4C6EF5',
    },
};


interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
    const [mode, setModeState] = useState<ThemeMode>('dark');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load saved theme from storage on mount
        const loadTheme = async () => {
            try {
                const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedMode === 'light' || savedMode === 'dark') {
                    setModeState(savedMode as ThemeMode);
                }
            } catch (error) {
                console.error('Failed to load theme preference:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        loadTheme();
    }, []);

    const setThemeMode = async (newMode: ThemeMode) => {
        setModeState(newMode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    const toggleTheme = () => {
        setThemeMode(mode === 'dark' ? 'light' : 'dark');
    };

    // Construct the active theme object
    const activeTheme: Theme = {
        ...baseTheme,
        colors: (mode === 'dark' ? darkColors : lightColors) as typeof baseTheme.colors,
    };

    if (!isLoaded) {
        // You could return null or a splash screen here while loading the preference
        return null;
    }

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme, setThemeMode, theme: activeTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
