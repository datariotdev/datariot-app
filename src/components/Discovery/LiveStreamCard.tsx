import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@design-system/theme';

import { useTheme } from '../Theme/ThemeProvider';

interface LiveStream {
    id: string;
    title: string;
    thumbnailUrl: string;
    creatorName: string;
    creatorAvatar: string;
    viewers: number;
    category: string;
}

interface LiveStreamCardProps {
    stream: LiveStream;
    onPress: () => void;
}

export const LiveStreamCard = ({ stream, onPress }: LiveStreamCardProps) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const { mode } = useTheme();
    const isDark = mode === 'dark';

    useEffect(() => {
        // Pulsing animation for LIVE badge
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    return (
        <Pressable onPress={onPress} style={[styles.container, { borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <View style={styles.thumbnailContainer}>
                <Image
                    source={{ uri: stream.thumbnailUrl || 'https://via.placeholder.com/300x200' }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />

                {/* LIVE Badge with Pulse Animation */}
                <View style={styles.liveBadgeContainer}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <View style={styles.liveDot} />
                    </Animated.View>
                    <LinearGradient
                        colors={[theme.colors.error, '#FF0066']}
                        style={styles.liveBadge}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.liveText}>LIVE</Text>
                    </LinearGradient>
                </View>

                {/* Viewer Count */}
                <View style={styles.viewersBadge}>
                    <Ionicons name="eye" size={14} color="white" />
                    <Text style={styles.viewersText}>{formatViewers(stream.viewers)}</Text>
                </View>

                {/* Category Tag */}
                <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{stream.category}</Text>
                </View>

                {/* Gradient Overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.gradient}
                />
            </View>

            {/* Stream Info */}
            <View style={styles.infoContainer}>
                <View style={styles.creatorRow}>
                    <Image
                        source={{ uri: stream.creatorAvatar || 'https://via.placeholder.com/32' }}
                        style={styles.creatorAvatar}
                    />
                    <View style={styles.textContainer}>
                        <Text style={styles.title} numberOfLines={1}>{stream.title}</Text>
                        <Text style={styles.creatorName} numberOfLines={1}>{stream.creatorName}</Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );
};

const formatViewers = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
};

const styles = StyleSheet.create({
    container: {
        width: 280,
        marginRight: theme.spacing.md,
        backgroundColor: theme.colors.surface.light,
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        borderWidth: 1,
    },
    thumbnailContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: theme.colors.surface.DEFAULT,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
    },
    liveBadgeContainer: {
        position: 'absolute',
        top: theme.spacing.sm,
        left: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.error,
    },
    liveBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.sm,
    },
    liveText: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },
    viewersBadge: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
    },
    viewersText: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '700',
        color: 'white',
    },
    categoryTag: {
        position: 'absolute',
        bottom: theme.spacing.sm,
        left: theme.spacing.sm,
        backgroundColor: theme.colors.primary.light,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
    },
    categoryText: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: '700',
        color: 'white',
    },
    infoContainer: {
        padding: theme.spacing.md,
    },
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    creatorAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: theme.colors.primary.light,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    creatorName: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.text.muted,
    },
});
