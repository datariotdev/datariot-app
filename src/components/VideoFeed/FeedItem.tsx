import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, Pressable } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { encodeVideoUrl } from '../../lib/utils/url';

interface FeedItemProps {
    item: any;
    isActive: boolean;
    height: number;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onLike: () => void;
    onComment: () => void;
    onSave: () => void;
    onMore: () => void;
    onFollow: () => void;
}

interface InternalVideoProps {
    videoUrl: string;
    isActive: boolean;
    isFocused: boolean;
    isPaused: boolean;
}

const InternalVideo = ({ videoUrl, isActive, isFocused, isPaused }: InternalVideoProps) => {
    const player = useVideoPlayer(encodeVideoUrl(videoUrl) || '', player => {
        player.loop = true;
        player.muted = true;
    });

    useEffect(() => {
        if (isActive && isFocused && !isPaused) {
            const playVideo = async () => {
                try {
                    await player.play();
                } catch (e: any) {
                    // Silently handle AbortError which is common on web when scrolling
                    if (e.name !== 'AbortError') {
                        console.error("FeedItem: Playback failed", e);
                    }
                }
            };
            playVideo();
        } else {
            player.pause();
        }
    }, [isActive, isFocused, isPaused, player]);

    return (
        <>
            <VideoView
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                nativeControls={false}
                pointerEvents="none"
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
            <VideoView
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
                nativeControls={false}
                pointerEvents="none"
            />
        </>
    );
};

export const FeedItem = React.memo(({
    item,
    isActive,
    height,
    onLike,
    onComment,
    onSave,
    onMore,
}: FeedItemProps) => {
    const isFocused = useIsFocused();
    const [isPaused, setIsPaused] = React.useState(false);

    const togglePlayback = () => {
        setIsPaused(!isPaused);
    };

    return (
        <View style={[styles.container, { height }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={togglePlayback}>
                {(item.videoUrl || item.url) ? (
                    <InternalVideo
                        videoUrl={(item.videoUrl || item.url)}
                        isActive={isActive}
                        isFocused={isFocused}
                        isPaused={isPaused}
                    />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="videocam-off" size={48} color="rgba(255,255,255,0.15)" />
                        <Text style={{ color: 'rgba(255,255,255,0.3)', marginTop: 12, fontSize: 12, fontWeight: '600' }}>STREAM_UNAVAILABLE</Text>
                    </View>
                )}

                {isPaused && (
                    <View style={styles.pauseOverlay}>
                        <Ionicons name="pause" size={64} color="white" />
                    </View>
                )}
            </Pressable>

            {/* Simple fallback overlay */}
            <View style={styles.overlay} pointerEvents="box-none">
                <View style={styles.infoContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </View>
                <View style={styles.actionsContainer}>
                    <Pressable onPress={onLike} style={styles.actionButton}>
                        <Text style={[styles.customIcon, { color: item.isLiked ? '#D9E4FF' : '#FFF' }]}>✦</Text>
                        <Text style={styles.actionIconText}>{item.likes || 0}</Text>
                    </Pressable>

                    <Pressable onPress={onComment} style={styles.actionButton}>
                        <Ionicons name="chatbubble" size={24} color="#FFF" style={styles.plainIcon} />
                        <Text style={styles.actionIconText}>{item.comments || 0}</Text>
                    </Pressable>

                    <Pressable onPress={onSave} style={styles.actionButton}>
                        <Ionicons name="bookmark" size={24} color={item.isSaved ? '#D9E4FF' : '#FFF'} style={styles.plainIcon} />
                        <Text style={styles.actionIconText}>{item.saved || 0}</Text>
                    </Pressable>

                    <Pressable onPress={onMore} style={styles.actionButton}>
                        <Ionicons name="ellipsis-horizontal" size={24} color="#FFF" style={styles.plainIcon} />
                    </Pressable>
                </View>
            </View>
        </View>
    );
});

FeedItem.displayName = 'FeedItem';

const styles = StyleSheet.create({
    container: {
        width: Dimensions.get('window').width,
        backgroundColor: '#000',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
        padding: 20,
    },
    infoContainer: {
        marginBottom: 20,
        marginRight: 60,
    },
    title: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        color: '#FFF',
        fontSize: 14,
    },
    actionsContainer: {
        position: 'absolute',
        bottom: 20,
        right: 16,
        alignItems: 'center',
        gap: 16,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    customIcon: {
        fontSize: 26,
        lineHeight: 28,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    plainIcon: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 3,
    },
    pauseOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    actionIconText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
