import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../components/Theme/ThemeProvider';

interface Intellect {
    id: string;
    username: string;
    avatarUrl: string;
    logicScore: number;
    activity: string;
}

interface IntellectRecommendationsProps {
    intellects: Intellect[];
    onFollow: (id: string) => void;
    onPress: (id: string) => void;
}

export const IntellectRecommendations: React.FC<IntellectRecommendationsProps> = ({ intellects, onFollow, onPress }) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="people-outline" size={18} color="#38BDF8" />
                <Text style={[styles.headerText, { color: '#38BDF8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>[ RECOMMENDED.MINDS ]</Text>
            </View>

            <View style={styles.list}>
                {intellects.slice(0, 5).map((intellect) => (
                    <Pressable
                        key={intellect.id}
                        style={[styles.item, {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                            borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
                        }]}
                        onPress={() => onPress(intellect.id)}
                    >
                        <Image source={{ uri: intellect.avatarUrl }} style={styles.avatar} />

                        <View style={styles.info}>
                            <Text style={[styles.username, { color: theme.colors.text.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>{`> @${intellect.username.toUpperCase()}`}</Text>
                            <Text style={[styles.activity, { color: theme.colors.text.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]} numberOfLines={1}>{intellect.activity.toUpperCase()}</Text>
                            <View style={styles.logicRow}>
                                <MaterialCommunityIcons name="molecule" size={12} color={theme.colors.primary.DEFAULT} />
                                <Text style={[styles.logicText, { color: theme.colors.primary.DEFAULT, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>REPUTATION: {intellect.logicScore.toLocaleString()}</Text>
                            </View>
                        </View>

                        <Pressable
                            style={[styles.followButton, {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
                            }]}
                            onPress={() => onFollow(intellect.id)}
                        >
                            <Text style={[styles.followText, { color: theme.colors.text.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>[ FOLLOW ]</Text>
                        </Pressable>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        paddingVertical: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    headerText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    list: {
        gap: 12,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    info: {
        flex: 1,
        marginLeft: 12,
        marginRight: 12,
    },
    username: {
        fontSize: 14,
        fontWeight: '700',
    },
    activity: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
    logicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    logicText: {
        fontSize: 10,
        fontWeight: '800',
    },
    followButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    followText: {
        fontSize: 10,
        fontWeight: '900',
    },
});
