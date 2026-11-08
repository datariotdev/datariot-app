import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { CoubClassicFeed } from '@components/VideoFeed/CoubClassicFeed';
import { useVideos, FeedType } from '@lib/supabase/hooks/useVideos';
import { theme } from '@design-system/theme';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

export default function VideoPlayerScreen() {
    const isFocused = useIsFocused();
    const params = useLocalSearchParams<{
        type: FeedType;
        userId?: string;
        hashtag?: string;
        searchQuery?: string;
        initialVideoId?: string;
        sort?: 'recent' | 'popular';
    }>();

    const router = useRouter();
    const insets = useSafeAreaInsets();

    const getStringParam = (param: string | string[] | undefined) => {
        if (!param || param === "undefined") return undefined;
        const val = Array.isArray(param) ? param[0] : param;
        return val === "" ? undefined : val;
    };

    const cleanSearchQuery = getStringParam(params.searchQuery);
    const cleanHashtag = getStringParam(params.hashtag);
    const cleanUserId = getStringParam(params.userId);
    const cleanType = (getStringParam(params.type) || 'trending') as FeedType;
    const cleanSort = getStringParam(params.sort) as 'recent' | 'popular' | undefined;
    const initialVideoId = getStringParam(params.initialVideoId);

    console.log("VideoPlayerScreen clean params:", { cleanType, cleanSearchQuery, cleanHashtag, cleanUserId, cleanSort, initialVideoId });

    const {
        videos,
        loading,
        loadMore,
        toggleLike,
        toggleFollow
    } = useVideos({
        type: cleanType,
        userId: cleanUserId,
        hashtag: cleanHashtag,
        searchQuery: cleanSearchQuery,
        sort: cleanSort
    });

    console.log(`VideoPlayerScreen loaded ${videos.length} videos. loading: ${loading}`);

    // Handle back navigation
    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)');
        }
    };

    const handleComment = (videoId: string) => {
        console.log('Comment on:', videoId);
    };

    const handleSave = (videoId: string) => {
        console.log('Save:', videoId);
    };

    const handleMore = (videoId: string) => {
        console.log('More options:', videoId);
    };

    // Filter videos to start from the initialVideoId if provided
    // Ideally, we would scroll to the index, but filtering/reordering might be easier for now
    // Or we rely on VerticalFeed to handle initialScrollIndex (not implemented there yet)
    // For now, let's just show the feed as returned.
    // TODO: Implement initialScrollIndex in VerticalFeed if needed for exact positioning.

    if (loading && videos.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
            </View>
        );
    }

    if (!loading && videos.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: 'white' }}>Video not found</Text>
                <TouchableOpacity onPress={handleBack} style={{ marginTop: 20, padding: 10, backgroundColor: theme.colors.primary.DEFAULT, borderRadius: 8 }}>
                    <Text style={{ color: 'white' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        )
    }

    // Identify start index based on initialVideoId
    let initialScrollIndex = 0;
    if (initialVideoId && videos.length > 0) {
        const foundIdx = videos.findIndex(v => v.id === initialVideoId);
        if (foundIdx !== -1) {
            initialScrollIndex = foundIdx;
        }
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <CoubClassicFeed
                videos={videos}
                isScreenFocused={isFocused}
                onEndReached={loadMore}
                onLike={toggleLike}
                onComment={handleComment}
                onSave={handleSave}
                onMore={handleMore}
                onFollow={toggleFollow}
                onSelect={(id) => console.log('Selected:', id)}
                initialScrollIndex={initialScrollIndex}
            />

            {/* Back Button Overlay */}
            <TouchableOpacity
                style={[styles.backButton, { top: insets.top + 10 }]}
                onPress={handleBack}
            >
                <Feather name="arrow-left" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        zIndex: 10,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    }
});
