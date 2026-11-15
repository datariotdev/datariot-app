import React from 'react';
import { Pressable, StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../Theme/ThemeProvider';
import { useNotifications } from './NotificationsProvider';

export function NotificationBellIcon({ color, size = 22 }: { color: string; size?: number }) {
    const { unreadCount } = useNotifications();
    const { theme } = useTheme();
    return (
        <View style={{ width: size, height: size }}>
            <Ionicons name="notifications-outline" size={size} color={color} />
            {unreadCount > 0 && <View style={[styles.badge, { backgroundColor: theme.colors.primary.DEFAULT }]}>
                <Text style={[styles.count, { color: theme.colors.background.primary }]}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>}
        </View>
    );
}

export function NotificationBell({ style }: { style?: StyleProp<ViewStyle> }) {
    const { unreadCount } = useNotifications();
    const { theme, mode } = useTheme();
    const router = useRouter();
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            onPress={() => router.push('/notifications')}
            style={[styles.button, { backgroundColor: mode === 'dark' ? 'rgba(8,9,13,0.65)' : 'rgba(255,255,255,0.9)',
                borderColor: theme.colors.surface.border }, style]}
        >
            <NotificationBellIcon color={theme.colors.text.primary} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    badge: { position: 'absolute', top: -7, right: -9, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
    count: { fontSize: 9, fontWeight: '800' },
});
