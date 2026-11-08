import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../design-system/theme';

interface LiveItem {
    id: string;
    type: 'debate' | 'stream';
    title: string;
    participants: number;
    thumbnailUrl: string;
    creator: string;
}

interface LivePulseProps {
    items: LiveItem[];
    onItemPress: (item: LiveItem) => void;
}

export const LivePulse: React.FC<LivePulseProps> = ({ items, onItemPress }) => {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                snapToInterval={280 + 16}
                decelerationRate="fast"
            >
                {items.map((item) => (
                    <Pressable
                        key={item.id}
                        style={styles.card}
                        onPress={() => onItemPress(item)}
                    >
                        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />

                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE</Text>
                        </View>

                        <BlurView intensity={20} tint="dark" style={styles.infoOverlay}>
                            <Text style={styles.creator}>@{item.creator}</Text>
                            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>

                            <View style={styles.statsRow}>
                                <Ionicons
                                    name={item.type === 'debate' ? 'people' : 'eye'}
                                    size={14}
                                    color={theme.colors.primary.light}
                                />
                                <Text style={styles.statsText}>
                                    {item.participants} {item.type === 'debate' ? 'debating' : 'watching'}
                                </Text>
                            </View>
                        </BlurView>

                        {item.type === 'debate' && (
                            <View style={styles.debateTag}>
                                <Ionicons name="mic" size={12} color="#FFF" />
                                <Text style={styles.debateTagText}>DEBATE</Text>
                            </View>
                        )}
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 16,
    },
    card: {
        width: 280,
        height: 180,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: theme.colors.background.secondary,
    },
    thumbnail: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.7,
    },
    liveBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.error,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 4,
        zIndex: 2,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFF',
    },
    liveText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    },
    infoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    creator: {
        color: theme.colors.primary.light,
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
    },
    title: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 20,
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statsText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '600',
    },
    debateTag: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    debateTagText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
    },
});
