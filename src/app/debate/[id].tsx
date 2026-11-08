import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { supabase } from '@lib/supabase/client';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DebateCard } from '@components/Debate/DebateCard';
import { Post } from '@lib/supabase/hooks/usePosts';
import { useDebateArguments, Argument } from '@lib/supabase/hooks/useDebateArguments';
import { Ionicons } from '@expo/vector-icons';

const VoteButton = ({ isVoted, score, onPress }: { isVoted: boolean; score: number; onPress: () => void }) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const scale = useSharedValue(1);

    const handlePress = () => {
        scale.value = withSequence(
            withTiming(1.2, { duration: 100 }),
            withSpring(1)
        );
        onPress();
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    return (
        <Pressable
            style={[styles.voteButton, isVoted && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            onPress={handlePress}
        >
            <Animated.View style={[styles.voteIconContainer, animatedStyle]}>
                <Ionicons name={isVoted ? "bulb" : "bulb-outline"} size={16} color={isVoted ? "#D9E4FF" : theme.colors.text.secondary} />
            </Animated.View>
            <Text style={[styles.voteText, { color: isVoted ? "#D9E4FF" : theme.colors.text.secondary }]}>
                {score} Reputation
            </Text>
        </Pressable>
    );
};

export default function DebateThreadScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const insets = useSafeAreaInsets();

    const [post, setPost] = useState<Post | null>(null);
    const [loadingPost, setLoadingPost] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const { argumentsList, loading, posting, fetchArguments, postArgument, toggleVoteArgument, deleteArgument } = useDebateArguments(id as string);

    const [newArgument, setNewArgument] = useState('');
    const [selectedSide, setSelectedSide] = useState<'FOR' | 'AGAINST' | null>(null);
    const [replyingTo, setReplyingTo] = useState<Argument | null>(null);

    // Like thesis
    const handleLikePost = async () => {
        if (!user || !post) return;
        const wasLiked = post.isLiked;
        setPost({ ...post, isLiked: !wasLiked, likes: wasLiked ? post.likes - 1 : post.likes + 1 });
        try {
            if (wasLiked) {
                await supabase.from('post_likes').delete().eq('user_id', user.id).eq('post_id', post.id);
            } else {
                await supabase.from('post_likes').insert({ user_id: user.id, post_id: post.id });
            }
        } catch {
            setPost({ ...post }); // revert
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            if (id) {
                fetchPost();
                fetchArguments();
            }
        }, [id, fetchArguments])
    );

    const fetchPost = async () => {
        setLoadingPost(true);
        try {
            const { data: p, error } = await supabase
                .from('posts')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (p) {
                let profile: any = {};
                if (p.user_id) {
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('id, username, display_name, avatar_url')
                        .eq('id', p.user_id)
                        .single();
                    if (profileData) profile = profileData;
                }


                let likes = p.likes_count || 0;
                let isLiked = false;
                if (user) {
                    const { data: l } = await supabase.from('post_likes').select('id').eq('user_id', user.id).eq('post_id', id);
                    if (l && l.length > 0) isLiked = true;
                }

                setPost({
                    id: p.id,
                    userId: p.user_id,
                    authorName: profile.display_name ||
                        profile.username ||
                        (user?.id === p.user_id ? (user?.user_metadata?.display_name || user?.user_metadata?.username || user?.email?.split('@')[0]) : 'User'),
                    authorAvatar: profile.avatar_url,
                    content: p.content,
                    likes,
                    comments: p.comments_count || 0,
                    isLiked,
                    createdAt: p.created_at,
                    timestamp: '' // Not strict needed here
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingPost(false);
        }
    };

    const handlePostArgument = async () => {
        if (!selectedSide || !newArgument.trim()) return;
        await postArgument(newArgument, selectedSide);
        setNewArgument('');
        setSelectedSide(null);
        setReplyingTo(null);
    };

    const handleReply = (arg: Argument) => {
        setReplyingTo(arg);
        setSelectedSide(arg.side === 'FOR' ? 'AGAINST' : 'FOR'); // Default to opposing side
    };

    const handleDeletePost = async () => {
        if (!post) return;
        setDeleting(true);
        try {
            const { error } = await supabase.from('posts').delete().eq('id', post.id);
            if (error) throw error;
            router.back();
        } catch (err) {
            console.error(err);
        } finally {
            setDeleting(false);
        }
    };

    const confirmDeletePost = () => {
        Alert.alert(
            "Delete Thesis",
            "Are you sure you want to delete this debate thread? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: handleDeletePost }
            ]
        );
    };

    const stats = useMemo(() => {
        let forCount = 0;
        let againstCount = 0;
        let forScore = 0;
        let againstScore = 0;

        argumentsList.forEach(arg => {
            if (arg.side === 'FOR') {
                forCount++;
                forScore += arg.strength;
            } else if (arg.side === 'AGAINST') {
                againstCount++;
                againstScore += arg.strength;
            }
        });

        const totalScore = forScore + againstScore;
        const forPercentage = totalScore > 0 ? (forScore / totalScore) * 100 : 50;

        return { forCount, againstCount, forScore, againstScore, forPercentage };
    }, [argumentsList]);

    const forPercentageAnim = useSharedValue(50);
    useEffect(() => {
        forPercentageAnim.value = withSpring(stats.forPercentage, { damping: 15 });
    }, [stats.forPercentage]);

    const forStyle = useAnimatedStyle(() => ({
        width: `${forPercentageAnim.value}%`
    }));

    const againstStyle = useAnimatedStyle(() => ({
        width: `${100 - forPercentageAnim.value}%`
    }));

    const renderArgument = ({ item }: { item: Argument }) => {
        const isFor = item.side === 'FOR';
        const colorMain = isFor ? "#D9E4FF" : "#FFFFFF";
        const bgLabel = isFor ? 'rgba(217, 228, 255, 0.15)' : 'rgba(255, 255, 255, 0.15)';

        return (
            <View style={[styles.argumentCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFF' }]}>
                {/* Left Line Indicator */}
                <View style={[styles.sideIndicator, { backgroundColor: colorMain }]} />

                <View style={styles.argumentContent}>
                    <View style={styles.argHeader}>
                        <View style={styles.argAuthorRow}>
                            {item.authorAvatar ? (
                                <Image source={{ uri: item.authorAvatar }} style={styles.argAvatarImage} />
                            ) : (
                                <View style={[styles.argAvatar, { backgroundColor: isDark ? '#333' : '#E5E5E5' }]}>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.colors.text.primary }}>{item.authorName[0].toUpperCase()}</Text>
                                </View>
                            )}
                            <Text style={[styles.argAuthorName, { color: theme.colors.text.primary }]}>{item.authorName}</Text>
                            <View style={[styles.sideBadge, { backgroundColor: bgLabel }]}>
                                <Text style={[styles.sideBadgeText, { color: colorMain }]}>{item.side}</Text>
                            </View>
                        </View>

                        <View style={styles.argHeaderRight}>
                            <Text style={styles.argDate}>{item.timestamp}</Text>
                            {user && item.authorId === user.id && (
                                <Pressable
                                    onPress={() => {
                                        Alert.alert("Delete Argument", "Are you sure you want to delete your argument?", [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Delete", style: "destructive", onPress: () => deleteArgument(item.id) }
                                        ]);
                                    }}
                                    style={({ pressed }) => [styles.argDeleteBtn, pressed && { opacity: 0.6 }]}
                                >
                                    <Ionicons name="trash-bin-outline" size={16} color="#EF4444" />
                                </Pressable>
                            )}
                        </View>
                    </View>

                    <Text style={[styles.argText, { color: theme.colors.text.primary }]}>{item.content}</Text>

                    {item.videoUrl && (
                        <View style={styles.argVideoContainer}>
                            <Image
                                source={{ uri: item.videoUrl.replace('.mp4', '.jpg') }}
                                style={styles.argVideoThumbnail}
                            />
                            <View style={styles.playOverlay}>
                                <Ionicons name="play" size={24} color="#FFF" />
                            </View>
                        </View>
                    )}

                    <View style={styles.argFooter}>
                        <VoteButton
                            isVoted={item.isVoted}
                            score={item.strength}
                            onPress={() => toggleVoteArgument(item.id)}
                        />
                        <Pressable style={styles.replyBtn} onPress={() => handleReply(item)}>
                            <Ionicons name="chatbubble-outline" size={14} color={theme.colors.text.secondary} />
                            <Text style={[styles.replyBtnText, { color: theme.colors.text.secondary }]}>Reply</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.colors.background.primary }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Debate Thread</Text>
                {post && (
                    <Pressable onPress={handleLikePost} style={styles.headerLikeBtn}>
                        <Text style={{ fontSize: 18, color: post.isLiked ? "#D9E4FF" : theme.colors.text.secondary }}>✦</Text>
                        <Text style={[styles.headerLikeCount, { color: post.isLiked ? "#D9E4FF" : theme.colors.text.secondary }]}>{post.likes}</Text>
                    </Pressable>
                )}
                {!post && <View style={{ width: 40 }} />}
            </View>

            <FlatList
                data={argumentsList}
                keyExtractor={item => item.id}
                renderItem={renderArgument}
                contentContainerStyle={[styles.listContent, { paddingBottom: 140 }]}
                ListHeaderComponent={() => (
                    <View style={styles.listHeader}>
                        {loadingPost ? (
                            <ActivityIndicator color="#D9E4FF" />
                        ) : post ? (
                            <View>
                                <DebateCard
                                    item={post}
                                    isOwnPost={post.userId === user?.id}
                                    onDelete={post.userId === user?.id ? confirmDeletePost : undefined}
                                />
                                {deleting && <ActivityIndicator color="#EF4444" style={{ marginTop: 8 }} />}

                                {/* Stats Bar */}
                                {argumentsList.length > 0 && (
                                    <View style={[styles.statsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFF' }]}>
                                        <Text style={[styles.statsTitle, { color: theme.colors.text.primary }]}>Logic Balance</Text>

                                        <View style={styles.statsBarRow}>
                                            <Text style={[styles.statsCount, { color: '#D9E4FF', width: 40 }]}>{stats.forScore}</Text>

                                            <View style={styles.progressBarContainer}>
                                                <Animated.View style={[styles.progressBarFillFor, forStyle]} />
                                                <Animated.View style={[styles.progressBarFillAgainst, againstStyle]} />
                                            </View>

                                            <Text style={[styles.statsCount, { color: '#FFFFFF', textAlign: 'right', width: 40 }]}>{stats.againstScore}</Text>
                                        </View>

                                        <View style={styles.statsLabelRow}>
                                            <Text style={[styles.statsLabel, { color: theme.colors.text.secondary }]}>FOR ({stats.forCount})</Text>
                                            <Text style={[styles.statsLabel, { color: theme.colors.text.secondary }]}>AGAINST ({stats.againstCount})</Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <Text style={[styles.errorText, { color: theme.colors.text.secondary }]}>Thesis not found.</Text>
                        )}
                        <View style={styles.sectionTitleRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Arguments</Text>
                                <View style={[styles.argCountBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                    <Text style={[styles.argCountText, { color: theme.colors.text.secondary }]}>{argumentsList.length}</Text>
                                </View>
                            </View>
                            <Text style={styles.sortText}>BY STRENGTH</Text>
                        </View>
                    </View>
                )}
                ListEmptyComponent={() => (
                    !loading && <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>No arguments yet. Be the first to logic test this.</Text>
                )}
            />

            {/* Input Bar */}
            <View style={[
                styles.inputWrapper,
                { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
            ]}>
                <BlurView
                    intensity={Platform.OS === 'ios' ? 80 : 100}
                    tint={isDark ? 'dark' : 'light'}
                    style={[
                        styles.inputContainer,
                        {
                            paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 16 + insets.bottom
                        }
                    ]}
                >
                    {selectedSide === null ? (
                        <View style={styles.sideSelector}>
                            <Text style={[styles.promptText, { color: theme.colors.text.primary }]}>Take a stance:</Text>
                            <View style={styles.stanceButtons}>
                                <Pressable style={[styles.stanceBtn, { backgroundColor: 'rgba(217, 228, 255, 0.15)' }]} onPress={() => setSelectedSide('FOR')}>
                                    <Text style={[styles.stanceBtnText, { color: '#D9E4FF' }]}>Argue FOR</Text>
                                </Pressable>
                                <Pressable style={[styles.stanceBtn, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]} onPress={() => setSelectedSide('AGAINST')}>
                                    <Text style={[styles.stanceBtnText, { color: '#FFFFFF' }]}>Argue AGAINST</Text>
                                </Pressable>
                            </View>

                            <View style={styles.videoResponseRow}>
                                <Pressable
                                    style={styles.videoResponseBtn}
                                    onPress={() => router.push({
                                        pathname: '/(tabs)/create',
                                        params: { debateId: id, side: 'FOR' }
                                    })}
                                >
                                    <Ionicons name="videocam" size={16} color="#D9E4FF" />
                                    <Text style={[styles.videoResponseBtnText, { color: '#D9E4FF' }]}>Video FOR</Text>
                                </Pressable>
                                <Pressable
                                    style={styles.videoResponseBtn}
                                    onPress={() => router.push({
                                        pathname: '/(tabs)/create',
                                        params: { debateId: id, side: 'AGAINST' }
                                    })}
                                >
                                    <Ionicons name="videocam" size={16} color="#FFFFFF" />
                                    <Text style={[styles.videoResponseBtnText, { color: '#FFFFFF' }]}>Video AGAINST</Text>
                                </Pressable>
                            </View>
                        </View>
                    ) : (
                        <View>
                            {replyingTo && (
                                <View style={[styles.replyingBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}>
                                    <Text style={[styles.replyingText, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                                        Replying to <Text style={{ fontWeight: '700' }}>{replyingTo.authorName}</Text>: {replyingTo.content}
                                    </Text>
                                    <Pressable onPress={() => { setReplyingTo(null); setSelectedSide(null); }}>
                                        <Ionicons name="close" size={18} color={theme.colors.text.muted} />
                                    </Pressable>
                                </View>
                            )}
                            <View style={styles.typeRow}>
                                <View style={[
                                    styles.sideBadgeInput,
                                    { backgroundColor: selectedSide === 'FOR' ? 'rgba(217, 228, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)' }
                                ]}>
                                    <Text style={[
                                        styles.sideBadgeText,
                                        { color: selectedSide === 'FOR' ? '#000000' : '#FFFFFF' }
                                    ]}>{selectedSide}</Text>
                                </View>

                                <TextInput
                                    style={[styles.textInput, { color: theme.colors.text.primary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5F5F5' }]}
                                    placeholder="Write your logical argument..."
                                    placeholderTextColor={theme.colors.text.muted}
                                    value={newArgument}
                                    onChangeText={setNewArgument}
                                    multiline
                                    maxLength={500}
                                />

                                <Pressable
                                    style={[styles.sendButton, (!newArgument.trim() || posting) && { opacity: 0.5 }]}
                                    onPress={handlePostArgument}
                                    disabled={!newArgument.trim() || posting}
                                >
                                    {posting ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
                                </Pressable>

                                <Pressable style={styles.cancelSideBtn} onPress={() => { setSelectedSide(null); setReplyingTo(null); }}>
                                    <Ionicons name="close-circle" size={24} color={theme.colors.text.muted} />
                                </Pressable>
                            </View>
                        </View>
                    )}
                </BlurView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    videoResponseRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    videoResponseBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    videoResponseBtnText: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    argVideoContainer: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        backgroundColor: '#000',
    },
    argVideoThumbnail: {
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    headerLikeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    headerLikeCount: {
        fontSize: 14,
        fontWeight: '700',
    },
    listContent: {},
    listHeader: { paddingVertical: 16 },
    errorText: { textAlign: 'center', marginVertical: 20 },

    sectionTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 24,
        marginTop: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    sortText: {
        fontSize: 12,
        color: '#D9E4FF',
        fontWeight: 'bold',
    },
    argCountBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    argCountText: {
        fontSize: 12,
        fontWeight: '700',
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 40,
        fontSize: 14,
    },

    // Argument Cards
    argumentCard: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(128,128,128,0.1)'
    },
    sideIndicator: {
        width: 4,
    },
    argumentContent: {
        flex: 1,
        padding: 12,
    },
    argHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    argAuthorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    argAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    argAvatarImage: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    argAuthorName: {
        fontWeight: '600',
        fontSize: 14,
    },
    sideBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    sideBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    argDate: {
        fontSize: 12,
        color: 'gray',
    },
    argHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    argDeleteBtn: {
        padding: 4,
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderRadius: 12,
    },
    argText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 12,
    },
    argFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: 12,
    },
    replyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    replyBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    voteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    voteIconContainer: {
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    voteText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Input Bar 
    inputWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        overflow: 'hidden',
    },
    inputContainer: {
        padding: 16,
    },
    sideSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    promptText: {
        fontSize: 14,
        fontWeight: '600',
    },
    stanceButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    stanceBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    stanceBtnText: {
        fontWeight: 'bold',
        fontSize: 13,
    },
    typeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sideBadgeInput: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 6,
    },
    textInput: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 10,
        fontSize: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#D9E4FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelSideBtn: {
        padding: 4,
    },
    replyingBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 8,
        gap: 8,
    },
    replyingText: {
        fontSize: 13,
        flex: 1,
    },

    // Stats
    statsContainer: {
        marginHorizontal: 16,
        marginTop: 8,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(128,128,128,0.1)'
    },
    statsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    statsBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    progressBarContainer: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    progressBarFillFor: {
        backgroundColor: '#D9E4FF',
        height: '100%',
    },
    progressBarFillAgainst: {
        backgroundColor: '#FFFFFF',
        height: '100%',
    },
    statsCount: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    statsLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 52, // Align with edges of progress bar roughly
    },
    statsLabel: {
        fontSize: 10,
        fontWeight: '600',
    }
});
