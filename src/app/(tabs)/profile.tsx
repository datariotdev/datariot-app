import { MobileProfileHeader } from '../../components/Profile/MobileProfileHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions, StatusBar, Platform, ImageBackground, Alert, Image, Modal, ScrollView, Animated as RNAnimated, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { useVideos } from '@lib/supabase/hooks/useVideos';
import { usePosts, Post } from '@lib/supabase/hooks/usePosts';
import { supabase } from '@lib/supabase/client';
import { theme } from '@design-system/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { encodeVideoUrl } from '@lib/utils/url';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolation, withSpring, withTiming, SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { DebateCard } from '@components/Debate/DebateCard';
import { AmbientGlow } from '../../components/UI/AmbientGlow';

interface ProfileData {
    username: string;
    display_name: string;
    avatar_url: string | null;
    banner_url: string | null;
    bio: string | null;
    followers_count: number;
    following_count: number;
    videos_count: number;
    theses_count: number;
    arguments_count: number;
    created_at: string;
    total_impact_score: number;
    global_rank?: number | string;
    top_category?: string;
    activity_level?: string;
    win_rate?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
// Web layout constrains content to 600px width
const VIDEO_ITEM_WIDTH = isWeb ? (Math.min(SCREEN_WIDTH, 600) - 2) / 3 : (SCREEN_WIDTH - 2) / 3;
const HEADER_HEIGHT = 220;

const StickyHeader = ({ scrollY, user, handleSignOut, router }: { scrollY: SharedValue<number>, user: any, handleSignOut: () => void, router: any }) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const headerStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [200, 300], [0, 1], Extrapolation.CLAMP);
        return { opacity };
    });

    return (
        <View style={styles.stickyHeaderContainer}>
            <Animated.View style={[styles.stickyHeaderBackground, headerStyle, { backgroundColor: theme.colors.background.primary }]}>
                <LinearGradient
                    colors={isDark ? ['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.0)'] : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.0)']}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
            <SafeAreaView style={styles.stickyHeaderSafeArea}>
                <View style={styles.stickyHeaderContent}>
                    <Animated.Text style={[styles.stickyUsername, headerStyle, { color: theme.colors.text.primary }]}>
                        @{user?.email?.split('@')[0]}
                    </Animated.Text>
                    <View style={styles.stickyHeaderActions}>
                        <Pressable style={styles.iconButton} onPress={() => router.push('/settings')}>
                            <Ionicons name="reorder-two-outline" size={24} color={theme.colors.text.primary} />
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const ProfileHeader = ({ profile, user, scrollY, headerImageUrl, activeTab, setActiveTab, onShowAchievements }: any) => {
    const router = useRouter();

    const bannerStyle = useAnimatedStyle(() => {
        // When pulling down (scrollY < 0)
        if (scrollY.value < 0) {
            return {
                transform: [
                    { translateY: scrollY.value / 2 },
                    { scale: 1 - (scrollY.value / HEADER_HEIGHT) }
                ],
            };
        }

        // Normal scroll up parallax
        const translateY = interpolate(scrollY.value, [0, 200], [0, 40], Extrapolation.CLAMP);
        const scale = interpolate(scrollY.value, [0, 200], [1, 1.1], Extrapolation.CLAMP);
        return {
            transform: [{ translateY }, { scale }],
        };
    });

    const bannerOverlayStyle = useAnimatedStyle(() => ({
        opacity: scrollY.value < 0
            ? interpolate(scrollY.value, [-120, 0], [0.35, 0], Extrapolation.CLAMP)
            : 0,
    }));

    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <View>
            <View style={styles.headerContainer}>
                <Animated.View style={[StyleSheet.absoluteFill, bannerStyle, { backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
                    <ImageBackground
                        source={{ uri: headerImageUrl }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)' }]} />
                    {/* Pull-down brightness flash overlay */}
                    <Animated.View style={[StyleSheet.absoluteFill, bannerOverlayStyle, { backgroundColor: 'rgba(255,255,255,0.18)' }]} />
                </Animated.View>
            </View>

            {/* Content Below Banner */}
            <View style={styles.headerContent}>
                {/* Top Profile Section */}
                <View style={styles.profileTopSection}>
                    <View style={styles.avatarContainer}>

                        <View style={[styles.avatar, { overflow: 'hidden', borderColor: theme.colors.background.primary, backgroundColor: isDark ? '#000000' : '#FFFFFF' }]}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={StyleSheet.absoluteFill} />
                            ) : (
                                <Text style={[styles.avatarText, { color: theme.colors.text.primary }]}>
                                    {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0].toUpperCase() || 'U'}
                                </Text>
                            )}
                        </View>
                        {/* Status Dot */}
                        <View style={[styles.onlineDot, { borderColor: theme.colors.background.primary }]} />
                    </View>

                    <View style={styles.infoColumn}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.displayName, { color: theme.colors.text.primary }]}>
                                {profile?.display_name || user.email?.split('@')[0] || 'User'}
                            </Text>
                            <Pressable
                                style={styles.iconicEditBtn}
                                onPress={() => router.push('/edit-profile')}
                            >
                                <Ionicons name="create-outline" size={18} color={isDark ? theme.colors.primary.DEFAULT : theme.colors.text.primary} />
                            </Pressable>
                        </View>
                        <Text style={[styles.username, { color: theme.colors.text.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                            &gt; @{profile?.username || user.email?.split('@')[0]}
                        </Text>

                        {/* Stats Row */}
                        <View style={[
                            styles.compactStatsContainer,
                            {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
                                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                borderWidth: 1,
                            }
                        ]}>
                            <View style={styles.compactStatsRow}>
                                <View style={styles.compactStatItem}>
                                    <Text style={[styles.compactStatValue, { color: theme.colors.text.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>{profile?.followers_count || 0}</Text>
                                    <Text style={[styles.compactStatLabel, { color: theme.colors.text.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>FOLLOWERS</Text>
                                </View>
                                <View style={[styles.compactStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
                                <View style={styles.compactStatItem}>
                                    <Text style={[styles.compactStatValue, { color: theme.colors.text.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>{profile?.following_count || 0}</Text>
                                    <Text style={[styles.compactStatLabel, { color: theme.colors.text.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>FOLLOWING</Text>
                                </View>
                                <View style={[styles.compactStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} />
                                <View style={styles.compactStatItem}>
                                    <Text style={[styles.compactStatValue, { color: theme.colors.text.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>{profile?.arguments_count || 0}</Text>
                                    <Text style={[styles.compactStatLabel, { color: theme.colors.text.secondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>ARGUMENTS</Text>
                                </View>
                            </View>
                        </View>

                        {/* Creator DNA Button */}
                        <Pressable
                            onPress={onShowAchievements}
                            style={[styles.achievementsBtn, {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                borderWidth: 1,
                            }]}
                        >
                            <View style={styles.achievementsBtnLeft}>
                                <Ionicons name="finger-print" size={18} color={theme.colors.primary.DEFAULT} style={{ marginRight: 8 }} />
                                <Text style={[styles.achievementsBtnText, { color: theme.colors.text.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>[ CREATOR DNA ]</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.bioSection}>
                    <Text style={[styles.bioText, { color: theme.colors.text.secondary }]}>
                        {profile?.bio || 'passionate creator • sharing knowledge • learning every day'}
                    </Text>
                </View>
            </View>

            <View style={[styles.tabsWrapper, { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderWidth: 1 }]}>
                <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={styles.tabsBlur}>
                    <View style={styles.tabsContainer}>
                        {(['videos', 'posts', 'saved'] as const).map((tab) => {
                            const isActive = activeTab === tab;
                            return (
                                <Pressable
                                    key={tab}
                                    style={[
                                        styles.tabItem,
                                        isActive && {
                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                            borderColor: isDark ? 'rgba(0, 240, 255, 0.2)' : 'rgba(8, 145, 178, 0.2)',
                                            borderWidth: 1,
                                            borderRadius: 16,
                                            margin: 2,
                                        }
                                    ]}
                                    onPress={() => setActiveTab(tab)}
                                >
                                    {tab === 'videos' ? (
                                        <MaterialCommunityIcons
                                            name={isActive ? 'play-box-multiple' : 'play-box-multiple-outline'}
                                            size={20}
                                            color={isActive ? theme.colors.primary.DEFAULT : theme.colors.text.secondary}
                                        />
                                    ) : (
                                        <Ionicons
                                            name={
                                                isActive
                                                    ? (tab === 'posts' ? 'infinite' : 'library')
                                                    : (tab === 'posts' ? 'infinite-outline' : 'library-outline')
                                            }
                                            size={20}
                                            color={isActive ? theme.colors.primary.DEFAULT : theme.colors.text.secondary}
                                        />
                                    )}
                                    {isActive && (
                                        <Text style={[styles.activeTabText, { color: theme.colors.primary.DEFAULT, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                                            [ {tab === 'videos' ? 'ESSENCE' : tab === 'posts' ? 'THESES' : 'VAULT'} ]
                                        </Text>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </BlurView>
            </View>
        </View>
    );
};

const InternalProfileVideoGridItem = ({ videoUrl }: { videoUrl: string }) => {
    const player = useVideoPlayer(encodeVideoUrl(videoUrl), player => {
        player.muted = true;
        player.loop = false;
        player.pause();
    });

    return (
        <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
        />
    );
};

const ProfileVideoGridItem = ({ item, onPress, isDark, featured = false }: { item: any, onPress: () => void, isDark: boolean, featured?: boolean }) => {
    const scale = useSharedValue(1);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    const { width: currentWidth } = useWindowDimensions();
    const itemWidth = featured
        ? (isWeb ? Math.min(SCREEN_WIDTH, 600) - 2 : SCREEN_WIDTH - 2)
        : VIDEO_ITEM_WIDTH;
    const itemHeight = featured ? itemWidth * 0.56 : itemWidth * 1.3;

    // Stable random views count per item id
    const viewsCount = React.useMemo(() => {
        let hash = 0;
        for (let i = 0; i < (item.id || '').length; i++) hash = (hash * 31 + (item.id || '').charCodeAt(i)) & 0xffffffff;
        return Math.abs(hash % 9800) + 200;
    }, [item.id]);

    const formatViews = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;

    // Duration label: use item.duration if available, else a stable pseudo-random
    const durationLabel = React.useMemo(() => {
        if (item.duration) return item.duration;
        let hash = 0;
        const s = item.id || 'x';
        for (let i = 0; i < s.length; i++) hash = (hash * 17 + s.charCodeAt(i)) & 0xffffffff;
        const secs = 15 + Math.abs(hash) % 46;
        return `0:${secs < 10 ? '0' : ''}${secs}`;
    }, [item.id, item.duration]);

    return (
        <Pressable
            onPressIn={() => { scale.value = withTiming(0.96, { duration: 100 }); }}
            onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
            onPress={onPress}
            style={[{ width: itemWidth, height: itemHeight, marginBottom: 1 }, currentWidth <= 768 && !featured && { flex: 1, maxWidth: '33.333333%', width: undefined, height: undefined, aspectRatio: 1 / 1.3 }]}
        >
            <Animated.View style={[{ flex: 1, overflow: 'hidden', borderRadius: featured ? 0 : 0, backgroundColor: isDark ? '#000000' : '#EEEEEE' }, animStyle]}>
                {item.videoUrl ? (
                    <InternalProfileVideoGridItem videoUrl={item.videoUrl} />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="videocam-off" size={featured ? 32 : 24} color="rgba(255,255,255,0.1)" />
                    </View>
                )}
                {/* Bottom gradient overlay */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.72)']}
                    style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', padding: featured ? 14 : 6 }]}
                >
                    {featured && (
                        <View style={styles.featuredBadge}>
                            <Ionicons name="flame" size={11} color="#FFFFFF" />
                            <Text style={styles.featuredBadgeText}>FEATURED</Text>
                        </View>
                    )}
                    <View style={styles.videoItemBottom}>
                        <View style={styles.viewsOverlay}>
                            <Ionicons name="play" size={featured ? 13 : 10} color="white" />
                            <Text style={[styles.viewsText, featured && { fontSize: 13 }]}>{formatViews(viewsCount)}</Text>
                        </View>
                        <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>{durationLabel}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>
        </Pressable>
    );
};

// Renders videos in a 3-col grid with the first item being full-width featured
const EssenceGrid = ({ videos, onPress, isDark }: { videos: any[], onPress: (id: string, idx: number) => void, isDark: boolean }) => {
    if (!videos || videos.length === 0) return null;

    const [featured, ...rest] = videos;
    // Group rest into rows of 3
    const rows: any[][] = [];
    for (let i = 0; i < rest.length; i += 3) {
        rows.push(rest.slice(i, i + 3));
    }

    return (
        <View style={{ paddingTop: 12 }}>
            {/* Featured (first) video */}
            <ProfileVideoGridItem
                item={featured}
                onPress={() => onPress(featured.id, 0)}
                isDark={isDark}
                featured={true}
            />
            {/* Grid rows */}
            {rows.map((row, rowIdx) => (
                <View key={rowIdx} style={[styles.videoColumnWrapper]}>
                    {row.map((item, colIdx) => (
                        <ProfileVideoGridItem
                            key={item.id}
                            item={item}
                            onPress={() => onPress(item.id, rowIdx * 3 + colIdx + 1)}
                            isDark={isDark}
                        />
                    ))}
                    {/* Fill empty slots to keep alignment */}
                    {row.length < 3 && Array.from({ length: 3 - row.length }).map((_, i) => (
                        <View key={`empty-${i}`} style={{ width: VIDEO_ITEM_WIDTH, height: VIDEO_ITEM_WIDTH * 1.3 }} />
                    ))}
                </View>
            ))}
        </View>
    );
};

export default function ProfileScreen() {
    const { width: windowWidth } = useWindowDimensions();
    const mobile = windowWidth <= 768;
    const insets = useSafeAreaInsets();
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'saved'>('videos');
    const [showAchievements, setShowAchievements] = useState(false);
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const {
        videos,
        loading: loadingVideos,
    } = useVideos({ type: 'user', userId: user?.id });

    const {
        posts,
        loading: loadingPosts,
        refresh: refreshPosts,
        deletePost
    } = usePosts(user?.id);

    // ...

    const handleDeletePost = (postId: string) => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deletePost(postId);
                        } catch (e) {
                            Alert.alert("Error", "Could not delete post.");
                        }
                    }
                }
            ]
        );
    };

    // ...

    const renderPostItem = ({ item }: { item: Post }) => (
        <DebateCard
            item={item}
            onDelete={item.userId === user?.id ? () => handleDeletePost(item.id) : undefined}
            onPress={() => router.push(`/debate/${item.id}`)}
        />
    );

    const getProfileCoverImage = React.useCallback((userId: string) => {
        let sum = 0;
        for (let i = 0; i < userId.length; i++) {
            sum += userId.charCodeAt(i);
        }
        const seed = sum % 1000;
        // Use a much faster and reliable placeholder service for the banner
        return `https://picsum.photos/seed/${seed}/800/600`;
    }, []);

    const headerImageUrl = React.useMemo(() => {
        if (profile?.banner_url) return profile.banner_url;
        return getProfileCoverImage(user?.id || 'default');
    }, [user?.id, profile?.banner_url, getProfileCoverImage]);


    useFocusEffect(
        React.useCallback(() => {
            if (user) {
                fetchProfile();
            }
        }, [user])
    );

    const fetchProfile = async () => {
        if (!supabase || !user) {
            setLoadingProfile(false);
            return;
        }

        try {
            setLoadingProfile(true);
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            // Fetch counts
            const { count: videoCount } = await supabase
                .from('videos')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const { count: thesisCount } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            const { count: argumentCount } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            // Fetch Top Category based on user's videos
            let topCat = 'General';
            const { data: userVideos } = await supabase
                .from('videos')
                .select('category')
                .eq('user_id', user.id)
                .limit(50);

            if (userVideos && userVideos.length > 0) {
                const categoryCounts = userVideos.reduce((acc: any, val: any) => {
                    if (val.category) {
                        acc[val.category] = (acc[val.category] || 0) + 1;
                    }
                    return acc;
                }, {});
                const sortedCats = Object.entries(categoryCounts).sort((a: any, b: any) => b[1] - a[1]);
                if (sortedCats.length > 0) {
                    topCat = (sortedCats[0] as unknown as [string, number])[0];
                    topCat = topCat.charAt(0).toUpperCase() + topCat.slice(1); // Capitalize
                }
            }

            // Calculate Global Rank based on total_impact_score
            let globalRank: string | number = 'N/A';
            const impactScore = profileData?.total_impact_score || 0;
            const { count: rankCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .gt('total_impact_score', impactScore);

            if (rankCount !== null) {
                globalRank = `#${rankCount + 1}`;
            }

            // Compute Activity Level
            const totalActions = (videoCount || 0) + (thesisCount || 0) + (argumentCount || 0);
            let activityLevel = 'Low';
            if (totalActions > 50) activityLevel = 'High';
            else if (totalActions > 10) activityLevel = 'Medium';

            // Compute Win Rate / Approval Rate (Sum of likes on contributions)
            let approvalRate = '0%';
            try {
                const { data: commentLikes } = await supabase
                    .from('comments')
                    .select('likes_count')
                    .eq('user_id', user.id);

                const { data: postLikes } = await supabase
                    .from('posts')
                    .select('likes_count')
                    .eq('user_id', user.id);

                const totalLikes = (commentLikes?.reduce((sum: number, c: any) => sum + (c.likes_count || 0), 0) || 0) +
                    (postLikes?.reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0) || 0);

                if (totalActions > 0) {
                    // We call it "Approval Rate" but calculate it as a score normalized to 100 for gamification
                    approvalRate = Math.min(100, Math.floor((totalLikes / totalActions) * 100)) + '%';
                }
            } catch (e) {
                console.error('Error calculating approval rate:', e);
            }

            const [followers, following] = await Promise.all([
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
            ]);
            if (profileData) {
                setProfile({
                    ...profileData,
                    followers_count: followers.count ?? profileData.followers_count,
                    following_count: following.count ?? profileData.following_count,
                    videos_count: videoCount || 0,
                    theses_count: thesisCount || 0,
                    arguments_count: argumentCount || 0,
                    top_category: topCat,
                    global_rank: globalRank,
                    activity_level: activityLevel,
                    win_rate: approvalRate
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/auth/login');
    };

    if (!user) {
        return (
            <SafeAreaView>
                <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
                    <View style={styles.authPrompt}>
                        <Ionicons name="person-circle-outline" size={80} color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'} style={{ marginBottom: 16 }} />
                        <Text style={[styles.authTitle, { color: theme.colors.text.primary }]}>Welcome to Orvelis</Text>
                        <Text style={[styles.authSubtitle, { color: theme.colors.text.secondary }]}>
                            Sign in to create and save content
                        </Text>
                        <Pressable
                            onPress={() => router.push('/auth/login')}
                            style={styles.authSignInWrapper}
                        >
                            <LinearGradient
                                colors={['#D9E4FF', '#D9E4FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.authSignInGradient}
                            >
                                <Text style={styles.authSignInText}>Sign In</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        );
    }





    const navigateToVideo = (videoId: string, initialScrollIndex: number) => {
        router.push({
            pathname: '/video-player',
            params: {
                type: 'user',
                userId: user?.id,
                initialVideoId: videoId
            }
        });
    };

    const renderVideoItem = ({ item, index }: { item: any, index: number }) => (
        <ProfileVideoGridItem item={item} onPress={() => navigateToVideo(item.id, index)} isDark={isDark} />
    );

    const navigateToVideoById = (videoId: string, idx: number) => {
        router.push({
            pathname: '/video-player',
            params: { type: 'user', userId: user?.id, initialVideoId: videoId }
        });
    };



    const renderContent = () => {
        if (activeTab === 'videos') {
            if (loadingVideos && videos.length === 0) {
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={theme.colors.primary.DEFAULT} />
                    </View>
                );
            }
            if (!videos || videos.length === 0) {
                return (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>Share your first video</Text>
                        <Pressable style={[styles.createFirstButton, { backgroundColor: theme.colors.primary.DEFAULT }]} onPress={() => router.push('/create')}>
                            <Text style={styles.createFirstButtonText}>Create</Text>
                        </Pressable>
                    </View>
                );
            }
            // Render the custom essence grid
            return mobile ? null : <EssenceGrid videos={videos} onPress={navigateToVideoById} isDark={isDark} />;
        }

        if (activeTab === 'posts') {
            if (loadingPosts && posts.length === 0) {
                return (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color={theme.colors.primary.DEFAULT} />
                    </View>
                );
            }
            if (posts.length === 0) {
                return (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>No theses yet.</Text>
                        <Pressable style={[styles.createFirstButton, { backgroundColor: theme.colors.primary.DEFAULT }]} onPress={() => router.push('/create')}>
                            <Text style={styles.createFirstButtonText}>Propose a thesis</Text>
                        </Pressable>
                    </View>
                );
            }
            // For posts, we might want to render them here or use the FlatList?
            // Since FlatList is configured for NUM_COLUMNS=3 for videos, we cannot easily mix layout unless we change key/numColumns dynamically.
            // Best to use a separate list or conditional render in the main FlatList.
            // The main FlatList is the page body.
            return null;
        }

        // Default empty state (Saved)
        return (
            <View style={styles.emptyState}>
                <Ionicons
                    name="bookmark-outline"
                    size={48}
                    color={theme.colors.text.muted}
                />
                <Text style={[styles.emptyStateText, { color: theme.colors.text.secondary }]}>
                    No saved items
                </Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            {!mobile && <AmbientGlow color={isDark ? "rgba(217, 228, 255, 0.08)" : "rgba(217, 228, 255, 0.04)"} size={400} opacity={0.6} duration={25000} delay={0} />}
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* Sticky Header Overlay */}
            {!mobile && <StickyHeader scrollY={scrollY} user={user} handleSignOut={handleSignOut} router={router} />}

            <Animated.FlatList
                key={`${activeTab}-${mobile ? 'mobile' : 'desktop'}`}
                data={(activeTab === 'posts' ? posts : activeTab === 'videos' && mobile ? videos : []) as any}
                renderItem={(props: any) => activeTab === 'videos' ? renderVideoItem(props) : renderPostItem(props)}
                keyExtractor={(item) => item.id}
                numColumns={mobile && activeTab === 'videos' ? 3 : 1}
                columnWrapperStyle={mobile && activeTab === 'videos' ? styles.videoColumnWrapper : undefined}
                contentContainerStyle={[styles.flatListContent, { paddingBottom: 88 + insets.bottom }]}
                ListHeaderComponent={(
                    <>
                        {mobile ? <MobileProfileHeader profile={profile} userId={user.id} fallbackName={user.email?.split('@')[0]}
                            own activeTab={activeTab} onTab={setActiveTab} onEdit={() => router.push('/edit-profile')}
                            onSettings={() => router.push('/settings')} onDNA={() => setShowAchievements(true)} /> : <ProfileHeader
                            profile={profile}
                            user={user}
                            scrollY={scrollY}
                            headerImageUrl={headerImageUrl}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            onShowAchievements={() => setShowAchievements(true)}
                        />}
                        {renderContent()}
                    </>
                )}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={Platform.OS === 'android'}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={12}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                bounces={true}
                alwaysBounceVertical={true}
                overScrollMode="always"
                style={{ backgroundColor: 'transparent' }}
            />

            <Modal
                visible={showAchievements}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowAchievements(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowAchievements(false)}>
                    <Pressable style={[
                        styles.modalContent,
                        {
                            backgroundColor: isDark ? '#050508' : '#FAF9F6',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                            borderWidth: 1,
                        }
                    ]}>
                        {/* Handle */}
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Creator DNA</Text>
                                <Text style={[styles.modalSubtitle, { color: theme.colors.text.secondary }]}>Identity · Stats · History</Text>
                            </View>
                            <Pressable onPress={() => setShowAchievements(false)} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
                            </Pressable>
                        </View>

                        {/* DNA Core Stats */}
                        <View style={{ marginBottom: 24, marginTop: 16 }}>
                            <Text style={[styles.xpLevelLabel, { color: theme.colors.text.secondary, marginBottom: 4 }]}>MEMBER SINCE</Text>
                            <Text style={{ color: theme.colors.text.primary, fontSize: 20, fontWeight: '700' }}>
                                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Loading...'}
                            </Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 48, marginBottom: 32 }}>
                            {/* Total Impact (Replaces Location) */}
                            <View>
                                <Text style={[styles.xpLevelLabel, { color: theme.colors.text.secondary, marginBottom: 4 }]}>TOTAL IMPACT</Text>
                                <Text style={{ color: theme.colors.text.primary, fontSize: 16, fontWeight: '600' }}>{profile?.total_impact_score || 0}</Text>
                            </View>

                            {/* Favorite Category */}
                            <View>
                                <Text style={[styles.xpLevelLabel, { color: theme.colors.text.secondary, marginBottom: 4 }]}>TOP INTEREST</Text>
                                <Text style={{ color: theme.colors.text.primary, fontSize: 16, fontWeight: '600' }}>{profile?.top_category || 'General'}</Text>
                            </View>
                        </View>

                        {/* Engagement score */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                            <View>
                                <Text style={[styles.xpLevelLabel, { color: theme.colors.text.secondary, marginBottom: 4 }]}>GLOBAL RANK</Text>
                                <Text style={{ color: theme.colors.text.primary, fontSize: 18, fontWeight: '700' }}>{profile?.global_rank || 'N/A'}</Text>
                            </View>
                            <View>
                                <Text style={[styles.xpLevelLabel, { color: theme.colors.text.secondary, marginBottom: 4 }]}>ACTIVITY</Text>
                                <Text style={{ color: theme.colors.text.primary, fontSize: 18, fontWeight: '700' }}>{profile?.activity_level || 'Low'}</Text>
                            </View>
                            <View>
                                <Text style={[styles.xpLevelLabel, { color: theme.colors.text.secondary, marginBottom: 4 }]}>APPROVAL RATE</Text>
                                <Text style={{ color: theme.colors.text.primary, fontSize: 18, fontWeight: '700' }}>{profile?.win_rate || 'N/A'}</Text>
                            </View>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Sticky Header
    stickyHeaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        borderBottomWidth: 0, // Explicitly 0
        elevation: 0, // No shadow
        shadowOpacity: 0,
    },
    stickyHeaderSafeArea: {
        backgroundColor: 'transparent',
    },
    stickyHeaderContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 10,
        height: 50,
    },
    stickyHeaderActions: {
        flexDirection: 'row',
        gap: 16,
    },
    stickyHeaderBackground: {
        ...StyleSheet.absoluteFillObject,
        borderBottomWidth: 1,
    },
    stickyUsername: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        opacity: 0, // Default hidden
    },
    iconButton: {
        padding: 4,
    },

    // Main Content
    flatListContent: {
        paddingTop: 0, // Content starts at top for seamless header
        paddingBottom: 80,
    },
    headerContainer: {
        height: HEADER_HEIGHT,
        zIndex: 1,
    },
    headerContent: {
        paddingBottom: theme.spacing.md,
        zIndex: 2,
        backgroundColor: 'transparent',
    },

    // Profile Top Section
    profileTopSection: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xs,
        marginTop: -60, // Overlap the larger banner
        paddingTop: 0,
    },
    avatarContainer: {
        marginBottom: 8,
        position: 'relative',
    },
    avatar: {
        width: 84,
        height: 84,
        borderRadius: 42,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#D9E4FF',
        borderWidth: 2,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    achievementsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginTop: 12,
        marginBottom: 8,
        width: '90%',
        alignSelf: 'center',
    },
    achievementsBtnLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    achievementsBtnText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    },
    modalHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    modalSubtitle: {
        fontSize: 12,
        marginTop: 2,
        opacity: 0.6,
        letterSpacing: 0.3,
    },
    modalCloseBtn: {
        padding: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
    },
    // XP Card
    xpCard: {
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
    },
    xpCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    xpLevelLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
        letterSpacing: 1.5,
    },
    xpLevelNum: {
        fontSize: 40,
        fontWeight: '900',
        color: '#FFFFFF',
        lineHeight: 44,
        letterSpacing: -1,
    },
    xpTitleBox: {
        alignItems: 'flex-end',
    },
    xpTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.3,
    },
    xpTitleSub: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.55)',
        marginTop: 2,
    },
    xpBarBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    xpBarFill: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 3,
    },
    xpBarLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    xpCurrent: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
    },
    xpMax: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
    },
    // Achievement Cards
    achRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    achCard: {
        flex: 1,
        borderRadius: 18,
        padding: 14,
        alignItems: 'flex-start',
    },
    achIconRing: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    achCardTitle: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    achCardSub: {
        fontSize: 12,
        marginBottom: 10,
    },
    achBadgePill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    achBadgePillText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    // Reputation Score Row
    repScoreRow: {
        flexDirection: 'row',
        borderRadius: 18,
        borderWidth: 1,
        overflow: 'hidden',
    },
    repScoreItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
    },
    repScoreNum: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    repScoreLabel: {
        fontSize: 11,
        marginTop: 2,
        opacity: 0.6,
    },
    repScoreDivider: {
        width: 1,
        marginVertical: 10,
    },
    infoColumn: {
        alignItems: 'center',
        width: '100%',
    },
    nameRow: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    displayName: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 2,
        textAlign: 'center',
        maxWidth: '70%',
    },
    iconicEditBtn: {
        position: 'absolute',
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    username: {
        fontSize: 14,
        marginBottom: 10,
        opacity: 0.7,
    },

    // Bio
    bioSection: {
        paddingHorizontal: theme.spacing.lg,
        marginTop: 4,
        alignItems: 'center',
    },
    bioText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 20,
        marginBottom: 14,
        textAlign: 'center',
    },
    promoteBtn: {
        borderRadius: 14,
        overflow: 'hidden',
        alignSelf: 'flex-start',
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
        elevation: 8,
    },
    promoteBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: 14,
    },
    promoteBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.2,
    },


    // Compact Stats
    compactStatsContainer: {
        marginTop: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'center',
    },
    compactStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    compactStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 0,
    },
    compactStatValue: {
        fontSize: 15,
        fontWeight: '800',
        marginRight: 4,
    },
    compactStatLabel: {
        fontSize: 10,
        fontWeight: '500',
        letterSpacing: 0.2,
        opacity: 0.6,
    },
    compactStatDivider: {
        width: 1,
        height: 12,
        marginRight: 12,
    },

    // Tabs
    tabsWrapper: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 20,
        overflow: 'hidden',
    },
    tabsBlur: {
        padding: 4,
    },
    tabsContainer: {
        flexDirection: 'row',
        position: 'relative',
        height: 48,
        alignItems: 'center',
    },
    tabItem: {
        flex: 1,
        height: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        zIndex: 2,
    },

    tabIndicator: {
        position: 'absolute',
        height: 40, // Height of the sliding pill
        backgroundColor: '#D9E4FF',
        borderRadius: 20,
        zIndex: 1,
    },
    activeTabText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    // Grid
    videoColumnWrapper: {
        flexDirection: 'row',
        gap: 1,
    },
    videoGridItem: {
        width: VIDEO_ITEM_WIDTH,
        height: VIDEO_ITEM_WIDTH * 1.3,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 1,
    },
    videoThumbnail: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    videoItemBottom: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    viewsOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    viewsText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    durationBadge: {
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 4,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    durationText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    featuredBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignSelf: 'flex-start',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    featuredBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },

    // Empty & Loading
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        color: theme.colors.text.secondary,
        fontSize: 16,
        marginBottom: 16,
    },
    createFirstButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: theme.colors.primary.DEFAULT,
        borderRadius: 8,
    },
    createFirstButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    authPrompt: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    authTitle: {
        fontSize: theme.typography.sizes['3xl'],
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    authSubtitle: {
        fontSize: theme.typography.sizes.base,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    authSignInWrapper: {
        width: '100%',
        maxWidth: 300,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
        elevation: 12,
    },
    authSignInGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
        backgroundColor: '#D9E4FF',
    },
    authSignInText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },

    // Post Item
    // Post Item
    postItem: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginBottom: 20,
        borderRadius: 24,
        marginHorizontal: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        // Shadow for depth
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        paddingBottom: 8,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    postBody: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    postFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start', // Left aligned
        gap: 24, // Consistent spacing
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 8,
        // No background, clean look
    },
    postAuthor: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
        marginBottom: 2,
    },
    postDate: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontWeight: '500',
    },
    authorInfo: {
        marginLeft: 12,
        justifyContent: 'center'
    },
    postContent: {
        color: 'rgba(255,255,255,0.95)',
        fontSize: 15,
        lineHeight: 22,
        letterSpacing: 0.2,
    },
    postAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
    },
    postAvatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: 0.8,
    },
    actionText: {
        color: theme.colors.text.secondary,
        fontSize: 13,
        fontWeight: '600',
    },
    optionsButton: {
        padding: 8,
        borderRadius: 20,
    },
});
