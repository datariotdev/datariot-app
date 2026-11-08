import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../../design-system/theme';

interface Topic {
    id: string;
    label: string;
    pulse: number; // 0-100
    color?: string;
}

interface TopicClustersProps {
    topics: Topic[];
    onTopicPress: (topicId: string) => void;
}

export const TopicClusters: React.FC<TopicClustersProps> = ({ topics, onTopicPress }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>TOPIC CLUSTERS</Text>
                <View style={styles.pulseIndicator}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.pulseText}>ACTIVE_PULSE</Text>
                </View>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.gridContainer}>
                    {/* Top Row */}
                    <View style={styles.row}>
                        {topics.slice(0, 4).map((topic) => (
                            <TopicItem
                                key={topic.id}
                                topic={topic}
                                onPress={() => onTopicPress(topic.id)}
                            />
                        ))}
                    </View>
                    {/* Bottom Row (Offset) */}
                    <View style={[styles.row, { marginLeft: 20 }]}>
                        {topics.slice(4, 9).map((topic) => (
                            <TopicItem
                                key={topic.id}
                                topic={topic}
                                onPress={() => onTopicPress(topic.id)}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const TopicItem = ({ topic, onPress }: { topic: Topic, onPress: () => void }) => {
    const pulseWidth = Math.max(30, topic.pulse);

    return (
        <Pressable onPress={onPress} style={styles.topicCard}>
            <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.topicLabel}>{topic.label}</Text>
            <View style={styles.pulseBarContainer}>
                <View style={[styles.pulseBar, { width: `${pulseWidth}%`, backgroundColor: topic.color || theme.colors.primary.DEFAULT }]} />
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    title: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    pulseIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary.light,
    },
    pulseText: {
        color: theme.colors.primary.light,
        fontSize: 10,
        fontWeight: '800',
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    gridContainer: {
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    topicCard: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        minWidth: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    topicLabel: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
    },
    pulseBarContainer: {
        height: 2,
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 1,
        overflow: 'hidden',
    },
    pulseBar: {
        height: '100%',
    },
});
