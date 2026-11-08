import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withTiming,
    interpolateColor
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../Theme/ThemeProvider';

interface DebateSwitcherProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const TABS = [
    { id: 'active', label: 'ARENAS', icon: 'flame' },
    { id: 'historical', label: 'HISTORY', icon: 'time' },
    { id: 'dives', label: 'DIVES', icon: 'search' },
];

export const DebateSwitcher: React.FC<DebateSwitcherProps> = ({ activeTab, onTabChange }) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const { width } = useWindowDimensions();
    const CONTAINER_WIDTH = width - 32;
    const TAB_WIDTH = (CONTAINER_WIDTH - 8) / TABS.length;

    const activeIndex = TABS.findIndex(t => t.id === activeTab);
    const translateX = useSharedValue(activeIndex * TAB_WIDTH);

    React.useEffect(() => {
        translateX.value = withSpring(activeIndex * TAB_WIDTH, {
            damping: 20,
            stiffness: 90,
        });
    }, [activeIndex, TAB_WIDTH]);

    const slidingIndicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View style={styles.container}>
            <View style={[
                styles.content,
                {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }
            ]}>
                {/* Animated Background Pill */}
                <Animated.View style={[
                    styles.activePill,
                    { width: TAB_WIDTH },
                    slidingIndicatorStyle
                ]}>
                    <BlurView intensity={isDark ? 30 : 50} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill}>
                        <View style={[
                            StyleSheet.absoluteFill,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)' }
                        ]} />
                    </BlurView>
                </Animated.View>

                {TABS.map((tab, index) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <Pressable
                            key={tab.id}
                            onPress={() => onTabChange(tab.id)}
                            style={styles.tab}
                        >
                            <Ionicons
                                name={tab.icon as any}
                                size={14}
                                color={isActive ? (isDark ? '#FFF' : theme.colors.primary.DEFAULT) : 'rgba(128,128,128,0.5)'}
                                style={styles.tabIcon}
                            />
                            <Text style={[
                                styles.tabText,
                                { color: isActive ? theme.colors.text.primary : theme.colors.text.secondary },
                                isActive && styles.activeTabText
                            ]}>
                                {tab.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 20,
    },
    content: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 4,
        borderWidth: 1,
        position: 'relative',
        height: 52,
        alignItems: 'center',
    },
    activePill: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 4,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    tabIcon: {
        marginRight: 6,
    },
    tabText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    activeTabText: {
        // fontWeight: '900',
    },
});
