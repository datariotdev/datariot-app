import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Image as RNImage, Platform } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { supabase } from '../../lib/supabase/client';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../Theme/ThemeProvider';

export const RAIL_WIDTH = 78;
export const RAIL_WIDTH_EXPANDED = 250;

const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

interface NavEntry {
    key: string;
    code: string;
    label: string;
    path: string;
    icon: (color: string, size: number) => React.ReactNode;
    accent?: boolean;
}

const NAV: NavEntry[] = [
    {
        key: 'feed',
        code: '01',
        label: 'Feed',
        path: '/',
        icon: (c, s) => <Feather name="activity" size={s} color={c} />,
    },
    {
        key: 'discover',
        code: '02',
        label: 'Discover',
        path: '/discover',
        icon: (c, s) => <Ionicons name="planet-outline" size={s + 1} color={c} />,
    },
    {
        key: 'create',
        code: '03',
        label: 'Create',
        path: '/create',
        icon: (c, s) => <Feather name="plus-square" size={s} color={c} />,
    },
    {
        key: 'orvelis',
        code: '04',
        label: 'Orvelis AI',
        path: '/ai',
        icon: (c, s) => <MaterialCommunityIcons name="robot-outline" size={s} color={c} />,
    },
    {
        key: 'inbox',
        code: '05',
        label: 'Inbox',
        path: '/inbox',
        icon: (c, s) => <Feather name="message-circle" size={s} color={c} />,
    },
    {
        key: 'profile',
        code: '06',
        label: 'Profile',
        path: '/profile',
        icon: (c, s) => <Feather name="user" size={s} color={c} />,
    },
    {
        key: 'settings',
        code: '07',
        label: 'Settings',
        path: '/settings',
        icon: (c, s) => <Feather name="sliders" size={s} color={c} />,
    },
];

const RailItem = ({
    entry,
    isActive,
    expanded,
    onPress,
}: {
    entry: NavEntry;
    isActive: boolean;
    expanded: boolean;
    onPress: () => void;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const lit = isActive || isHovered;

    const iconColor = isActive
        ? theme.colors.primary.DEFAULT
        : isHovered
            ? theme.colors.text.primary
            : theme.colors.text.muted;

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            style={[
                styles.railItem,
                {
                    backgroundColor: isActive
                        ? (isDark ? 'rgba(217, 228, 255, 0.07)' : 'rgba(107, 127, 204, 0.09)')
                        : isHovered
                            ? (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.035)')
                            : 'transparent',
                    borderColor: isActive
                        ? (isDark ? 'rgba(217, 228, 255, 0.22)' : 'rgba(107, 127, 204, 0.28)')
                        : isHovered
                            ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)')
                            : 'transparent',
                },
            ]}
        >
            {/* Active edge bar — the rail's "selected channel" marker */}
            {isActive && (
                <LinearGradient
                    colors={isDark ? ['#D9E4FF', '#7DE2FF'] : ['#4C6EF5', '#6B7FCC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.activeEdge}
                />
            )}

            <View style={styles.railIconSlot}>
                {entry.icon(iconColor, 19)}
                {/* Corner ticks around the active glyph */}
                {isActive && (
                    <>
                        <View style={[styles.tick, styles.tickTL, { borderColor: theme.colors.primary.DEFAULT }]} />
                        <View style={[styles.tick, styles.tickBR, { borderColor: theme.colors.primary.DEFAULT }]} />
                    </>
                )}
            </View>

            {expanded && (
                <View style={styles.railLabelWrap}>
                    <Text
                        numberOfLines={1}
                        style={[
                            styles.railLabel,
                            {
                                color: lit ? theme.colors.text.primary : theme.colors.text.secondary,
                                fontFamily: MONO,
                            },
                        ]}
                    >
                        {entry.label.toUpperCase()}
                    </Text>
                    <Text style={[styles.railCode, { color: lit ? theme.colors.primary.DEFAULT : theme.colors.text.muted, fontFamily: MONO }]}>
                        {entry.code}
                    </Text>
                </View>
            )}
        </Pressable>
    );
};

export const WebSidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { theme, mode, toggleTheme } = useTheme();
    const isDark = mode === 'dark';
    const [likedVideos, setLikedVideos] = useState<any[]>([]);
    const [expanded, setExpanded] = useState(false);
    const [arenaHovered, setArenaHovered] = useState(false);
    const [isProfileHovered, setIsProfileHovered] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        router.replace('/auth/login');
    };

    const fetchLikedVideos = useCallback(async () => {
        if (!user) return;
        try {
            const { data: likes, error } = await supabase
                .from('likes')
                .select(`
                    video_id,
                    videos (
                        id,
                        title,
                        user_id,
                        s3_url,
                        url
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(3);

            if (error) throw error;

            const videos = (likes || []).map((item: any) => ({
                id: item.videos?.id,
                title: item.videos?.title || 'Untitled',
                url: item.videos?.url || item.videos?.s3_url,
            })).filter((v: { id: string }) => v.id);

            setLikedVideos(videos);
        } catch (err) {
            console.error('Error fetching liked videos for menu:', err);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchLikedVideos();
        }
    }, [user, fetchLikedVideos]);

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/' || pathname === '/index';
        return pathname.startsWith(path);
    };

    const arenaActive = isActive('/ai');

    return (
        <View
            // @ts-ignore — web hover props
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
            style={[
                styles.container,
                {
                    width: expanded ? RAIL_WIDTH_EXPANDED : RAIL_WIDTH,
                    backgroundColor: expanded
                        ? (isDark ? '#0B0C12' : '#FBFBFD')
                        : 'transparent',
                    borderRightColor: expanded
                        ? (isDark ? 'rgba(217, 228, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)')
                        : (isDark ? 'rgba(217, 228, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
                },
                expanded && styles.containerExpanded,
            ]}
        >
            {/* Logo mark */}
            <Pressable onPress={() => router.push('/')} style={[styles.logoRow, expanded && { paddingLeft: 18 }]}>
                <View style={styles.logoGlyph}>
                    <View style={[styles.logoHalo, { backgroundColor: isDark ? 'rgba(217, 228, 255, 0.14)' : 'rgba(107, 127, 204, 0.10)' }]} />
                    <RNImage source={require('../../../assets/logo.jpg')} style={{ width: 30, height: 30, borderRadius: 9 }} />
                </View>
                {expanded && (
                    <Text
                        numberOfLines={1}
                        style={[styles.logoText, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.brand }]}
                    >
                        DATARIOT
                    </Text>
                )}
            </Pressable>

            {/* Section marker */}
            <View style={styles.railDividerRow}>
                <View style={[styles.railDivider, { backgroundColor: isDark ? 'rgba(217, 228, 255, 0.10)' : 'rgba(0,0,0,0.08)' }]} />
                {expanded && (
                    <Text style={[styles.railGroupLabel, { color: theme.colors.text.muted, fontFamily: MONO }]}>NAV</Text>
                )}
            </View>

            <View style={styles.railList}>
                {NAV.map((entry) => (
                    <RailItem
                        key={entry.key}
                        entry={entry}
                        isActive={isActive(entry.path)}
                        expanded={expanded}
                        onPress={() => router.push(entry.path as any)}
                    />
                ))}
            </View>

            {/* Arena — the one high-voltage destination, styled apart */}
            <Pressable
                onPress={() => router.push('/ai')}
                onHoverIn={() => setArenaHovered(true)}
                onHoverOut={() => setArenaHovered(false)}
                style={[
                    styles.arenaButton,
                    {
                        borderColor: arenaActive || arenaHovered
                            ? theme.colors.primary.DEFAULT
                            : (isDark ? 'rgba(217, 228, 255, 0.22)' : 'rgba(107, 127, 204, 0.3)'),
                        backgroundColor: isDark ? 'rgba(217, 228, 255, 0.06)' : 'rgba(107, 127, 204, 0.07)',
                        shadowColor: isDark ? '#D9E4FF' : '#4C6EF5',
                        shadowOpacity: arenaActive || arenaHovered ? (isDark ? 0.35 : 0.2) : 0,
                        shadowRadius: 16,
                        shadowOffset: { width: 0, height: 0 },
                    },
                ]}
            >
                <MaterialCommunityIcons name="sword-cross" size={19} color={theme.colors.primary.DEFAULT} />
                {expanded && (
                    <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={[styles.arenaLabel, { color: theme.colors.primary.DEFAULT, fontFamily: MONO }]}>
                            ARENA
                        </Text>
                        <Text numberOfLines={1} style={[styles.arenaSub, { color: theme.colors.text.muted, fontFamily: MONO }]}>
                            BETA · LIVE
                        </Text>
                    </View>
                )}
                {expanded && <View style={[styles.arenaDot, { backgroundColor: '#34D399' }]} />}
            </Pressable>

            <View style={{ flex: 1 }} />

            {/* Recent videos — only worth the space when the rail is open */}
            {expanded && likedVideos.length > 0 && (
                <View style={styles.mediaSection}>
                    <Text style={[styles.railGroupLabel, { color: theme.colors.text.muted, fontFamily: MONO, marginBottom: 10, marginLeft: 18 }]}>
                        RECENT
                    </Text>
                    {likedVideos.map((video) => (
                        <Pressable
                            key={video.id}
                            style={[styles.mediaRow, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                            onPress={() => router.push({ pathname: '/video-player', params: { type: 'video', initialVideoId: video.id } })}
                        >
                            <View style={[styles.mediaDot, { backgroundColor: isDark ? 'rgba(217, 228, 255, 0.12)' : 'rgba(107, 127, 204, 0.12)' }]}>
                                <Feather name="play" size={9} color={theme.colors.primary.DEFAULT} />
                            </View>
                            <Text numberOfLines={1} style={[styles.mediaTitle, { color: theme.colors.text.secondary, fontFamily: MONO }]}>
                                {video.title.toUpperCase()}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            )}

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }]}>
                {user ? (
                    <>
                        <Pressable
                            onHoverIn={() => setIsProfileHovered(true)}
                            onHoverOut={() => setIsProfileHovered(false)}
                            onPress={() => router.push('/profile')}
                            style={[
                                styles.profileCard,
                                expanded && {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.03)',
                                    borderColor: isProfileHovered
                                        ? (isDark ? 'rgba(217, 228, 255, 0.25)' : 'rgba(107, 127, 204, 0.3)')
                                        : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                                    borderWidth: 1,
                                },
                            ]}
                        >
                            <LinearGradient
                                colors={isDark ? ['#D9E4FF', '#7DE2FF'] : ['#4C6EF5', '#7DA2FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.avatar}
                            >
                                <Text style={[styles.avatarText, { fontFamily: MONO }]}>
                                    {user.email?.[0].toUpperCase()}
                                </Text>
                            </LinearGradient>
                            {expanded && (
                                <View style={{ flex: 1 }}>
                                    <Text numberOfLines={1} style={[styles.profileName, { color: theme.colors.text.primary, fontFamily: MONO }]}>
                                        {(user.user_metadata?.username || 'User').toUpperCase()}
                                    </Text>
                                    <Text numberOfLines={1} style={[styles.profileHandle, { color: theme.colors.text.muted, fontFamily: MONO }]}>
                                        {`@${(user.user_metadata?.username || 'user').toLowerCase()}`}
                                    </Text>
                                </View>
                            )}
                        </Pressable>

                        {expanded && (
                            <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
                                <Text style={[styles.signOutText, { color: theme.colors.text.muted, fontFamily: MONO }]}>
                                    [ DISCONNECT ]
                                </Text>
                            </Pressable>
                        )}
                    </>
                ) : (
                    <Pressable
                        onPress={() => router.push('/auth/login')}
                        style={[styles.loginButton, { borderColor: theme.colors.primary.DEFAULT }]}
                    >
                        <Feather name="log-in" size={17} color={theme.colors.primary.DEFAULT} />
                        {expanded && (
                            <Text style={[styles.loginText, { color: theme.colors.primary.DEFAULT, fontFamily: MONO }]}>
                                [ CONNECT ]
                            </Text>
                        )}
                    </Pressable>
                )}

                {expanded && (
                    <View style={styles.socialRow}>
                        <Pressable onPress={() => window.open('https://twitter.com/datariot_xyz', '_blank')} style={styles.socialIcon}>
                            <FontAwesome5 name="twitter" size={13} color={theme.colors.text.muted} />
                        </Pressable>
                        <Pressable onPress={() => window.open('https://discord.gg/SKWCux4bb', '_blank')} style={styles.socialIcon}>
                            <FontAwesome5 name="discord" size={13} color={theme.colors.text.muted} />
                        </Pressable>
                        <Pressable onPress={() => window.open('https://instagram.com/datariot.xyz', '_blank')} style={styles.socialIcon}>
                            <FontAwesome5 name="instagram" size={13} color={theme.colors.text.muted} />
                        </Pressable>
                        <Pressable onPress={toggleTheme} style={styles.socialIcon}>
                            <Feather name={isDark ? 'sun' : 'moon'} size={13} color={theme.colors.primary.DEFAULT} />
                        </Pressable>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        paddingTop: 22,
        paddingBottom: 20,
        paddingHorizontal: 12,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        borderRightWidth: 1,
        // @ts-ignore — web transition
        transition: 'width 0.26s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.26s ease',
        overflow: 'hidden',
    },
    containerExpanded: {
        shadowColor: '#000',
        shadowOffset: { width: 12, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 40,
    },
    logoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        height: 44,
        paddingLeft: 5,
        marginBottom: 18,
    },
    logoGlyph: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoHalo: {
        position: 'absolute',
        width: 46,
        height: 46,
        borderRadius: 23,
    },
    logoText: {
        fontSize: 13,
        letterSpacing: 2.6,
    },
    railDividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
        paddingHorizontal: 6,
    },
    railDivider: {
        height: 1,
        flex: 1,
    },
    railGroupLabel: {
        fontSize: 9,
        letterSpacing: 2.2,
    },
    railList: {
        gap: 4,
    },
    railItem: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 46,
        paddingLeft: 5,
        gap: 14,
        borderRadius: 10,
        borderWidth: 1,
        position: 'relative',
        // @ts-ignore
        transition: 'background-color 0.18s ease, border-color 0.18s ease',
    },
    activeEdge: {
        position: 'absolute',
        left: -12,
        top: 9,
        bottom: 9,
        width: 3,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
    },
    railIconSlot: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    tick: {
        position: 'absolute',
        width: 7,
        height: 7,
        borderWidth: 1,
    },
    tickTL: {
        top: 5,
        left: 5,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    tickBR: {
        bottom: 5,
        right: 5,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    railLabelWrap: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 12,
    },
    railLabel: {
        fontSize: 12,
        letterSpacing: 1.4,
    },
    railCode: {
        fontSize: 9,
        letterSpacing: 1,
        opacity: 0.8,
    },
    arenaButton: {
        marginTop: 16,
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingLeft: 17,
        paddingRight: 14,
        borderRadius: 10,
        borderWidth: 1,
        // @ts-ignore
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    },
    arenaLabel: {
        fontSize: 12,
        letterSpacing: 1.8,
    },
    arenaSub: {
        fontSize: 8.5,
        letterSpacing: 1.2,
        marginTop: 2,
    },
    arenaDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    mediaSection: {
        marginBottom: 18,
        gap: 4,
    },
    mediaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 7,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
    },
    mediaDot: {
        width: 20,
        height: 20,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mediaTitle: {
        fontSize: 9.5,
        letterSpacing: 0.8,
        flex: 1,
    },
    footer: {
        borderTopWidth: 1,
        paddingTop: 14,
        gap: 10,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 7,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        // @ts-ignore
        cursor: 'pointer',
        // @ts-ignore
        transition: 'border-color 0.2s ease',
    },
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#000000',
        fontSize: 14,
        fontWeight: '800',
    },
    profileName: {
        fontSize: 11.5,
        letterSpacing: 0.6,
    },
    profileHandle: {
        fontSize: 9.5,
        marginTop: 2,
    },
    signOutBtn: {
        alignItems: 'center',
        paddingVertical: 4,
    },
    signOutText: {
        fontSize: 9.5,
        letterSpacing: 1.2,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
    },
    loginText: {
        fontSize: 11.5,
        letterSpacing: 1.4,
        fontWeight: '700',
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 18,
    },
    socialIcon: {
        padding: 4,
        opacity: 0.7,
        // @ts-ignore
        transition: 'opacity 0.2s ease',
    },
});
