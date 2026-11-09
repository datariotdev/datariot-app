import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { setAudioModeAsync } from 'expo-audio';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Platform, useWindowDimensions } from 'react-native';
import { ResponsiveLayout } from '../../components/Layout/ResponsiveLayout';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TabLayout = () => {
    useEffect(() => {
        const initAudio = async () => {
            try {
                await setAudioModeAsync({
                    playsInSilentMode: true,
                    shouldRouteThroughEarpiece: false,
                });
            } catch (e) {
                console.error('Failed to set audio mode:', e);
            }
        };
        initAudio();
    }, []);

    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const bottomInset = Math.max(insets.bottom, 8);
    const { mode } = useTheme();
    const isDark = mode === 'dark';
    const activeTabColor = isDark ? '#E1E8F5' : '#293548';
    const inactiveTabColor = isDark ? '#A0ACBE' : '#586579';
    const isDesktopWeb = Platform.OS === 'web' && width > 768;

    return (
        <ResponsiveLayout>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    // Let the layout's HUD backdrop show through instead of the
                    // navigator's default light scene background.
                    sceneStyle: { backgroundColor: 'transparent' },
                    tabBarActiveTintColor: activeTabColor,
                    tabBarInactiveTintColor: inactiveTabColor,
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        display: isDesktopWeb ? 'none' : 'flex',
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 56 + bottomInset,
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        borderTopWidth: 0,
                        borderTopColor: 'transparent',
                        borderColor: 'transparent',
                        elevation: 0,
                        shadowOpacity: 0,
                        shadowColor: 'transparent',
                        shadowOffset: { width: 0, height: 0 },
                        shadowRadius: 0,
                        paddingBottom: bottomInset,
                        paddingTop: 12,
                    },
                    tabBarBackground: () => null,
                    tabBarItemStyle: {
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    tabBarHideOnKeyboard: true,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ focused, color }) => (
                            <MaterialCommunityIcons
                                name={focused ? "home-variant" : "home-variant-outline"}
                                size={24}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="discover"
                    options={{
                        title: 'Discover',
                        tabBarIcon: ({ focused, color }) => (
                            <Ionicons
                                name={focused ? "navigate-circle" : "navigate-circle-outline"}
                                size={24}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="create"
                    options={{
                        title: 'Create',
                        tabBarIcon: () => (
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: activeTabColor,
                                shadowColor: activeTabColor,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4,
                            }}>
                                <Feather
                                    name="plus"
                                    size={22}
                                    color={isDark ? '#293548' : '#F7F9FC'}
                                />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="ai"
                    options={{
                        title: 'Orvelis AI',
                        tabBarIcon: ({ focused, color }) => (
                            <MaterialCommunityIcons
                                name={focused ? "robot-excited" : "robot-excited-outline"}
                                size={24}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="inbox"
                    options={{
                        title: 'Inbox',
                        tabBarIcon: ({ focused, color }) => (
                            <Ionicons
                                name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
                                size={24}
                                color={color}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        href: null, // This is the correct way in Expo Router to completely remove the tab
                    }}
                />
            </Tabs>
        </ResponsiveLayout>
    );
};

export default TabLayout;
