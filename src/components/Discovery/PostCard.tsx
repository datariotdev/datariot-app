import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { encodeVideoUrl } from '@lib/utils/url';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme } from '../Theme/ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';

export type PostType = 'image' | 'video' | 'text';
export type PostLayout = 'full' | 'grid' | 'compact';

interface Post {
    id: string;
    type: PostType;
    authorName: string;
    authorAvatar: string;
    timestamp: string;
    content?: string;
    mediaUrl?: string;
    hashtags?: string[];
    likes: number;
    comments: number;
    isLiked: boolean;
}

interface PostCardProps {
    post: Post;
    layout?: PostLayout;
    onPress: () => void;
    onLike: () => void;
    onComment: () => void;
    onShare: () => void;
}

// Generate a deterministic color from a string (for the accent)
const getAccentColor = (str: string): string => {
    const colors = ['#FF3B6B', '#D9E4FF', '#D9E4FF', '#FF6B35', '#34C759', '#FF9500', '#D9E4FF'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

const PostCardVideo = ({ mediaUrl }: { mediaUrl: string }) => {
    const player = useVideoPlayer(encodeVideoUrl(mediaUrl), player => {
        player.muted = true;
        player.loop = false;
        player.pause();
    });

    return (
        <VideoView
            player={player}
            style={styles.media}
            contentFit="cover"
            nativeControls={false}
        />
    );
};

export const PostCard = ({
    post,
    layout = 'full',
    onPress,
    onLike,
    onComment,
    onShare
}: PostCardProps) => {
    const { mode } = useTheme();
    const isDark = mode === 'dark';
    const heartScale = useRef(new Animated.Value(1)).current;
    const accentColor = getAccentColor(post.authorName);

    const animateLike = () => {
        Animated.sequence([
            Animated.spring(heartScale, { toValue: 1.6, useNativeDriver: true, speed: 60, bounciness: 14 }),
            Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 8 }),
        ]).start();
    };

    const handleLike = () => { animateLike(); onLike(); };

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => { if (!post.isLiked) handleLike(); else animateLike(); });

    const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';

    return (
        <Pressable onPress={onPress} style={[styles.cardOuter, { backgroundColor: isDark ? '#0d0d0f' : '#fff' }]}>
            <View style={[styles.card, { backgroundColor: cardBg }]}>

                {/* Accent side bar + author header */}
                <View style={styles.headerRow}>
                    {/* Vertical glowing accent bar */}
                    <View style={styles.accentBarWrapper}>
                        <LinearGradient
                            colors={[accentColor, `${accentColor}33`]}
                            style={styles.accentBar}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                        />
                    </View>

                    {/* Right: author + content column */}
                    <View style={styles.bodyColumn}>
                        {/* Author row */}
                        <View style={styles.authorRow}>
                            <Image
                                source={{ uri: post.authorAvatar || `https://ui-avatars.com/api/?name=${post.authorName}&background=222&color=fff` }}
                                style={[styles.avatar, { borderColor: accentColor }]}
                            />
                            <View style={styles.authorMeta}>
                                <Text style={[styles.authorName, { color: isDark ? '#fff' : '#111' }]}>
                                    {post.authorName}
                                </Text>
                                <Text style={styles.timestamp}>{post.timestamp}</Text>
                            </View>

                            {/* Dot menu */}
                            <Pressable hitSlop={12} style={styles.dotMenu}>
                                <Ionicons name="ellipsis-horizontal" size={18} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
                            </Pressable>
                        </View>

                        {/* Content */}
                        {post.content ? (
                            <Text style={[styles.content, { color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' }]}>
                                {post.content}
                            </Text>
                        ) : null}

                        {/* Hashtags */}
                        {post.hashtags && post.hashtags.length > 0 && (
                            <View style={styles.hashtagRow}>
                                {post.hashtags.slice(0, 4).map((tag, i) => (
                                    <View key={i} style={[styles.hashtagPill, { borderColor: `${accentColor}60`, backgroundColor: `${accentColor}15` }]}>
                                        <Text style={[styles.hashtagText, { color: accentColor }]}>#{tag}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Media */}
                        {post.mediaUrl && (
                            <GestureDetector gesture={doubleTap}>
                                <View style={styles.mediaWrapper}>
                                    {post.type === 'video' ? (
                                        <PostCardVideo mediaUrl={post.mediaUrl} />
                                    ) : (
                                        <Image source={{ uri: post.mediaUrl }} style={styles.media} resizeMode="cover" />
                                    )}
                                    {post.type === 'video' && (
                                        <View style={styles.playOverlay}>
                                            <Ionicons name="play-circle" size={52} color="rgba(255,255,255,0.9)" />
                                        </View>
                                    )}
                                </View>
                            </GestureDetector>
                        )}

                        {/* Action bar — pill-style floating */}
                        <View style={styles.actionsRow}>
                            {/* Like pill */}
                            <Pressable onPress={handleLike} style={[
                                styles.actionPill,
                                {
                                    backgroundColor: post.isLiked
                                        ? 'rgba(255,59,107,0.15)'
                                        : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                                }
                            ]}>
                                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                                    <Text style={[
                                        styles.sparkle,
                                        post.isLiked && { color: '#D9E4FF' }
                                    ]}>✦</Text>
                                </Animated.View>
                                <Text style={[
                                    styles.pillText,
                                    { color: post.isLiked ? '#D9E4FF' : isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)' }
                                ]}>
                                    {formatNumber(post.likes)}
                                </Text>
                            </Pressable>

                            {/* Comment pill */}
                            <Pressable onPress={onComment} style={[
                                styles.actionPill,
                                { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }
                            ]}>
                                <Ionicons name="chatbubble-ellipses-outline" size={15} color={isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'} />
                                <Text style={[styles.pillText, { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)' }]}>
                                    {formatNumber(post.comments)}
                                </Text>
                            </Pressable>

                            {/* Share icon */}
                            <Pressable onPress={onShare} style={styles.shareBtn}>
                                <Ionicons name="paper-plane-outline" size={18} color={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'} />
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </Pressable>
    );
};

const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
};

const styles = StyleSheet.create({
    cardOuter: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 20,
        overflow: 'hidden',
    },
    card: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    headerRow: {
        flexDirection: 'row',
    },
    accentBarWrapper: {
        width: 4,
        alignSelf: 'stretch',
    },
    accentBar: {
        flex: 1,
        width: 4,
    },
    bodyColumn: {
        flex: 1,
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 10,
        gap: 10,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
    },
    authorMeta: {
        flex: 1,
        gap: 1,
    },
    authorName: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    timestamp: {
        fontSize: 12,
        color: 'rgba(150,150,160,0.8)',
    },
    dotMenu: {
        padding: 4,
    },
    content: {
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: 0.1,
    },
    hashtagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    hashtagPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    hashtagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    mediaWrapper: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        aspectRatio: 16 / 9,
        backgroundColor: '#111',
    },
    media: {
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 24,
    },
    pillText: {
        fontSize: 13,
        fontWeight: '600',
    },
    shareBtn: {
        marginLeft: 'auto',
        padding: 6,
    },
    sparkle: {
        fontSize: 18,
        color: 'rgba(150,150,160,0.8)',
        fontWeight: '700',
    },
});
