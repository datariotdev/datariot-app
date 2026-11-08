import React, { useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, ViewToken, Platform, useWindowDimensions } from 'react-native';
import { CoubClassicItem } from './CoubClassicItem';
import { useTheme } from '../Theme/ThemeProvider';
import { SectionHeader } from '../Discovery/SectionHeader';
import { DiscoveryCarousel } from '../Discovery/DiscoveryCarousel';
import { FeaturedHero } from '../Discovery/FeaturedHero';
import { DeckGrid } from './DeckFeed/DeckGrid';
import { Video } from '../../lib/supabase/hooks/useVideos';

interface CoubClassicFeedProps {
    videos: Video[];
    onEndReached: () => void;
    onLike: (videoId: string) => void;
    onComment: (videoId: string) => void;
    onSave: (videoId: string) => void;
    onMore: (videoId: string) => void;
    onFollow: (authorId: string) => void;
    onSelect: (videoId: string) => void;
    isScreenFocused?: boolean;
    initialScrollIndex?: number;
    paddingTop?: number;
    paddingBottom?: number;
}

export function CoubClassicFeed({
    videos,
    onEndReached,
    onLike,
    onComment,
    onSave,
    onMore,
    onFollow,
    onSelect,
    isScreenFocused = true,
    initialScrollIndex = 0,
    paddingTop = 0,
    paddingBottom = 40,
}: CoubClassicFeedProps) {
    const [activeVideoIndex, setActiveVideoIndex] = useState(initialScrollIndex);
    const flatListRef = useRef<FlatList>(null);
    const { theme } = useTheme();
    const { width } = useWindowDimensions();
    const isDesktopWeb = Platform.OS === 'web' && width > 768;

    const ensureMinCount = useCallback(<T,>(list: T[], min: number): T[] => {
        if (list.length === 0) return [];
        if (list.length >= min) return list;

        const padded = [...list];
        while (padded.length < min) {
            padded.push(...list);
        }
        return padded.slice(0, min);
    }, []);

    const allSynergy = useMemo(() => videos.filter(v => v.isHighSynergy), [videos]);

    const featuredVideos = useMemo(() => {
        const base = allSynergy.slice(0, 3).map(v => ({
            id: v.id,
            title: v.title,
            author: v.author,
            avatarUrl: v.avatarUrl || 'https://picsum.photos/seed/' + v.id + '/100',
            videoUrl: v.videoUrl,
            thumbnailUrl: v.thumbnailUrl,
            views: v.views,
            likes: v.likes,
            logicStats: v.logicStats
        }));
        return ensureMinCount(base, 5);
    }, [allSynergy, ensureMinCount]);

    const synergyVideos = useMemo(() => {
        let base;
        // If we have few total synergy videos (e.g. 5 or less), show all of them in the carousel
        // to avoid an empty section, even if they are already featured.
        if (allSynergy.length <= 5) {
            base = allSynergy;
        } else {
            // Otherwise, show the next set for discovery
            base = allSynergy.slice(3, 11);
        }
        return ensureMinCount(base, 5);
    }, [allSynergy, ensureMinCount]);

    const scrollVideos = useMemo(() => {
        let base;
        // Define which videos go to the main vertical scroll
        // This ensures no single video dominates all UI sections too much
        if (allSynergy.length <= 3) {
            base = videos;
        } else {
            base = videos.filter(v => !v.isHighSynergy || videos.indexOf(v) > 8);
        }
        return ensureMinCount(base, 5);
    }, [videos, allSynergy, ensureMinCount]);

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0) {
                const index = viewableItems[0].index;
                if (index !== null) {
                    setActiveVideoIndex(index);
                }
            }
        },
        []
    );

    const viewabilityConfig = useMemo(() => ({
        itemVisiblePercentThreshold: 60,
    }), []);

    const header = (
        <View style={{ marginBottom: 8, marginTop: paddingTop + 10 }}>
            {featuredVideos.length > 0 && (
                <>
                    <SectionHeader
                        title="Live Arena"
                        subtitle="Debates running right now"
                        index="01"
                        meta={`${featuredVideos.length} OPEN`}
                        containerStyle={isDesktopWeb ? { paddingHorizontal: 0, paddingTop: 20 } : undefined}
                    />
                    <FeaturedHero featuredVideos={featuredVideos} onVideoPress={onSelect} />
                </>
            )}

            <SectionHeader
                title="Datariot Originals"
                subtitle="Curated high-signal video"
                index="02"
                meta={`${synergyVideos.length} PICKS`}
                containerStyle={isDesktopWeb ? { paddingHorizontal: 0 } : undefined}
            />
            <DiscoveryCarousel videos={synergyVideos} onSelect={onSelect} />

            <SectionHeader
                title="The Deck"
                subtitle="Everything moving across the platform"
                index="03"
                meta={`${scrollVideos.length} SIGNALS`}
                containerStyle={isDesktopWeb ? { paddingHorizontal: 0 } : undefined}
            />
        </View>
    );

    /* Desktop web gets the asymmetric deck grid instead of a single column. */
    if (isDesktopWeb) {
        return (
            <View style={styles.container}>
                <DeckGrid
                    videos={scrollVideos}
                    onSelect={onSelect}
                    onLike={onLike}
                    onComment={onComment}
                    onMore={onMore}
                    onEndReached={onEndReached}
                    ListHeaderComponent={header}
                    contentPaddingBottom={paddingBottom + 80}
                />
            </View>
        );
    }

    const renderItem = ({ item, index }: { item: Video; index: number }) => {
        const isActive = index === activeVideoIndex && isScreenFocused;

        return (
            <CoubClassicItem
                item={item}
                isActive={isActive}
                onLike={() => onLike(item.id)}
                onComment={() => onComment(item.id)}
                onSave={() => onSave(item.id)}
                onMore={() => onMore(item.id)}
                onSelect={() => onSelect(item.id)}
            />
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <FlatList
                ref={flatListRef}
                data={scrollVideos}
                renderItem={renderItem}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={header}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                removeClippedSubviews={false}
                maxToRenderPerBatch={3}
                windowSize={5}
                initialNumToRender={2}
                initialScrollIndex={initialScrollIndex}
                onScrollToIndexFailed={(info) => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                    });
                }}
                contentContainerStyle={{
                    paddingBottom: paddingBottom + 80,
                    width: '100%',
                    // No max width here. This container holds the section
                    // headers and the horizontal rows as well as the video
                    // items, so capping it at 720 inside a wider column inset
                    // every row from the headings above it and cut the
                    // carousels short. CoubClassicItem caps itself at 700 and
                    // centres, so the vertical feed keeps its reading width.
                    paddingHorizontal: 0,
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
