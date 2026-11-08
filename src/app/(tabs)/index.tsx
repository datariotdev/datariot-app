import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Pressable, StatusBar, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CoubClassicFeed } from '@components/VideoFeed/CoubClassicFeed';
import { useVideos, FeedType } from '@lib/supabase/hooks/useVideos';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SideMenu } from '../../components/Navigation/SideMenu';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { CommentsModal } from '../../components/VideoFeed/CommentsModal';
import { BlurView } from 'expo-blur';
import { CategoryPills } from '../../components/Discovery/CategoryPills';
import { VIDEO_CATEGORIES } from '../../lib/constants/categories';
import { PulseFeed } from '../../components/VideoFeed/PulseFeed/PulseFeed';
import { MosaicFeed } from '../../components/VideoFeed/MosaicFeed/MosaicFeed';
import { FullScreenVideoModal } from '../../components/VideoFeed/FullScreenVideoModal';
import { DeepDiveModal } from '../../components/VideoFeed/DeepDiveModal';
import { MoreOptionsModal } from '../../components/VideoFeed/MoreOptionsModal';
import { CommandBar, LiveTicker, HudButton, CommandTab } from '../../components/Web/CommandBar';
import { CuratedFeed } from '../../components/VideoFeed/CuratedFeed';
import { useCuratedReels } from '../../lib/curated/useCuratedReels';

type ViewMode = 'classic' | 'mosaic' | 'pulse';

const TABS: CommandTab[] = [
    { key: 'ai', label: 'ARENA', hint: 'BETA' },
    { key: 'trending', label: 'FEED' },
    { key: 'following', label: 'CIRCLE' },
];

const TICKER_ITEMS = [
    'ARENA OPEN — CHALLENGE ANY USER TO A LIVE DEBATE',
    'WEEKLY MISSION: SLOW MOTION — 5,000 XP POOL',
    'NEW: DNA MATCHING NOW RANKS YOUR FEED',
    '1,248 PILOTS ENROLLED THIS CYCLE',
];

const HomeScreen = () => {
    const router = useRouter();
    const isFocused = useIsFocused();
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState<FeedType>('trending');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>(Platform.OS === 'web' ? 'classic' : 'mosaic');
    const { theme, mode, toggleTheme } = useTheme();
    const isDark = mode === 'dark';

    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web' && width > 768; // Web Desktop Mode

    const {
        videos,
        loading,
        loadMore,
        toggleLike,
        toggleFollow,
    } = useVideos({
        type: activeTab,
        category: activeCategory || undefined,
    });

    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [commentsVideoId, setCommentsVideoId] = useState<string | null>(null);
    const [deepDiveVideo, setDeepDiveVideo] = useState<any | null>(null);
    const [moreOptionsVideo, setMoreOptionsVideo] = useState<any | null>(null);
    const curatedReels = useCuratedReels(activeTab === 'trending', activeCategory);

    const handleSelectVideo = (videoId: string) => setSelectedVideoId(videoId);
    const handleComment = (videoId: string) => setCommentsVideoId(videoId);
    const handleSave = (videoId: string) => console.log('Save:', videoId);

    const handleMore = (videoId: string) => {
        const vid = videos.find(v => v.id === videoId);
        if (vid) setMoreOptionsVideo(vid);
    };

    if (activeTab !== 'trending' && loading && videos.length === 0) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
            </View>
        );
    }

    const isFeedActive =
        isFocused &&
        selectedVideoId === null &&
        commentsVideoId === null &&
        deepDiveVideo === null &&
        moreOptionsVideo === null;

    const feedPaddingTop = isWeb ? 8 : (activeTab === 'trending' ? insets.top + 120 : insets.top + 64);

    const feed = activeTab === 'trending' ? (
        <CuratedFeed videos={videos} reels={curatedReels} grid={viewMode === 'mosaic'}
            isFocused={isFeedActive} paddingTop={feedPaddingTop} onEndReached={loadMore}
            onSelectNative={handleSelectVideo} />
    ) : videos.length > 0 ? (
        viewMode === 'mosaic' ? (
            <MosaicFeed
                videos={videos}
                isFocused={isFeedActive}
                onEndReached={loadMore}
                onSelect={handleSelectVideo}
                paddingTop={feedPaddingTop}
            />
        ) : viewMode === 'pulse' ? (
            <PulseFeed
                videos={videos}
                isFocused={isFeedActive}
                onLike={toggleLike}
                onComment={handleComment}
                onSave={handleSave}
                onMore={handleMore}
                onFollow={toggleFollow}
            />
        ) : (
            <CoubClassicFeed
                videos={videos}
                isScreenFocused={isFeedActive}
                onEndReached={loadMore}
                onLike={toggleLike}
                onComment={handleComment}
                onSave={handleSave}
                onMore={handleMore}
                onFollow={toggleFollow}
                onSelect={handleSelectVideo}
                paddingTop={feedPaddingTop}
            />
        )
    ) : !loading ? (
        <View style={styles.emptyContainer}>
            <BlurView
                intensity={isDark ? 30 : 50}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.emptyCard, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            >
                {isDark && (
                    <LinearGradient
                        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                    />
                )}
                <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <Feather name="radio" size={30} color={theme.colors.primary.DEFAULT} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}>
                    NO SIGNAL
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary, fontFamily: MONO }]}>
                    NOTHING IS BROADCASTING ON THIS CHANNEL. CLEAR YOUR FILTERS OR CHECK BACK LATER.
                </Text>
                <Pressable style={[styles.retryButton, { borderColor: theme.colors.primary.DEFAULT }]} onPress={loadMore}>
                    <Text style={[styles.retryText, { color: theme.colors.primary.DEFAULT, fontFamily: MONO }]}>
                        [ RESCAN ]
                    </Text>
                </Pressable>
            </BlurView>
        </View>
    ) : null;

    const modals = (
        <>
            <CommentsModal
                visible={!!commentsVideoId}
                videoId={commentsVideoId}
                onClose={() => setCommentsVideoId(null)}
            />

            <FullScreenVideoModal
                visible={selectedVideoId !== null}
                videos={videos}
                initialVideoId={selectedVideoId}
                onClose={() => setSelectedVideoId(null)}
                onLike={toggleLike}
                onComment={handleComment}
                onSave={handleSave}
                onMore={handleMore}
                onFollow={toggleFollow}
            />

            <MoreOptionsModal
                visible={moreOptionsVideo !== null}
                onClose={() => setMoreOptionsVideo(null)}
                onDeepDive={() => setDeepDiveVideo(moreOptionsVideo)}
            />
            <DeepDiveModal
                visible={deepDiveVideo !== null}
                video={deepDiveVideo}
                onClose={() => setDeepDiveVideo(null)}
            />
        </>
    );

    /* ---------------- Desktop web: docked command deck ---------------- */
    if (isWeb) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

                <CommandBar
                    tabs={TABS}
                    activeKey={activeTab}
                    onTabPress={(key) => setActiveTab(key as FeedType)}
                    readout={['SIGNAL NOMINAL', '2.4K ONLINE', 'LAT 12MS']}
                    actions={
                        <>
                            <HudButton
                                label="Toggle grid layout"
                                active={viewMode === 'mosaic'}
                                onPress={() => setViewMode(viewMode === 'mosaic' ? 'classic' : 'mosaic')}
                                icon={
                                    <Ionicons
                                        name={viewMode === 'mosaic' ? 'grid' : 'apps-outline'}
                                        size={17}
                                        color={viewMode === 'mosaic' ? theme.colors.primary.DEFAULT : theme.colors.text.secondary}
                                    />
                                }
                            />
                            <HudButton
                                label="Toggle theme"
                                onPress={toggleTheme}
                                icon={<Feather name={isDark ? 'sun' : 'moon'} size={16} color={theme.colors.text.secondary} />}
                            />
                        </>
                    }
                />

                <LiveTicker items={TICKER_ITEMS} />

                {activeTab === 'trending' && (
                    <View
                        style={[
                            styles.filterRow,
                            {
                                backgroundColor: isDark ? '#0A0B11' : '#FBFBFD',
                                borderBottomColor: isDark ? 'rgba(217, 228, 255, 0.07)' : 'rgba(0,0,0,0.06)',
                            },
                        ]}
                    >
                        <CategoryPills
                            categories={['All', ...VIDEO_CATEGORIES]}
                            activeCategory={activeCategory || 'All'}
                            onCategoryPress={(cat) => setActiveCategory(cat === 'All' ? null : cat)}
                        />
                    </View>
                )}

                <View style={styles.deckBody}>{feed}</View>

                {modals}
            </View>
        );
    }

    /* ---------------- Mobile: original floating chrome ---------------- */
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            <View style={[styles.topNav, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
                <View style={styles.topNavContent} pointerEvents="box-none">
                    <View style={styles.leftActionsContainer}>
                        <Pressable
                            style={[
                                styles.roundButton,
                                {
                                    backgroundColor: isDark ? 'rgba(8, 9, 13, 0.65)' : 'rgba(255, 255, 255, 0.9)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                },
                            ]}
                            onPress={() => setIsMenuOpen(true)}
                        >
                            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                            <Feather name="menu" size={22} color={theme.colors.text.primary} />
                        </Pressable>
                    </View>

                    <View style={styles.pillContainer}>
                        <BlurView
                            intensity={70}
                            tint={isDark ? 'dark' : 'light'}
                            style={[
                                styles.pillBlur,
                                {
                                    backgroundColor: isDark ? 'rgba(8, 9, 13, 0.5)' : 'rgba(255, 255, 255, 0.8)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
                                },
                            ]}
                        >
                            {TABS.map((tab) => (
                                <TabButton
                                    key={tab.key}
                                    theme={theme}
                                    label={tab.label}
                                    isActive={activeTab === tab.key}
                                    onPress={() => setActiveTab(tab.key as FeedType)}
                                    isDark={isDark}
                                />
                            ))}
                        </BlurView>
                    </View>

                    <View style={styles.rightActionsContainer}>
                        <Pressable
                            style={[
                                styles.roundButton,
                                {
                                    backgroundColor: viewMode === 'mosaic'
                                        ? theme.colors.primary.DEFAULT
                                        : (isDark ? 'rgba(8, 9, 13, 0.65)' : 'rgba(255, 255, 255, 0.9)'),
                                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                    marginRight: 8,
                                },
                            ]}
                            onPress={() => setViewMode(viewMode === 'mosaic' ? 'classic' : 'mosaic')}
                        >
                            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                            <Ionicons
                                name={viewMode === 'mosaic' ? 'grid' : 'apps'}
                                size={22}
                                color={viewMode === 'mosaic' ? '#000' : theme.colors.text.primary}
                            />
                        </Pressable>

                        <Pressable
                            style={[
                                styles.roundButton,
                                {
                                    backgroundColor: isDark ? 'rgba(8, 9, 13, 0.65)' : 'rgba(255, 255, 255, 0.9)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                },
                            ]}
                            onPress={() => router.push('/profile')}
                        >
                            <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                            <Feather name="user" size={22} color={theme.colors.text.primary} />
                        </Pressable>
                    </View>

                    {/* The row bleeds 16px past the nav padding on both sides.
                        Sizing it from the window width overflowed the column
                        and put a horizontal scrollbar on the page (#9). */}
                    {activeTab === 'trending' && (
                        <View style={[styles.categoryFiltersContainer, { left: -16, right: -16 }]}>
                            <CategoryPills
                                categories={['All', ...VIDEO_CATEGORIES]}
                                activeCategory={activeCategory || 'All'}
                                onCategoryPress={(cat) => setActiveCategory(cat === 'All' ? null : cat)}
                            />
                        </View>
                    )}
                </View>
            </View>

            {feed}

            <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {modals}
        </View>
    );
};

const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterRow: {
        height: 46,
        justifyContent: 'center',
        borderBottomWidth: 1,
        zIndex: 18,
    },
    deckBody: {
        flex: 1,
    },
    topNav: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    topNavContent: {
        height: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    roundButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
    },
    leftActionsContainer: {
        width: 44,
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    rightActionsContainer: {
        width: 148,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    pillContainer: {
        flex: 1,
        marginHorizontal: 8,
    },
    categoryFiltersContainer: {
        position: 'absolute',
        top: 54,
        height: 58,
    },
    pillBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        padding: 4,
        overflow: 'hidden',
        borderWidth: 1,
        alignSelf: 'stretch',
    },
    tabButton: {
        flex: 1,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderRadius: 18,
        overflow: 'hidden',
    },
    tabIndicatorBackground: {
        position: 'absolute',
        top: 2,
        bottom: 2,
        left: 2,
        right: 2,
        borderRadius: 16,
    },
    tabText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyCard: {
        width: '100%',
        maxWidth: 360,
        padding: 32,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        overflow: 'hidden',
    },
    emptyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 22,
    },
    emptyTitle: {
        fontSize: 18,
        letterSpacing: 2,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 10.5,
        textAlign: 'center',
        marginBottom: 28,
        lineHeight: 18,
        letterSpacing: 1,
    },
    retryButton: {
        paddingHorizontal: 26,
        paddingVertical: 11,
        borderRadius: 8,
        borderWidth: 1,
    },
    retryText: {
        fontSize: 11,
        letterSpacing: 1.6,
        fontWeight: '700',
    },
});

const TabButton = ({ theme, label, isActive, onPress, isDark }: any) => {
    const [isHovered, setIsHovered] = React.useState(false);
    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            style={[
                styles.tabButton,
                isHovered && !isActive && {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                },
            ]}
        >
            {isActive && (
                <View style={[StyleSheet.absoluteFill, { padding: 2 }]}>
                    <LinearGradient
                        colors={isDark ? ['#D9E4FF', '#A5C6FF'] : ['#6B7FCC', '#99B4FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.tabIndicatorBackground}
                    />
                </View>
            )}
            <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                    styles.tabText,
                    { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamilies.medium },
                    isActive && {
                        color: isDark ? '#000000' : '#FFFFFF',
                        fontFamily: theme.typography.fontFamilies.bold,
                        fontWeight: '800',
                    },
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
};

export default HomeScreen;
