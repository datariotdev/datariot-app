import React, { useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, ViewToken, Dimensions, Platform } from 'react-native';
import { MosaicItem } from './MosaicItem';
import { useTheme } from '../../Theme/ThemeProvider';
import { Video } from '../../../lib/supabase/hooks/useVideos';
import { SectionHeader } from '../../Discovery/SectionHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SPACING = 12;

interface MosaicFeedProps {
    videos: Video[];
    onEndReached: () => void;
    onSelect: (videoId: string) => void;
    isFocused?: boolean;
    paddingTop?: number;
    paddingBottom?: number;
}

export function MosaicFeed({
    videos,
    onEndReached,
    onSelect,
    isFocused = true,
    paddingTop = 0,
    paddingBottom = 40,
}: MosaicFeedProps) {
    const { theme } = useTheme();
    const { width } = Dimensions.get('window');
    const isWeb = Platform.OS === 'web' && width > 768;
    const numColumns = isWeb ? 3 : 2;
    const [viewableItems, setViewableItems] = useState<Set<string>>(new Set());

    const onViewableItemsChanged = useCallback(
        ({ viewableItems: currentlyViewable }: { viewableItems: ViewToken[] }) => {
            const newViewable = new Set<string>();
            currentlyViewable.forEach(item => {
                if (item.isViewable && item.key) {
                    newViewable.add(item.key as string);
                }
            });
            setViewableItems(newViewable);
        },
        []
    );

    const viewabilityConfig = useMemo(() => ({
        itemVisiblePercentThreshold: 70,
    }), []);

    const renderItem = ({ item }: { item: Video }) => {
        const isActive = viewableItems.has(item.id);

        return (
            <MosaicItem
                video={item}
                isActive={isActive}
                isScreenFocused={isFocused}
                onPress={() => onSelect(item.id)}
            />
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <FlatList
                data={videos}
                renderItem={renderItem}
                ListHeaderComponent={
                    <View style={{ marginTop: 12, marginBottom: 12 }}>
                        <SectionHeader
                            title="Datariot Daily Synergy"
                            subtitle="Curated based on your Creator DNA"
                            containerStyle={{ paddingTop: 0 }}
                        />
                    </View>
                }
                keyExtractor={(item) => item.id}
                key={isWeb ? 'web-mosaic' : 'mobile-mosaic'}
                numColumns={numColumns}
                showsVerticalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={{
                    paddingTop: paddingTop + GRID_SPACING,
                    paddingBottom: paddingBottom + 80,
                    paddingHorizontal: GRID_SPACING,
                }}
                removeClippedSubviews={true}
                maxToRenderPerBatch={6}
                windowSize={5}
                initialNumToRender={4}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
});
