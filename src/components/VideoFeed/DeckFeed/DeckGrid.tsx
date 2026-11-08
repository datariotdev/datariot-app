import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { DeckCard, CardScale } from './DeckCard';
import type { Video } from '../../../lib/supabase/hooks/useVideos';

const GAP = 16;

interface RowSpec {
    /** flex weight per slot — drives the asymmetry */
    weights: number[];
    height: number;
    scales: CardScale[];
}

/**
 * A 7-item rhythm: a dominant hero row, a triptych, then the mirror of the
 * hero row. Nothing in the grid lines up with the row above it, which is what
 * keeps it from reading as a timeline.
 */
const PATTERN: RowSpec[] = [
    { weights: [1.62, 1], height: 340, scales: ['hero', 'standard'] },
    { weights: [1, 1, 1], height: 232, scales: ['compact', 'compact', 'compact'] },
    { weights: [1, 1.62], height: 296, scales: ['standard', 'wide'] },
];

interface Row {
    key: string;
    spec: RowSpec;
    items: Video[];
    startIndex: number;
}

const buildRows = (videos: Video[]): Row[] => {
    const rows: Row[] = [];
    let cursor = 0;
    let patternIdx = 0;

    while (cursor < videos.length) {
        const spec = PATTERN[patternIdx % PATTERN.length];
        const slots = spec.weights.length;
        const items = videos.slice(cursor, cursor + slots);

        // A trailing partial row would stretch one card across the deck; drop it
        // rather than show a lopsided orphan.
        if (items.length < slots) break;

        rows.push({ key: `row-${cursor}`, spec, items, startIndex: cursor });
        cursor += slots;
        patternIdx += 1;
    }

    return rows;
};

interface DeckGridProps {
    videos: Video[];
    onSelect: (id: string) => void;
    onLike: (id: string) => void;
    onComment: (id: string) => void;
    onMore: (id: string) => void;
    onEndReached: () => void;
    ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
    contentPaddingTop?: number;
    contentPaddingBottom?: number;
}

export const DeckGrid = ({
    videos,
    onSelect,
    onLike,
    onComment,
    onMore,
    onEndReached,
    ListHeaderComponent,
    contentPaddingTop = 0,
    contentPaddingBottom = 80,
}: DeckGridProps) => {
    const rows = useMemo(() => buildRows(videos), [videos]);

    const renderRow = useCallback(
        ({ item: row }: { item: Row }) => (
            <View style={[styles.row, { height: row.spec.height }]}>
                {row.items.map((video, slot) => (
                    <View
                        key={`${video.id}-${row.startIndex + slot}`}
                        style={{ flex: row.spec.weights[slot], marginRight: slot === row.items.length - 1 ? 0 : GAP }}
                    >
                        <DeckCard
                            item={video}
                            index={row.startIndex + slot}
                            scale={row.spec.scales[slot]}
                            height={row.spec.height}
                            onSelect={() => onSelect(video.id)}
                            onLike={() => onLike(video.id)}
                            onComment={() => onComment(video.id)}
                            onMore={() => onMore(video.id)}
                        />
                    </View>
                ))}
            </View>
        ),
        [onSelect, onLike, onComment, onMore]
    );

    return (
        <FlatList
            data={rows}
            renderItem={renderRow}
            keyExtractor={(row) => row.key}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={ListHeaderComponent}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.6}
            removeClippedSubviews={false}
            initialNumToRender={3}
            maxToRenderPerBatch={2}
            windowSize={5}
            contentContainerStyle={{
                paddingTop: contentPaddingTop,
                paddingBottom: contentPaddingBottom,
                paddingHorizontal: 28,
            }}
        />
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        marginBottom: GAP,
    },
});
