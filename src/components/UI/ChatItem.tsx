import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme as baseTheme } from '../../design-system/theme';
import { useTheme } from '../Theme/ThemeProvider';

interface ChatItemProps {
    id: string;
    name: string;
    message: string;
    time: string;
    unreadCount?: number;
    isAi?: boolean;
    isTyping?: boolean;
    onPress: () => void;
}

export function ChatItem({
    name,
    message,
    time,
    unreadCount = 0,
    isAi = false,
    isTyping = false,
    onPress
}: ChatItemProps) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const renderContent = () => (
        <>
            <View style={[
                styles.avatarContainer,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
                isAi && [styles.aiAvatarContainer, { backgroundColor: '#FFFFFF' }]
            ]}>
                {isAi ? (
                    <MaterialCommunityIcons name="robot-excited" size={24} color="#0EA5E9" />
                ) : (
                    <Text style={[styles.avatarText, { color: theme.colors.text.primary }]}>{name.charAt(0)}</Text>
                )}
                {isAi && <View style={[styles.onlineBadge, { borderColor: theme.colors.background.primary, backgroundColor: '#10B981' }]} />}
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <Text style={[
                        styles.name,
                        { color: theme.colors.text.primary },
                        isAi && [styles.aiName, { color: theme.colors.primary.DEFAULT }]
                    ]}>
                        {name} {isAi && <Ionicons name="checkmark-circle" size={14} color={theme.colors.primary.DEFAULT} />}
                    </Text>
                    <Text style={[styles.time, { color: unreadCount > 0 ? theme.colors.primary.DEFAULT : theme.colors.text.muted }]}>
                        {time}
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={[
                        styles.message,
                        { color: theme.colors.text.secondary },
                        isAi && [styles.aiMessage, { color: theme.colors.primary.light }],
                        unreadCount > 0 && [styles.unreadMessage, { color: theme.colors.text.primary }]
                    ]} numberOfLines={2}>
                        {isTyping ? 'Thinking...' : message}
                    </Text>

                    {unreadCount > 0 && (
                        <LinearGradient
                            colors={['#D9E4FF', '#D9E4FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.badge}
                        >
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </LinearGradient>
                    )}
                </View>
            </View>
        </>
    );

    if (isAi) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.outerAiContainer}>
                <LinearGradient
                    colors={['rgba(217, 228, 255, 0.5)', 'rgba(217, 228, 255, 0.5)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.aiBorder}
                >
                    <View style={[styles.container, styles.innerAiContainer, { backgroundColor: isDark ? 'rgba(30,30,40,0.95)' : 'rgba(255,255,255,0.95)' }]}>
                        {renderContent()}
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.02)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.05)'
                }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {renderContent()}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    outerAiContainer: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 24,
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    aiBorder: {
        borderRadius: 24,
        padding: 1, // 1px border
    },
    innerAiContainer: {
        marginHorizontal: 0,
        marginBottom: 0,
        borderWidth: 0,
        shadowOpacity: 0,
        elevation: 0,
    },
    avatarContainer: {
        width: 52,
        height: 52,
        borderRadius: 4, // Modular modular look
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    aiAvatarContainer: {
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: '#0EA5E9',
    },
    avatarText: {
        fontSize: 20,
        fontFamily: baseTheme.typography.fontFamilies.bold,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    name: {
        fontSize: 16,
        fontFamily: baseTheme.typography.fontFamilies.bold,
        letterSpacing: -0.3,
    },
    aiName: {
        letterSpacing: 0.5,
    },
    time: {
        fontSize: 12,
        fontFamily: baseTheme.typography.fontFamilies.medium,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    message: {
        fontSize: 14,
        fontFamily: baseTheme.typography.fontFamilies.regular,
        flex: 1,
        marginRight: 16,
        lineHeight: 20,
    },
    aiMessage: {
        fontStyle: 'italic',
    },
    unreadMessage: {
        fontWeight: 'bold',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 2,
        minWidth: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontFamily: baseTheme.typography.fontFamilies.bold,
    },
});
