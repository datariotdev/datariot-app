import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../Theme/ThemeProvider';
import type { SearchProfile } from '../../lib/supabase/searchUsers';

function SearchAvatar({ profile }: { profile: SearchProfile }) {
    const { theme } = useTheme();
    const [failed, setFailed] = useState(false);
    const name = profile.display_name || profile.nickname || profile.username;
    return (
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary.DEFAULT }]}>
            {profile.avatar_url && !failed ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.image} onError={() => setFailed(true)} />
            ) : (
                <Text style={{ color: theme.colors.background.primary, fontSize: 18 }}>{name.charAt(0).toUpperCase()}</Text>
            )}
        </View>
    );
}

interface Props {
    users: SearchProfile[];
    loading: boolean;
    error: string | null;
    onRetry: () => void;
}

export function UserSearchResults({ users, loading, error, onRetry }: Props) {
    const { theme } = useTheme();
    const router = useRouter();
    return (
        <View style={styles.container}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text.primary }]}>Users</Text>
            {loading ? (
                <ActivityIndicator accessibilityLabel="Searching users" color={theme.colors.primary.DEFAULT} />
            ) : error ? (
                <View>
                    <Text accessibilityRole="alert" style={{ color: theme.colors.text.secondary }}>{error}</Text>
                    <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
                        <Text style={{ color: theme.colors.text.primary }}>Try again</Text>
                    </Pressable>
                </View>
            ) : users.length === 0 ? (
                <Text style={{ color: theme.colors.text.muted }}>No users found.</Text>
            ) : users.map(profile => (
                <Pressable
                    key={profile.id}
                    accessibilityRole="button"
                    accessibilityLabel={`View @${profile.username} profile`}
                    onPress={() => router.push({ pathname: '/user/[id]', params: { id: profile.id } })}
                    style={styles.row}
                >
                    <SearchAvatar key={profile.avatar_url} profile={profile} />
                    <View style={styles.info}>
                        <Text numberOfLines={1} style={[styles.name, { color: theme.colors.text.primary }]}>
                            {profile.display_name || profile.nickname || profile.username}
                        </Text>
                        <Text numberOfLines={1} style={{ color: theme.colors.text.secondary }}>@{profile.username}</Text>
                    </View>
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { paddingHorizontal: 24, paddingVertical: 12 },
    title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, minHeight: 64 },
    avatar: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    image: { width: 48, height: 48 },
    info: { flex: 1, minWidth: 0, gap: 2 },
    name: { fontSize: 16, fontWeight: '600' },
    retry: { paddingVertical: 12, alignSelf: 'flex-start' },
});
