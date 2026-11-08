import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@design-system/theme';

import { useTheme } from '../Theme/ThemeProvider';

interface Creator {
    id: string;
    displayName: string;
    avatarUrl: string;
    bio?: string;
    followers: number;
    isFollowing: boolean;
    recentPosts?: string[]; // URLs of recent post thumbnails
}

interface CreatorCardProps {
    creator: Creator;
    onPress: () => void;
    onFollow: () => void;
}

export const CreatorCard = ({ creator, onPress, onFollow }: CreatorCardProps) => {
    const { mode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <Pressable onPress={onPress} style={styles.container}>
            <LinearGradient
                colors={isDark ? ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)'] : ['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.02)']}
                style={[styles.gradient, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
            >
                {/* Avatar with Gradient Border */}
                <View style={styles.avatarContainer}>
                    <LinearGradient
                        colors={[theme.colors.primary.light, theme.colors.secondary.DEFAULT]}
                        style={styles.avatarGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Image
                            source={{ uri: creator.avatarUrl || 'https://via.placeholder.com/80' }}
                            style={styles.avatar}
                        />
                    </LinearGradient>
                </View>

                {/* Creator Info */}
                <Text style={styles.name} numberOfLines={1}>{creator.displayName}</Text>
                <Text style={styles.followers}>{formatFollowers(creator.followers)} followers</Text>

                {creator.bio && (
                    <Text style={styles.bio} numberOfLines={2}>{creator.bio}</Text>
                )}

                {/* Recent Posts Preview */}
                {creator.recentPosts && creator.recentPosts.length > 0 && (
                    <View style={styles.postsPreview}>
                        {creator.recentPosts.slice(0, 3).map((postUrl, index) => (
                            <Image
                                key={index}
                                source={{ uri: postUrl }}
                                style={styles.postThumbnail}
                            />
                        ))}
                    </View>
                )}

                {/* Follow Button */}
                <Pressable
                    onPress={(e) => {
                        e.stopPropagation();
                        onFollow();
                    }}
                    style={styles.followButtonContainer}
                >
                    {creator.isFollowing ? (
                        <View style={styles.followingButton}>
                            <Ionicons name="checkmark" size={16} color={theme.colors.text.secondary} />
                            <Text style={styles.followingText}>Following</Text>
                        </View>
                    ) : (
                        <LinearGradient
                            colors={[theme.colors.primary.light, theme.colors.secondary.DEFAULT]}
                            style={styles.followGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="add" size={16} color="white" />
                            <Text style={styles.followText}>Follow</Text>
                        </LinearGradient>
                    )}
                </Pressable>
            </LinearGradient>
        </Pressable>
    );
};

const formatFollowers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
};

const styles = StyleSheet.create({
    container: {
        width: 180,
        marginRight: theme.spacing.md,
    },
    gradient: {
        borderRadius: 24,
        padding: theme.spacing.md,
        borderWidth: 1,
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
    },
    avatarContainer: {
        marginBottom: theme.spacing.sm,
    },
    avatarGradient: {
        width: 84,
        height: 84,
        borderRadius: 42,
        padding: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: theme.colors.surface.DEFAULT,
    },
    name: {
        fontSize: theme.typography.sizes.base,
        fontWeight: '700',
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: 2,
    },
    followers: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.text.muted,
        marginBottom: theme.spacing.sm,
    },
    bio: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: theme.spacing.sm,
    },
    postsPreview: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: theme.spacing.sm,
    },
    postThumbnail: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.surface.DEFAULT,
    },
    followButtonContainer: {
        width: '100%',
    },
    followGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
    },
    followText: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '700',
        color: 'white',
    },
    followingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.text.secondary,
        backgroundColor: 'transparent',
    },
    followingText: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '700',
        color: theme.colors.text.secondary,
    },
});
