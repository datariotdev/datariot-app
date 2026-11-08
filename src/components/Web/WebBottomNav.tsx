import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface TabItem {
    name: string;
    icon: (focused: boolean, color: string) => React.ReactNode;
    route: string;
}

const tabs: TabItem[] = [
    {
        name: 'Home',
        icon: (focused, color) => (
            <MaterialCommunityIcons
                name={focused ? 'home-variant' : 'home-variant-outline'}
                size={22}
                color={color}
            />
        ),
        route: '/',
    },
    {
        name: 'Discover',
        icon: (focused, color) => (
            <Ionicons
                name={focused ? 'navigate-circle' : 'navigate-circle-outline'}
                size={22}
                color={color}
            />
        ),
        route: '/discover',
    },
    {
        name: 'Create',
        icon: (focused, color) => (
            <View style={styles.createButton}>
                <LinearGradient
                    colors={['#D9E4FF', '#D9E4FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <Feather name="plus" size={20} color="#FFFFFF" />
            </View>
        ),
        route: '/create',
    },
    {
        name: 'Arena (Beta)',
        icon: (focused, color) => (
            <Ionicons
                name={focused ? 'shield' : 'shield-outline'}
                size={22}
                color={color}
            />
        ),
        route: '/ai',
    },
    {
        name: 'Inbox',
        icon: (focused, color) => (
            <Ionicons
                name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
                size={22}
                color={color}
            />
        ),
        route: '/inbox',
    },
];

import { theme as baseTheme } from '../../design-system/theme';
import { useTheme } from '../Theme/ThemeProvider';

export const WebBottomNav = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    if (Platform.OS !== 'web') return null;

    return (
        <View style={styles.container}>
            <View style={[styles.backdrop, {
                backgroundColor: 'transparent'
            }]} />
            <View style={styles.content}>
                {tabs.map((tab) => {
                    const isActive = tab.route === '/'
                        ? pathname === '/' || pathname === '/index'
                        : pathname.startsWith(tab.route);
                    const color = isActive ? theme.colors.primary.DEFAULT : theme.colors.text.secondary;

                    return (
                        <Pressable
                            key={tab.name}
                            style={styles.tabItem}
                            onPress={() => router.push(tab.route as any)}
                        >
                            {tab.name === 'Create' ? (
                                <View style={[styles.createButton, { backgroundColor: theme.colors.text.primary }]}>
                                    <Feather name="plus" size={20} color={theme.colors.background.primary} />
                                </View>
                            ) : (
                                <>
                                    {tab.icon(isActive, color)}
                                    <Text style={[
                                        styles.tabLabel,
                                        { color, opacity: isActive ? 1 : 0.7 },
                                        isActive && styles.tabLabelActive,
                                    ]}>
                                        {tab.name}
                                    </Text>
                                    {isActive && (
                                        <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary.DEFAULT }]} />
                                    )}
                                </>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 68,
        zIndex: 100,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 8,
        paddingBottom: 4,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        gap: 2,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.3,
        marginTop: 2,
    },
    tabLabelActive: {
        fontWeight: '700',
    },
    activeIndicator: {
        width: 16,
        height: 2,
        borderRadius: 1,
        marginTop: 3,
    },
    createButton: {
        width: 44,
        height: 30,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
