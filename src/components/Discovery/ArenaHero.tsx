import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { theme } from '../../design-system/theme';

interface ArenaHeroProps {
    debate: {
        id: string;
        title: string;
        participants: { username: string; avatarUrl: string; side: 'PRO' | 'CON' }[];
        viewers: number;
        logicPoints: number;
        category: string;
    };
    onPress: () => void;
}

export const ArenaHero: React.FC<ArenaHeroProps> = ({ debate, onPress }) => {
    const { width } = useWindowDimensions();
    const pulse = useSharedValue(1);

    React.useEffect(() => {
        pulse.value = withRepeat(withTiming(1.1, { duration: 1000 }), -1, true);
    }, []);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
        opacity: interpolate(pulse.value, [1, 1.1], [0.8, 1]),
    }));

    return (
        <Animated.View
            entering={FadeInDown.duration(800)}
            style={[styles.container, { width: width - 32 }]}
        >
            <Pressable onPress={onPress} style={styles.content}>
                <LinearGradient
                    colors={['#D9E4FF', '#000814']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                <View style={[styles.glow, { shadowColor: theme.colors.primary.DEFAULT }]} />

                <View style={styles.header}>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{debate.category.toUpperCase()}</Text>
                    </View>
                    <View style={styles.liveContainer}>
                        <Animated.View style={[styles.liveDot, pulseStyle]} />
                        <Text style={styles.liveText}>ARENA_BETA</Text>
                    </View>
                </View>

                <Text style={styles.title}>{debate.title}</Text>

                <View style={styles.arenaVSSystem}>
                    <View style={styles.participant}>
                        <Image source={{ uri: debate.participants[0].avatarUrl }} style={styles.avatar} />
                        <View style={[styles.sideBadge, { backgroundColor: theme.colors.primary.DEFAULT }]}>
                            <Text style={styles.sideText}>PRO</Text>
                        </View>
                    </View>

                    <View style={styles.vsContainer}>
                        <Text style={styles.vsText}>VS</Text>
                    </View>

                    <View style={styles.participant}>
                        <Image source={{ uri: debate.participants[1].avatarUrl }} style={styles.avatar} />
                        <View style={[styles.sideBadge, { backgroundColor: '#FF4466' }]}>
                            <Text style={styles.sideText}>CON</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Ionicons name="people" size={14} color="rgba(255,255,255,0.6)" />
                            <Text style={styles.statValue}>{debate.viewers.toLocaleString()}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name="molecule" size={14} color={theme.colors.primary.light} />
                            <Text style={styles.statValue}>{debate.logicPoints} LOGIC</Text>
                        </View>
                    </View>

                    <Pressable style={styles.enterButton} onPress={onPress}>
                        <Text style={styles.enterButtonText}>VIEW ARENA (BETA)</Text>
                        <Ionicons name="flash" size={16} color="#000" />
                    </Pressable>
                </View>

                <View style={styles.decorationIcons}>
                    <MaterialCommunityIcons name="shield-sword" size={120} color="rgba(255,255,255,0.03)" />
                </View>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 320,
        marginHorizontal: 16,
        borderRadius: 32,
        overflow: 'hidden',
        ...theme.shadows.lg,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'space-between',
    },
    glow: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.2,
        shadowRadius: 100,
        shadowOpacity: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    categoryText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
    },
    liveContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00FF88',
    },
    liveText: {
        color: '#00FF88',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    title: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
        lineHeight: 30,
        textAlign: 'center',
        marginTop: 12,
    },
    arenaVSSystem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        marginVertical: 16,
    },
    participant: {
        alignItems: 'center',
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    sideBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: -10,
    },
    sideText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    },
    vsContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    vsText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: '900',
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '700',
    },
    enterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary.light,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
        ...theme.shadows.sm,
    },
    enterButtonText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '900',
    },
    decorationIcons: {
        position: 'absolute',
        bottom: -20,
        left: -20,
        opacity: 0.5,
    },
});
