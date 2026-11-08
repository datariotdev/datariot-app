import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../Theme/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = 12;
const ROW_GAP = 12;
const CONTAINER_PADDING = 16;
const GRID_WIDTH = SCREEN_WIDTH - (CONTAINER_PADDING * 2);
const COLUMN_WIDTH = (GRID_WIDTH - COLUMN_GAP) / 2;

interface BentoItemProps {
    id: string;
    title: string;
    subtitle?: string;
    type: 'video' | 'creator' | 'thought' | 'live';
    size: 'large' | 'medium' | 'small' | 'tall';
    image?: string;
    icon?: string;
    onPress: () => void;
    index: number;
}

const BentoItem: React.FC<BentoItemProps> = ({
    title,
    subtitle,
    type,
    size,
    image,
    icon,
    onPress,
    index
}) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const getDimensions = () => {
        switch (size) {
            case 'large':
                return { width: GRID_WIDTH, height: 200 };
            case 'tall':
                return { width: COLUMN_WIDTH, height: COLUMN_WIDTH * 1.8 };
            case 'medium':
                return { width: COLUMN_WIDTH, height: COLUMN_WIDTH };
            case 'small':
                return { width: (COLUMN_WIDTH - COLUMN_GAP) / 2, height: (COLUMN_WIDTH - COLUMN_GAP) / 2 };
            default:
                return { width: COLUMN_WIDTH, height: COLUMN_WIDTH };
        }
    };

    const dims = getDimensions();

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            style={[styles.item, { width: dims.width, height: dims.height }]}
        >
            <Pressable onPress={onPress} style={StyleSheet.absoluteFill}>
                {image ? (
                    <Image source={{ uri: image }} style={styles.backgroundImage} resizeMode="cover" />
                ) : (
                    <View style={[styles.fallbackBackground, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
                )}

                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                />

                <View style={styles.content}>
                    <View style={styles.typeBadge}>
                        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                        {type === 'live' && <View style={styles.liveDot} />}
                        <Text style={styles.typeText}>{type.toUpperCase()}</Text>
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={styles.title} numberOfLines={size === 'large' ? 2 : 1}>{title}</Text>
                        {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
                    </View>
                </View>

                {icon && (
                    <View style={styles.iconOverlay}>
                        <MaterialCommunityIcons name={icon as any} size={24} color="#FFF" />
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
};

interface BentoDiscoveryProps {
    items: any[];
    onItemPress: (item: any) => void;
}

export const BentoDiscovery: React.FC<BentoDiscoveryProps> = ({ items, onItemPress }) => {
    return (
        <View style={styles.grid}>
            {items.map((item, index) => (
                <BentoItem
                    key={item.id}
                    {...item}
                    index={index}
                    onPress={() => onItemPress(item)}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: COLUMN_GAP,
        padding: CONTAINER_PADDING,
    },
    item: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#111',
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
    },
    fallbackBackground: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 12,
    },
    typeBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF4466',
        marginRight: 6,
    },
    typeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    textContainer: {
        gap: 2,
    },
    title: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        fontWeight: '500',
    },
    iconOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    }
});
