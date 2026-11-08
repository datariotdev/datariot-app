import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../components/Theme/ThemeProvider';

interface TrendingItem {
    id: string;
    label: string;
    trendScore: number;
    icon: string;
}

interface TrendingBulletsProps {
    onItemPress: (id: string) => void;
}

export const TrendingBullets: React.FC<TrendingBulletsProps> = ({ onItemPress }) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const items: TrendingItem[] = [
        { id: 'ai', label: 'Artificial Intelligence', trendScore: 98, icon: 'brain' },
        { id: 'jobs', label: 'Future of Jobs', trendScore: 85, icon: 'briefcase' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="flash-outline" size={16} color="#38BDF8" />
                <Text style={[styles.headerText, { color: '#38BDF8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>[ TRENDING.NOW ]</Text>
            </View>

            <View style={styles.list}>
                {items.map((item) => (
                    <Pressable
                        key={item.id}
                        style={styles.item}
                        onPress={() => onItemPress(item.id)}
                    >
                        <View style={styles.bulletRow}>
                            <View style={[styles.bullet, { backgroundColor: theme.colors.primary.DEFAULT }]} />
                            <MaterialCommunityIcons
                                name={item.icon as any}
                                size={18}
                                color={theme.colors.text.muted}
                                style={styles.icon}
                            />
                            <Text style={[styles.label, { color: theme.colors.text.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>{item.label.toUpperCase()}</Text>
                        </View>

                        <View style={styles.trendRow}>
                            <Text style={[styles.score, { color: theme.colors.primary.DEFAULT, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>{item.trendScore}% PULSE</Text>
                        </View>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
    },
    headerText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    list: {
        gap: 16,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bullet: {
        width: 3,
        height: 14,
        borderRadius: 2,
        marginRight: 12,
    },
    icon: {
        marginRight: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    score: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
