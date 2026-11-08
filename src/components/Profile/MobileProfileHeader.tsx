import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Share, Platform, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../Theme/ThemeProvider';
import { supabase } from '../../lib/supabase/client';

type Profile = {
    username?: string; display_name?: string; avatar_url?: string | null; bio?: string | null;
    followers_count?: number; following_count?: number; videos_count?: number;
    arguments_count?: number; top_category?: string;
};
type Props = {
    profile: Profile | null; userId: string; fallbackName?: string; own?: boolean;
    activeTab: string; onTab: (tab: any) => void; onEdit?: () => void; onSettings?: () => void;
    onDNA?: () => void; onBack?: () => void; onFollow?: () => void; onMessage?: () => void;
    isFollowing?: boolean; followPending?: boolean;
};
const number = (value = 0) => value >= 1000000 ? `${(value / 1000000).toFixed(1).replace('.0', '')}M`
    : value >= 1000 ? `${(value / 1000).toFixed(1).replace('.0', '')}K` : value.toLocaleString();

async function shareProfile(id: string) {
    const url = `https://datariot.xyz/user/${encodeURIComponent(id)}`;
    try {
        if (Platform.OS === 'web') {
            if (navigator.share) await navigator.share({ title: 'Meet me on Datariot', url });
            else if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                return 'Link copied';
            } else Alert.alert('Profile link', url);
        } else await Share.share({ message: `Meet me on Datariot\n${url}` });
    } catch (error: any) {
        if (error?.name !== 'AbortError') Alert.alert('Couldn’t share', 'Please try again.');
    }
}

export function MobileProfileHeader({ profile, userId, fallbackName = 'Creator', own = false,
    activeTab, onTab, onEdit, onSettings, onDNA, onBack, onFollow, onMessage, isFollowing, followPending = false }: Props) {
    const { theme, mode } = useTheme();
    const insets = useSafeAreaInsets();
    const [shareStatus, setShareStatus] = useState('');
    const handleShare = async () => {
        const result = await shareProfile(userId);
        if (result) setShareStatus(result);
    };
    const [connections, setConnections] = useState<'followers' | 'following' | null>(null);
    const ink = theme.colors.text.primary;
    const muted = theme.colors.text.secondary;
    const accent = theme.colors.primary.DEFAULT;
    const line = theme.colors.surface.border;
    const name = profile?.display_name || fallbackName;
    const tabs = own ? ['videos', 'posts', 'saved'] : ['videos', 'posts'];
    return (
        <View style={{ backgroundColor: theme.colors.background.primary, paddingTop: insets.top }}>
            <View style={s.toolbar}>
                {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={s.iconButton}>
                    <Ionicons name="arrow-back" size={23} color={ink} />
                </Pressable> : <Text style={[s.wordmark, { color: ink }]}>datariot<Text style={{ color: muted }}> / you</Text></Text>}
                <View style={s.toolbarActions}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Share profile" onPress={handleShare} style={s.iconButton}>
                        <Ionicons name="share-outline" size={22} color={ink} />
                    </Pressable>
                    {onSettings && <Pressable accessibilityRole="button" accessibilityLabel="Profile settings" onPress={onSettings} style={s.iconButton}>
                        <Ionicons name="options-outline" size={23} color={ink} />
                    </Pressable>}
                </View>
            </View>
            <View style={s.content}>
                <View style={s.identity}>
                    <View style={[s.avatar, { backgroundColor: theme.colors.surface.elevated }]}>
                        {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={StyleSheet.absoluteFill} />
                            : <Text style={[s.initial, { color: accent }]}>{name[0]?.toUpperCase()}</Text>}
                    </View>
                    <View style={s.identityText}>
                        <Text numberOfLines={2} style={[s.name, { color: ink }]}>{name}</Text>
                        <Text numberOfLines={1} style={[s.handle, { color: muted }]}>@{profile?.username || fallbackName}</Text>
                        <View style={s.creatorLabel}><View style={[s.creatorDot, { backgroundColor: accent }]} /><Text style={[s.eyebrow, { color: muted }]}>DATARIOT CREATOR</Text></View>
                    </View>
                </View>
                {profile?.bio ? <Text style={[s.bio, { color: ink }]}>{profile.bio}</Text>
                    : own && <Pressable accessibilityRole="button" onPress={onEdit}><Text style={[s.bio, { color: muted }]}>Add a little about yourself ↗</Text></Pressable>}
                <View style={[s.stats, { borderColor: line }]}>
                    {(['followers', 'following', 'videos'] as const).map((stat, i) => <Pressable key={stat}
                        accessibilityRole={stat === 'videos' ? 'tab' : 'button'}
                        accessibilityLabel={`${profile?.[`${stat}_count`] || 0} ${stat}`}
                        onPress={() => stat === 'videos' ? onTab('videos') : setConnections(stat)}
                        style={[s.stat, i > 0 && { borderLeftWidth: 1, borderColor: line }]}>
                        <Text style={[s.statValue, { color: ink }]}>{number(profile?.[`${stat}_count`])}</Text>
                        <Text style={[s.statLabel, { color: muted }]}>{stat[0].toUpperCase() + stat.slice(1)}</Text>
                    </Pressable>)}
                </View>
                <View style={s.actions}>
                    <Pressable accessibilityRole="button" disabled={!own && followPending} accessibilityState={{ disabled: !own && followPending, busy: !own && followPending }} onPress={own ? onEdit : onFollow}
                        style={[s.primaryAction, { backgroundColor: accent }]}>
                        <Ionicons name={own ? 'create-outline' : isFollowing ? 'checkmark' : 'add'} size={18} color={mode === 'dark' ? '#08090D' : '#FFFFFF'} />
                        <Text style={[s.actionText, { color: mode === 'dark' ? '#08090D' : '#FFFFFF' }]}>{own ? 'Edit profile' : isFollowing ? 'Following' : 'Follow creator'}</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={own ? handleShare : onMessage}
                        style={[s.secondaryAction, { borderColor: theme.colors.surface.borderHover }]}>
                        <Ionicons name={own ? 'link-outline' : 'chatbubble-outline'} size={18} color={ink} />
                        <Text style={[s.actionText, { color: ink }]}>{own ? (shareStatus || 'Share') : 'Message'}</Text>
                    </Pressable>
                </View>
                {own && onDNA && <Pressable accessibilityRole="button" accessibilityLabel="Open Creator DNA" onPress={onDNA}
                    style={[s.dna, { backgroundColor: theme.colors.surface.elevated }]}>
                    <View style={[s.dnaIcon, { backgroundColor: mode === 'dark' ? 'rgba(217,228,255,0.08)' : 'rgba(76,110,245,0.07)' }]}>
                        <Ionicons name="finger-print-outline" size={26} color={accent} />
                    </View>
                    <View style={{ flex: 1 }}><Text style={[s.dnaTitle, { color: ink }]}>Your Creator DNA</Text>
                        <Text style={[s.dnaSubtitle, { color: muted }]}>{profile?.top_category || 'Your interests'} · {number(profile?.arguments_count)} arguments</Text></View>
                    <Ionicons name="arrow-forward" size={19} color={accent} />
                </Pressable>}
            </View>
            <View style={[s.tabs, { borderBottomColor: line }]}>
                {tabs.map(tab => <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab }}
                    onPress={() => onTab(tab)} style={[s.tab, { borderBottomColor: activeTab === tab ? accent : 'transparent' }]}>
                    <Ionicons name={tab === 'videos' ? 'grid-outline' : tab === 'posts' ? 'chatbubbles-outline' : 'bookmark-outline'} size={17} color={activeTab === tab ? ink : muted} />
                    <Text style={[s.tabText, { color: activeTab === tab ? ink : muted }]}>{tab === 'videos' ? 'Videos' : tab === 'posts' ? 'Theses' : 'Saved'}</Text>
                </Pressable>)}
            </View>
            <Connections visible={connections} userId={userId} onClose={() => setConnections(null)} />
        </View>
    );
}

function Connections({ visible, userId, onClose }: { visible: 'followers' | 'following' | null; userId: string; onClose: () => void }) {
    const { theme } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [people, setPeople] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        if (!visible) return;
        let alive = true;
        setLoading(true); setPeople([]); setError(false);
        (async () => {
            try {
                if (!supabase) throw new Error('Unavailable');
                const field = visible === 'followers' ? 'follower_id' : 'following_id';
                const { data: links, error: linkError } = await supabase.from('follows').select(field)
                    .eq(visible === 'followers' ? 'following_id' : 'follower_id', userId).limit(100);
                if (linkError) throw linkError;
                const ids = [...new Set((links || []).map((link: any) => link[field]))];
                if (!ids.length) return;
                const { data, error: profileError } = await supabase.from('profiles').select('id, username, display_name, avatar_url').in('id', ids);
                if (profileError) throw profileError;
                if (alive) setPeople(data || []);
            } catch { if (alive) setError(true); }
            finally { if (alive) setLoading(false); }
        })();
        return () => { alive = false; };
    }, [visible, userId, retry]);
    return <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={s.modalBackdrop}>
            <Pressable accessibilityLabel="Close connections" style={StyleSheet.absoluteFill} onPress={onClose} />
            <View style={[s.sheet, { backgroundColor: theme.colors.background.primary, paddingBottom: Math.max(insets.bottom, 20) }]}>
                <View style={s.sheetHeader}><Text style={[s.name, { color: theme.colors.text.primary }]}>{visible === 'followers' ? 'Followers' : 'Following'}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="Close connections" onPress={onClose} style={s.iconButton}><Ionicons name="close" size={24} color={theme.colors.text.primary} /></Pressable></View>
                {loading ? <ActivityIndicator style={{ padding: 32 }} color={theme.colors.primary.DEFAULT} />
                    : error ? <Pressable onPress={() => setRetry(value => value + 1)}><Text style={[s.bio, { color: theme.colors.text.secondary }]}>Couldn’t load people. Tap to retry.</Text></Pressable>
                    : <FlatList data={people} keyExtractor={person => person.id}
                        ListEmptyComponent={<Text style={[s.bio, { color: theme.colors.text.secondary }]}>{visible === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}</Text>}
                        ListFooterComponent={people.length >= 100 ? <Text style={{ color: theme.colors.text.secondary }}>Showing the first 100 people</Text> : null}
                        renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => { onClose(); router.push(`/user/${item.id}`); }} style={s.person}>
                            <View style={[s.personAvatar, { backgroundColor: theme.colors.surface.elevated }]}>{item.avatar_url && <Image source={{ uri: item.avatar_url }} style={StyleSheet.absoluteFill} />}</View>
                            <View style={{ flex: 1 }}><Text style={[s.actionText, { color: theme.colors.text.primary }]}>{item.display_name || item.username || 'Creator'}</Text><Text style={{ color: theme.colors.text.secondary }}>@{item.username || 'creator'}</Text></View>
                            <Ionicons name="chevron-forward" size={18} color={theme.colors.text.secondary} />
                        </Pressable>} />}
            </View>
        </View>
    </Modal>;
}
const s = StyleSheet.create({
    toolbar: { height: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    wordmark: { fontFamily: 'Outfit_700Bold', fontSize: 20, letterSpacing: -0.7 },
    toolbarActions: { flexDirection: 'row', gap: 4 }, iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    content: { paddingHorizontal: 20, paddingTop: 12 }, identity: { flexDirection: 'row', alignItems: 'center', gap: 17 },
    avatar: { width: 82, height: 88, borderRadius: 25, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    initial: { fontFamily: 'Outfit_600SemiBold', fontSize: 35 }, identityText: { flex: 1, minWidth: 0 },
    name: { fontFamily: 'Outfit_600SemiBold', fontSize: 25, letterSpacing: -0.7, lineHeight: 29 },
    handle: { fontFamily: 'Outfit_400Regular', fontSize: 14, marginTop: 4 },
    creatorLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }, creatorDot: { width: 4, height: 4, borderRadius: 2 },
    eyebrow: { fontFamily: 'Outfit_500Medium', fontSize: 9, letterSpacing: 1.1 },
    bio: { fontFamily: 'Outfit_400Regular', fontSize: 15, lineHeight: 22, marginTop: 18, marginBottom: 4 },
    stats: { flexDirection: 'row', paddingVertical: 16, marginTop: 16, borderTopWidth: 1, borderBottomWidth: 1 },
    stat: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
    statValue: { fontFamily: 'Outfit_600SemiBold', fontSize: 23, lineHeight: 27, letterSpacing: -0.6 },
    statLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 3 }, actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
    primaryAction: { flex: 1.5, minHeight: 46, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, paddingHorizontal: 10 },
    secondaryAction: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, paddingHorizontal: 10 },
    actionText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
    dna: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, marginTop: 18, marginBottom: 4 },
    dnaIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    dnaTitle: { fontFamily: 'Outfit_500Medium', fontSize: 15 }, dnaSubtitle: { fontFamily: 'Outfit_400Regular', fontSize: 12, marginTop: 4 },
    tabs: { flexDirection: 'row', marginTop: 18, borderBottomWidth: 1, paddingHorizontal: 12 },
    tab: { flex: 1, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderBottomWidth: 2 },
    tabText: { fontFamily: 'Outfit_500Medium', fontSize: 13 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
    sheet: { maxHeight: '80%', minHeight: 250, paddingHorizontal: 20, borderTopLeftRadius: 26, borderTopRightRadius: 26 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
    person: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12 }, personAvatar: { width: 44, height: 44, borderRadius: 15, overflow: 'hidden' },
});
