import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { setAudioModeAsync } from 'expo-audio';
import { Feather, SimpleLineIcons, Ionicons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { View, Dimensions, Platform, useWindowDimensions, StyleSheet } from 'react-native';
import { ResponsiveLayout } from '../../components/Layout/ResponsiveLayout';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const isDesktopWeb = Platform.OS === 'web' && width > 768;

    return (
        <ResponsiveLayout>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    // Let the layout's HUD backdrop show through instead of the
                    // navigator's default light scene background.
                    sceneStyle: { backgroundColor: 'transparent' },
                    tabBarActiveTintColor: theme.colors.primary.DEFAULT,
                    tabBarInactiveTintColor: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0,0,0,0.4)',
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
                        paddingTop: 4,
                    },
                    tabBarBackground: () => null,
                    tabBarLabelStyle: {
                        display: 'none',
                    },
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
                        title: '',
                        tabBarIcon: ({ focused, color }) => (
                            <MaterialCommunityIcons
                                name={focused ? "home-variant" : "home-variant-outline"}
                                size={24}
                                color={color}
                                style={{ opacity: focused ? 1 : 0.8 }}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="discover"
                    options={{
                        title: '',
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
                        title: '',
                        tabBarIcon: ({ focused }) => (
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme.colors.primary.DEFAULT,
                                shadowColor: theme.colors.primary.DEFAULT,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4,
                            }}>
                                <Feather
                                    name="plus"
                                    size={22}
                                    color="#000000"
                                />
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="ai"
                    options={{
                        title: '',
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
                        title: '',
                        tabBarIcon: ({ focused, color }) => (
                            <Ionicons
                                name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
                                size={24}
                                color={color}
                                style={{ opacity: focused ? 1 : 0.8 }}
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
