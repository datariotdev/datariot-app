import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../design-system/theme';

interface LeaderboardUser {
    id: string;
    username: string;
    avatarUrl: string;
    logicScore: number;
    rank: number;
}

interface LogicLeaderboardProps {
    users: LeaderboardUser[];
    onUserPress: (userId: string) => void;
}

export const LogicLeaderboard: React.FC<LogicLeaderboardProps> = ({ users, onUserPress }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <MaterialCommunityIcons name="trophy-outline" size={20} color={theme.colors.warning} />
                    <Text style={styles.title}>REPUTATION MASTERS</Text>
                </View>
                <Pressable>
                    <Text style={styles.viewAll}>View All</Text>
                </Pressable>
            </View>

            <View style={styles.list}>
                {users.slice(0, 5).map((user, index) => (
                    <Pressable
                        key={user.id}
                        style={styles.userRow}
                        onPress={() => onUserPress(user.id)}
                    >
                        <View style={styles.rankContainer}>
                            <Text style={[
                                styles.rankText,
                                index === 0 && { color: theme.colors.warning },
                                index === 1 && { color: '#C0C0C0' },
                                index === 2 && { color: '#CD7F32' },
                            ]}>
                                #{user.rank}
                            </Text>
                        </View>

                        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />

                        <View style={styles.userInfo}>
                            <Text style={styles.username}>@{user.username}</Text>
                            <View style={styles.scoreRow}>
                                <MaterialCommunityIcons name="molecule" size={12} color={theme.colors.primary.light} />
                                <Text style={styles.scoreText}>{user.logicScore.toLocaleString()}</Text>
                            </View>
                        </View>

                        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    viewAll: {
        color: theme.colors.primary.light,
        fontSize: 12,
        fontWeight: '700',
    },
    list: {
        gap: 12,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    rankContainer: {
        width: 30,
    },
    rankText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontWeight: '900',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    userInfo: {
        flex: 1,
    },
    username: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    scoreText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '600',
    },
});
