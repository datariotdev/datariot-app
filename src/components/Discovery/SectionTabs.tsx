import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../Theme/ThemeProvider';
import { theme } from '@design-system/theme';

interface SectionTabsProps {
    tabs: string[];
    activeTab: string;
    onTabPress: (tab: string) => void;
}

export const SectionTabs = ({ tabs, activeTab, onTabPress }: SectionTabsProps) => {
    const { mode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.container}
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <Pressable
                            key={tab}
                            onPress={() => onTabPress(tab)}
                            style={({ pressed }) => [
                                styles.tab,
                                pressed && { opacity: 0.8 },
                            ]}
                        >
                            {isActive ? (
                                <LinearGradient
                                    colors={['rgba(217, 228, 255, 0.95)', 'rgba(217, 228, 255, 0.98)']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.activeBackground}
                                >
                                    <Text style={styles.activeText}>{tab}</Text>
                                </LinearGradient>
                            ) : (
                                <View style={[
                                    styles.inactiveBackground,
                                    { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }
                                ]}>
                                    <Text style={[
                                        styles.inactiveText,
                                        { color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)' }
                                    ]}>
                                        {tab}
                                    </Text>
                                </View>
                            )}
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 12,
    },
    container: {
        paddingHorizontal: theme.spacing.lg,
        gap: 8,
        paddingVertical: 4,
    },
    tab: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    activeBackground: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    inactiveBackground: {
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    activeText: {
        color: '#000000',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    inactiveText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
