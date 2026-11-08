import { MobileProfileHeader } from '../../components/Profile/MobileProfileHeader';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Dimensions, StatusBar, Platform, ImageBackground, Alert, useWindowDimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { useVideos } from '@lib/supabase/hooks/useVideos';
import { usePosts, Post } from '@lib/supabase/hooks/usePosts';
import { supabase } from '@lib/supabase/client';
import { theme } from '@design-system/theme';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { encodeVideoUrl } from '@lib/utils/url';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolation, SharedValue } from 'react-native-reanimated';

interface ProfileData {
    username: string;
    display_name: string;
    avatar_url: string | null;
    banner_url: string | null;
    bio: string | null;
    followers_count: number;
    following_count: number;
    videos_count: number;
}

const { width } = Dimensions.get('window');
const VIDEO_ITEM_WIDTH = (width - 2) / 3;
const HEADER_HEIGHT = 350;

const StickyHeader = ({ scrollY, user }: { scrollY: SharedValue<number>, user: any }) => {
    const router = useRouter();
    const headerStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [200, 300], [0, 1], Extrapolation.CLAMP);
        return { opacity };
    });

    return (
        <View style={styles.stickyHeaderContainer}>
            <Animated.View style={[styles.stickyHeaderBackground, headerStyle]}>
                <LinearGradient
                    colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.0)']}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
            <SafeAreaView style={styles.stickyHeaderSafeArea}>
                <View style={styles.stickyHeaderContent}>
                    <Pressable style={styles.iconButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </Pressable>
                    <Animated.Text style={[styles.stickyUsername, headerStyle]}>
                        @{user?.username || user?.email?.split('@')[0]}
                    </Animated.Text>
                    <View style={styles.stickyHeaderActions}>
                        <Pressable style={styles.iconButton} onPress={() => { }}>
                            <Ionicons name="ellipsis-horizontal" size={24} color="white" />
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const ProfileHeader = ({ profile, user, scrollY, headerImageUrl, activeTab, setActiveTab, isFollowing, onFollow, onMessage }: any) => {

    const bannerStyle = useAnimatedStyle(() => {
        const scale = interpolate(scrollY.value, [-100, 0], [1.2, 1], Extrapolation.CLAMP);
        const translateY = interpolate(scrollY.value, [-100, 0], [-50, 0], Extrapolation.CLAMP);
        return {
            transform: [{ scale }, { translateY }],
        };
    });

    return (
        <View>
            <View style={styles.headerContainer}>
                <Animated.View style={[StyleSheet.absoluteFill, bannerStyle]}>
                    <ImageBackground
                        source={{ uri: headerImageUrl }}
                        style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)', theme.colors.background.primary]}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>

                {/* Content Overlay */}
                <View style={styles.headerContent}>
                    {/* Top Profile Section */}
                    <View style={styles.profileTopSection}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                {profile?.avatar_url ? (
                                    <ImageBackground source={{ uri: profile.avatar_url }} style={{ width: 80, height: 80, borderRadius: 40 }} resizeMode="cover" />
                                ) : (
                                    <Text style={styles.avatarText}>
                                        {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.infoColumn}>
                            <Text style={styles.displayName}>
                                {profile?.display_name || user?.email?.split('@')[0] || 'User'}
                            </Text>
                            <Text style={styles.username}>
                                @{profile?.username || user?.email?.split('@')[0]}
                            </Text>

                            <View style={styles.compactStatsRow}>
                                <View style={styles.compactStatItem}>
                                    <Text style={styles.compactStatValue}>{profile?.followers_count || 0}</Text>
                                    <Text style={styles.compactStatLabel}>Followers</Text>
                                </View>
                                <View style={styles.compactStatDivider} />
                                <View style={styles.compactStatItem}>
                                    <Text style={styles.compactStatValue}>{profile?.following_count || 0}</Text>
                                    <Text style={styles.compactStatLabel}>Following</Text>
                                </View>
                                <View style={styles.compactStatDivider} />
                                <View style={styles.compactStatItem}>
                                    <Text style={styles.compactStatValue}>{profile?.videos_count || 0}</Text>
                                    <Text style={styles.compactStatLabel}>Videos</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsRow}>
                        <Pressable
                            style={[styles.actionButtonWrapper, { flex: 1 }]}
                            onPress={onFollow}
                        >
                            {isFollowing ? (
                                <View style={[styles.modernButton, styles.followingButton]}>
                                    <Text style={styles.followingButtonText}>Following</Text>
                                </View>
                            ) : (
                                <LinearGradient
                                    colors={[theme.colors.primary.DEFAULT, theme.colors.primary.DEFAULT]} // Strict 3-color palette
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.modernButton}
                                >
                                    <Text style={styles.followButtonText}>Follow</Text>
                                </LinearGradient>
                            )}
                        </Pressable>

                        <Pressable
                            style={[styles.actionButtonWrapper, { flex: 1 }]} // Message also flex 1
                            onPress={onMessage}
                        >
                            <View style={[styles.modernButton, styles.messageButton]}>
                                <Text style={styles.messageButtonText}>Message</Text>
                            </View>
                        </Pressable>
                    </View>

                    <View style={styles.bioSection}>
                        <Text style={styles.bioText}>
                            {profile?.bio || 'passionate creator • sharing knowledge • learning every day'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.tabsContainer}>
                {(['videos', 'posts'] as const).map((tab) => (
                    <Pressable
                        key={tab}
                        style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Ionicons
                            name={tab === 'posts' ? 'lock-closed-outline' : 'grid-outline'}
                            size={24}
                            color={activeTab === tab ? theme.colors.text.primary : theme.colors.text.secondary}
                        />
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const InternalVideoGridItem = ({ videoUrl }: { videoUrl: string }) => {
    const player = useVideoPlayer(encodeVideoUrl(videoUrl), player => {
        player.muted = true;
        player.loop = false;
        player.pause();
    });

    return (
        <VideoView
            player={player}
            style={styles.videoThumbnail}
            contentFit="cover"
            nativeControls={false}
        />
    );
};

const VideoGridItem = ({ item, index, onPress }: { item: any, index: number, onPress: () => void }) => {
    const { width } = useWindowDimensions();
    return (
        <Pressable
            style={[styles.videoGridItem, width <= 768 && { flex: 1, maxWidth: '33.333333%', width: undefined, height: undefined, aspectRatio: 1 / 1.3 }]}
            onPress={onPress}
        >
            {item.videoUrl ? (
                <InternalVideoGridItem videoUrl={item.videoUrl} />
            ) : (
                <View style={[styles.videoThumbnail, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="videocam-off" size={24} color="rgba(255,255,255,0.1)" />
                </View>
            )}
            <View style={styles.viewsOverlay}>
                <Ionicons name="play-outline" size={12} color="white" />
                <Text style={styles.viewsText}>{item.views || 0}</Text>
            </View>
        </Pressable>
    );
};

export default function UserProfileScreen() {
    const { width: windowWidth } = useWindowDimensions();
    const mobile = windowWidth <= 768;
    const { theme: activeTheme, mode } = useTheme();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user: currentUser } = useAuth(); // Current logged-in user
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [activeTab, setActiveTab] = useState<'posts' | 'videos'>('videos');
    const [isFollowing, setIsFollowing] = useState(false);
    const followPendingRef = React.useRef(false);
    const [followPending, setFollowPending] = useState(false);

    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const {
        videos,
        loading: loadingVideos,
    } = useVideos({ type: 'user', userId: id });

    const {
        posts,
        loading: loadingPosts,
    } = usePosts(id);

    const renderPostItem = ({ item }: { item: Post }) => (
        <View style={styles.postItem}>
            <View style={styles.postHeader}>
                <View style={styles.authorRow}>
                    <View style={styles.postAvatar}>
                        {item.authorAvatar ? (
                            <ImageBackground source={{ uri: item.authorAvatar }} style={{ flex: 1, borderRadius: 20 }} />
                        ) : (
                            <Text style={styles.postAvatarText}>
                                {item.authorName[0].toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View style={styles.authorInfo}>
                        <Text style={styles.postAuthor}>{item.authorName}</Text>
                        <Text style={styles.postDate}>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.postBody}>
                <Text style={styles.postContent}>{item.content}</Text>
            </View>

            <View style={styles.postFooter}>
                <Pressable style={styles.actionButtonInteraction}>
                    <Text style={{ color: '#D9E4FF', fontSize: 18 }}>✦</Text>
                    <Text style={styles.actionText}>{item.likes || 0}</Text>
                </Pressable>

                <Pressable style={styles.actionButtonInteraction}>
                    <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text.secondary} />
                    <Text style={styles.actionText}>{item.comments || 0}</Text>
                </Pressable>
            </View>
        </View>
    );

    const getProfileCoverImage = React.useCallback((userId: string) => {
        let sum = 0;
        for (let i = 0; i < userId.length; i++) {
            sum += userId.charCodeAt(i);
        }
        const seed = sum % 1000;
        return `https://image.pollinations.ai/prompt/futuristic%20neon%20neurorobot%20cyberpunk%20abstract%20background%20${seed}?nologo=true&width=800&height=600&model=flux`;
    }, []);

    const headerImageUrl = React.useMemo(() => {
        if (profile?.banner_url) return profile.banner_url;
        return getProfileCoverImage(id || 'default');
    }, [id, profile?.banner_url, getProfileCoverImage]);



    const fetchProfile = React.useCallback(async () => {
        if (!supabase || !id) {
            return;
        }

        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) throw profileError;

            // console.log('Fetched Profile Data:', JSON.stringify(profileData, null, 2));

            const { count } = await supabase
                .from('videos')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', id);

            const [followers, following] = await Promise.all([
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
                supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
            ]);
            if (profileData) {
                setProfile({
                    ...profileData,
                    followers_count: followers.count ?? profileData.followers_count,
                    following_count: following.count ?? profileData.following_count,
                    videos_count: count || 0
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            // Loading state handled
        }
    }, [id]);

    const checkIfFollowing = React.useCallback(async () => {
        if (!supabase || !currentUser || !id) return;

        const { data } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', id)
            .single();

        if (data) {
            setIsFollowing(true);
        } else {
            setIsFollowing(false);
        }
    }, [currentUser, id]);

    useEffect(() => {
        if (id) {
            fetchProfile();
            checkIfFollowing();
        }
    }, [id, fetchProfile, checkIfFollowing]);

    const handleFollow = async () => {
        if (!currentUser) {
            // Prompt login
            Alert.alert("Sign in", "Please sign in to follow users.");
            return;
        }

        if (currentUser.id === id) return;

        if (!supabase || followPendingRef.current) return;
        followPendingRef.current = true;
        setFollowPending(true);
        const wasFollowing = isFollowing;
        setIsFollowing(!wasFollowing);
        try {
            const result = wasFollowing
                ? await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', id)
                : await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: id });
            if (result.error) throw result.error;
            setProfile(previous => previous ? {
                ...previous,
                followers_count: Math.max(0, (previous.followers_count || 0) + (wasFollowing ? -1 : 1)),
            } : previous);
        } catch {
            setIsFollowing(wasFollowing);
            Alert.alert('Couldn’t update follow', 'Please try again.');
        } finally {
            followPendingRef.current = false;
            setFollowPending(false);
        }
    };

    const handleMessage = () => {
        if (!currentUser) {
            Alert.alert("Sign in", "Please sign in to message users.");
            return;
        }
        router.push({
            pathname: `/chat/[id]` as any,
            params: {
                id: id,
                name: profile?.display_name || profile?.username || 'User',
                userId: id
            }
        });
    };


    const navigateToVideo = (videoId: string, initialScrollIndex: number) => {
        router.push({
            pathname: '/video-player',
            params: {
                type: 'user',
                userId: id,
                initialVideoId: videoId
            }
        });
    };

    const renderVideoItem = ({ item, index }: { item: any, index: number }) => (
        <VideoGridItem item={item} index={index} onPress={() => navigateToVideo(item.id, index)} />
    );

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
                        <Text style={[styles.emptyStateText, { color: activeTheme.colors.text.secondary }]}>No videos yet.</Text>
                    </View>
                );
            }
            return null; // FlatList handles data rendering
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
                        <Text style={[styles.emptyStateText, { color: activeTheme.colors.text.secondary }]}>No posts yet.</Text>
                    </View>
                );
            }
            return null;
        }
        return null;
    };

    return (
        <View style={[styles.container, { backgroundColor: activeTheme.colors.background.primary }]}>
            <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />

            {/* Sticky Header Overlay */}
            {!mobile && <StickyHeader scrollY={scrollY} user={profile} />}

            <Animated.FlatList
                key={activeTab}
                data={(activeTab === 'videos' ? videos : activeTab === 'posts' ? posts : []) as any}
                renderItem={(props: any) => activeTab === 'videos' ? renderVideoItem(props) : renderPostItem(props)}
                keyExtractor={(item) => item.id}
                numColumns={activeTab === 'videos' ? 3 : 1}
                contentContainerStyle={[styles.flatListContent, { paddingBottom: 88 + insets.bottom }]}
                ListHeaderComponent={(
                    mobile ? <MobileProfileHeader profile={profile} userId={String(id)} activeTab={activeTab} onTab={setActiveTab}
                        own={currentUser?.id === id} onEdit={() => router.push('/edit-profile')} onBack={() => router.back()}
                        onFollow={handleFollow} onMessage={handleMessage} isFollowing={isFollowing} followPending={followPending} /> : <ProfileHeader
                        profile={profile}
                        user={currentUser} // Pass undefined or logic to fallback
                        scrollY={scrollY}
                        headerImageUrl={headerImageUrl}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        isFollowing={isFollowing}
                        onFollow={handleFollow}
                        onMessage={handleMessage}
                    />
                )}
                ListFooterComponent={renderContent}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={activeTab === 'videos' ? [styles.videoColumnWrapper, { backgroundColor: activeTheme.colors.background.primary }] : undefined}
                removeClippedSubviews={Platform.OS === 'android'}
                maxToRenderPerBatch={10}
                windowSize={5}
                initialNumToRender={12}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                style={{ backgroundColor: 'transparent' }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
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
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
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
        marginBottom: theme.spacing.md,
        overflow: 'hidden', // Ensure banner clips
        justifyContent: 'flex-end',
    },
    headerContent: {
        paddingBottom: theme.spacing.md,
        paddingTop: 100, // Push content down
    },

    // Profile Top Section
    profileTopSection: {
        flexDirection: 'row',
        alignItems: 'center', // Centered vertically
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md, // Tight
        paddingTop: 10,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        overflow: 'hidden',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    infoColumn: {
        flex: 1,
        paddingTop: 0,
    },
    displayName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 2,
    },
    username: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 8,
    },

    // Action Buttons
    actionButtonsRow: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        marginBottom: 16,
        gap: 12,
    },
    actionButtonWrapper: {
        borderRadius: 20,
        overflow: 'hidden', // Contain gradient
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    modernButton: {
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    followButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    followingButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    followingButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    messageButton: {
        backgroundColor: 'rgba(255,255,255,0.15)', // Glass effect
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    messageButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },

    // Bio
    bioSection: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    bioText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 20,
    },

    // Compact Stats
    compactStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    compactStatItem: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginRight: 12,
    },
    compactStatValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
        marginRight: 4,
    },
    compactStatLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    compactStatDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.4)',
        marginRight: 12,
    },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
        paddingBottom: 0,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        marginBottom: 1,
    },
    tabItem: {
        flex: 1,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTabItem: {
        borderBottomColor: theme.colors.primary.DEFAULT, // Use primary color for un-capped tabs
    },

    // Grid
    videoColumnWrapper: {
        gap: 1,
        backgroundColor: theme.colors.background.primary, // Ensure bg
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
    viewsOverlay: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewsText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
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

    // Post Item
    postItem: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        marginBottom: 20,
        borderRadius: 24,
        marginHorizontal: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
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
    postAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    postAvatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
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
    },
    actionButtonInteraction: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center'
    },
    actionText: {
        color: theme.colors.text.secondary,
        fontSize: 14,
        fontWeight: '600',
    },
});
