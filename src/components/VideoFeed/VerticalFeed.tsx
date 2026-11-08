import React, { useRef, useState, useCallback } from 'react';
import { FlatList, ViewToken, StyleSheet, View, useWindowDimensions } from 'react-native';
import { FeedItem } from './FeedItem';

interface Video {
    id: string;
    videoUrl: string;
    title: string;
    description: string;
    author: string;
    authorId: string;
    avatarUrl?: string;
    hashtag?: string;
    progress?: { current: number; total: number };
    likes: number;
    comments: number;
    saved: number;
    isLiked: boolean;
    isSaved: boolean;
    isFollowing: boolean;
    isLive?: boolean;
}

interface VerticalFeedProps {
    videos: Video[];
    onEndReached: () => void;
    onLike: (videoId: string) => void;
    onComment: (videoId: string) => void;
    onSave: (videoId: string) => void;
    onMore: (videoId: string) => void;
    onFollow: (authorId: string) => void;
    isScreenFocused?: boolean;
    initialScrollIndex?: number;
}


const viewabilityConfig = {
    itemVisiblePercentThreshold: 60,
};

export function VerticalFeed({
    videos,
    onEndReached,
    onLike,
    onComment,
    onSave,
    onMore,
    onFollow,
    isScreenFocused = true,
    initialScrollIndex = 0,
    containerHeight: propContainerHeight,
}: VerticalFeedProps & { containerHeight?: number }) {
    const { height: windowHeight } = useWindowDimensions();
    const containerHeight = propContainerHeight ?? windowHeight;
    const [activeVideoIndex, setActiveVideoIndex] = useState(initialScrollIndex);
    const flatListRef = useRef<FlatList>(null);

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

    const handleSwipeUp = useCallback(() => {
        if (activeVideoIndex < videos.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: activeVideoIndex + 1,
                animated: true,
            });
        }
    }, [activeVideoIndex, videos.length]);

    const handleSwipeDown = useCallback(() => {
        if (activeVideoIndex > 0) {
            flatListRef.current?.scrollToIndex({
                index: activeVideoIndex - 1,
                animated: true,
            });
        }
    }, [activeVideoIndex]);

    const renderItem = ({ item, index }: { item: Video; index: number }) => {
        const isActive = index === activeVideoIndex && isScreenFocused;

        return (
            <View style={{ height: containerHeight, backgroundColor: '#000' }}>
                <FeedItem
                    item={item}
                    isActive={isActive}
                    height={containerHeight}
                    onSwipeUp={handleSwipeUp}
                    onSwipeDown={handleSwipeDown}
                    onLike={() => onLike(item.id)}
                    onComment={() => onComment(item.id)}
                    onSave={() => onSave(item.id)}
                    onMore={() => onMore(item.id)}
                    onFollow={() => onFollow(item.authorId)}
                />
            </View>
        );
    };

    return (
        <FlatList
            ref={flatListRef}
            data={videos}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={containerHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            removeClippedSubviews={false}
            maxToRenderPerBatch={5}
            windowSize={10}
            initialNumToRender={3}
            getItemLayout={(data, index) => ({
                length: containerHeight,
                offset: containerHeight * index,
                index,
            })}
            initialScrollIndex={initialScrollIndex}
            style={styles.list}
        />
    );
}
const styles = StyleSheet.create({
    list: {
        flex: 1,
    },
});
