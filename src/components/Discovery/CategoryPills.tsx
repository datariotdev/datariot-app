import React from 'react';
import { ScrollView, Text, StyleSheet, Pressable, View, Platform } from 'react-native';
import { useTheme } from '../Theme/ThemeProvider';

const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

interface CategoryPillsProps {
    categories: string[];
    activeCategory: string | null;
    onCategoryPress: (category: string) => void;
}

export const CategoryPills = ({ categories, activeCategory, onCategoryPress }: CategoryPillsProps) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scrollStyle}
            contentContainerStyle={styles.container}
        >
            <Text style={[styles.gutterLabel, { color: theme.colors.text.muted, fontFamily: MONO }]}>FILTER //</Text>
            {categories.map((category) => (
                <Chip
                    key={category}
                    category={category}
                    isActive={activeCategory === category}
                    isDark={isDark}
                    theme={theme}
                    onPress={() => onCategoryPress(category)}
                />
            ))}
        </ScrollView>
    );
};

const Chip = ({
    category,
    isActive,
    isDark,
    theme,
    onPress,
}: {
    category: string;
    isActive: boolean;
    isDark: boolean;
    theme: any;
    onPress: () => void;
}) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const accent = theme.colors.primary.DEFAULT;

    return (
        <Pressable
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            onPress={onPress}
            style={[
                styles.chip,
                {
                    borderColor: isActive
                        ? accent
                        : isHovered
                            ? (isDark ? 'rgba(217, 228, 255, 0.3)' : 'rgba(76, 110, 245, 0.35)')
                            : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'),
                    backgroundColor: isActive
                        ? (isDark ? 'rgba(217, 228, 255, 0.12)' : 'rgba(76, 110, 245, 0.10)')
                        : isHovered
                            ? (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.035)')
                            : 'transparent',
                },
                isActive && {
                    shadowColor: isDark ? '#D9E4FF' : '#4C6EF5',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: isDark ? 0.3 : 0.15,
                    shadowRadius: 12,
                },
            ]}
        >
            {/* Corner tick — active chips get a machined notch */}
            {isActive && <View style={[styles.chipTick, { borderColor: accent }]} pointerEvents="none" />}

            <Text
                allowFontScaling={false}
                style={[
                    styles.text,
                    {
                        color: isActive
                            ? accent
                            : isHovered
                                ? theme.colors.text.primary
                                : theme.colors.text.secondary,
                        fontFamily: MONO,
                    },
                ]}
            >
                {category.toUpperCase()}
            </Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    scrollStyle: {
        flex: 1,
        width: '100%',
    },
    container: {
        paddingHorizontal: 16,
        gap: 8,
        paddingTop: 8,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    gutterLabel: {
        fontSize: 9,
        letterSpacing: 1.8,
        marginRight: 4,
        opacity: 0.8,
    },
    chip: {
        height: 30,
        paddingHorizontal: 14,
        borderRadius: 6,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        // @ts-ignore
        transition: 'all 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
    },
    chipTick: {
        position: 'absolute',
        top: -1,
        left: -1,
        width: 7,
        height: 7,
        borderWidth: 1.5,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: 6,
    },
    text: {
        fontSize: 9.5,
        fontWeight: '700',
        letterSpacing: 1.4,
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
});
