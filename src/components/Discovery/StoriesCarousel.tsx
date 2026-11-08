import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@design-system/theme';

interface Story {
    id: string;
    userId: string;
    username: string;
    avatarUrl: string;
    isViewed: boolean;
}

interface StoriesCarouselProps {
    stories: Story[];
    onStoryPress: (storyId: string) => void;
    onAddStory?: () => void;
}

export const StoriesCarousel = ({ stories, onStoryPress, onAddStory }: StoriesCarouselProps) => {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Add Story Button */}
                {onAddStory && (
                    <Pressable onPress={onAddStory} style={styles.addStoryContainer}>
                        <View style={styles.addStoryCircle}>
                            <LinearGradient
                                colors={[theme.colors.primary.light, theme.colors.secondary.DEFAULT]}
                                style={styles.addStoryGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View style={styles.addStoryInner}>
                                    <Ionicons name="add" size={24} color={theme.colors.primary.light} />
                                </View>
                            </LinearGradient>
                        </View>
                        <Text style={styles.storyUsername}>Your Story</Text>
                    </Pressable>
                )}

                {/* Stories */}
                {stories.map((story) => (
                    <Pressable
                        key={story.id}
                        onPress={() => onStoryPress(story.id)}
                        style={styles.storyContainer}
                    >
                        <View style={styles.storyCircle}>
                            {!story.isViewed ? (
                                <LinearGradient
                                    colors={[theme.colors.primary.light, theme.colors.secondary.DEFAULT]}
                                    style={styles.storyGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.storyInner}>
                                        <Image
                                            source={{ uri: story.avatarUrl || 'https://via.placeholder.com/70' }}
                                            style={styles.storyAvatar}
                                        />
                                    </View>
                                </LinearGradient>
                            ) : (
                                <View style={styles.viewedStoryBorder}>
                                    <Image
                                        source={{ uri: story.avatarUrl || 'https://via.placeholder.com/70' }}
                                        style={styles.storyAvatar}
                                    />
                                </View>
                            )}
                        </View>
                        <Text style={styles.storyUsername} numberOfLines={1}>
                            {story.username}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

const STORY_SIZE = 70;
const BORDER_WIDTH = 3;

const styles = StyleSheet.create({
    container: {
        marginVertical: theme.spacing.md,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    addStoryContainer: {
        alignItems: 'center',
        width: STORY_SIZE,
    },
    storyContainer: {
        alignItems: 'center',
        width: STORY_SIZE,
    },
    storyCircle: {
        width: STORY_SIZE,
        height: STORY_SIZE,
        marginBottom: theme.spacing.xs,
    },
    addStoryCircle: {
        width: STORY_SIZE,
        height: STORY_SIZE,
        marginBottom: theme.spacing.xs,
    },
    storyGradient: {
        width: STORY_SIZE,
        height: STORY_SIZE,
        borderRadius: STORY_SIZE / 2,
        padding: BORDER_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addStoryGradient: {
        width: STORY_SIZE,
        height: STORY_SIZE,
        borderRadius: STORY_SIZE / 2,
        padding: BORDER_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
    },
    storyInner: {
        width: STORY_SIZE - (BORDER_WIDTH * 2),
        height: STORY_SIZE - (BORDER_WIDTH * 2),
        borderRadius: (STORY_SIZE - (BORDER_WIDTH * 2)) / 2,
        backgroundColor: theme.colors.background.primary,
        padding: 2,
    },
    addStoryInner: {
        width: STORY_SIZE - (BORDER_WIDTH * 2),
        height: STORY_SIZE - (BORDER_WIDTH * 2),
        borderRadius: (STORY_SIZE - (BORDER_WIDTH * 2)) / 2,
        backgroundColor: theme.colors.surface.light,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewedStoryBorder: {
        width: STORY_SIZE,
        height: STORY_SIZE,
        borderRadius: STORY_SIZE / 2,
        borderWidth: 2,
        borderColor: theme.colors.surface.light,
        padding: 2,
    },
    storyAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: STORY_SIZE / 2,
    },
    storyUsername: {
        fontSize: theme.typography.sizes.xs,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        maxWidth: STORY_SIZE,
    },
});
