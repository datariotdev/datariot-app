import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../components/Theme/ThemeProvider';

interface TopicItem {
    id: string;
    label: string;
    description: string;
    icon: string;
}

interface TrendingTopicsProps {
    onItemPress: (id: string) => void;
}

export const TrendingTopics: React.FC<TrendingTopicsProps> = ({ onItemPress }) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const topics: TopicItem[] = [
        {
            id: 'crisis',
            label: 'Global Resource Crisis',
            description: 'Resource management and ethics',
            icon: 'earth'
        },
        {
            id: 'mars',
            label: 'Mars Colony in 2040',
            description: 'Interplanetary logistics and law',
            icon: 'rocket'
        },
        {
            id: 'bitcoin',
            label: 'Bitcoin vs Traditional Finance',
            description: 'The future of decentralized assets',
            icon: 'currency-btc'
        },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.headerText, { color: theme.colors.text.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>[ TRENDING.TOPICS ]</Text>
            </View>

            <View style={styles.list}>
                {topics.map((topic) => (
                    <Pressable
                        key={topic.id}
                        style={[styles.item, {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
                        }]}
                        onPress={() => onItemPress(topic.id)}
                    >
                        <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }]}>
                            <MaterialCommunityIcons
                                name={topic.icon as any}
                                size={22}
                                color={theme.colors.primary.DEFAULT}
                            />
                        </View>
                        <View style={styles.content}>
                            <Text style={[styles.label, { color: theme.colors.text.primary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>{topic.label.toUpperCase()}</Text>
                            <Text style={[styles.description, { color: theme.colors.text.muted, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>{topic.description.toUpperCase()}</Text>
                        </View>
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={18}
                            color={theme.colors.text.muted}
                        />
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        paddingVertical: 12,
    },
    header: {
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    headerText: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 2,
    },
    list: {
        gap: 12,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        marginLeft: 16,
    },
    label: {
        fontSize: 15,
        fontWeight: '800',
    },
    description: {
        fontSize: 12,
        marginTop: 2,
    },
});
