import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { DockModule, MONO, useDockSurface } from './Dock/DockModule';
import { PilotStatus, Objective } from './Dock/PilotStatus';
import { SignalTile } from './Dock/SignalTile';

/* ------------------------------------------------------------------------- *
 * PLACEHOLDER DATA
 * Everything below is display-only and needs wiring to real sources:
 *   pilot stats  -> profiles / ratings table
 *   objectives   -> daily quest state
 *   signal series-> hourly view or event counts for the last 24h
 *   trending     -> an aggregate query, same one /discover should use
 * Each is a plain value so swapping in a hook is a one-line change.
 * ------------------------------------------------------------------------- */

const PILOT_TIER = 'Silver';
const PILOT_ELO = 1000;
const PILOT_ELO_TO_NEXT = 100;
const PILOT_TIER_SPAN = 400;
const PILOT_STREAK_DAYS = 8;

const OBJECTIVES: Objective[] = [
    { id: 'vote', label: 'Vote in 3 debates', done: 1, total: 3 },
    { id: 'argue', label: 'Post 1 argument', done: 1, total: 1 },
    { id: 'streak', label: 'Keep the streak alive', done: 0, total: 1 },
];

/** 24 hourly buckets, oldest first. */
const SIGNAL_SERIES = [
    380, 410, 340, 300, 270, 250, 290, 360,
    520, 640, 700, 660, 720, 810, 780, 690,
    740, 880, 960, 1040, 1180, 1120, 1260, 1340,
];
const SIGNAL_TOTAL = SIGNAL_SERIES.reduce((a, b) => a + b, 0);
const SIGNAL_DELTA_PCT = 18;

const TRENDING = [
    { icon: 'music' as const, title: 'Music of the Week', views: '2.3M', delta: 14 },
    { icon: 'smile' as const, title: 'Best Memes', views: '1.8M', delta: 8 },
    { icon: 'zap' as const, title: 'Aesthetic Design', views: '945K', delta: -3 },
];

export const WebRightPanel = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const { theme, isDark, accent, cardBg, cardBorder } = useDockSurface();

    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    // Make the "/" hint real — it's a shortcut, not decoration.
    useEffect(() => {
        if (Platform.OS !== 'web' || typeof document === 'undefined') return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
            const el = document.activeElement as HTMLElement | null;
            const tag = el?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return;
            e.preventDefault();
            inputRef.current?.focus();
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, []);

    const callsign = user ? (user.user_metadata?.username || user.email?.split('@')[0] || 'pilot') : null;

    const bucketLabel = useMemo(
        () => (i: number, total: number) => {
            const hoursAgo = total - 1 - i;
            return hoursAgo === 0 ? 'NOW' : `-${hoursAgo}H`;
        },
        []
    );

    return (
        <View style={styles.container}>
            {/* Terminal-prompt search */}
            <View
                style={[
                    styles.searchContainer,
                    {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.025)',
                        borderColor: isSearchFocused ? accent : cardBorder,
                    },
                    isSearchFocused && {
                        shadowColor: isDark ? '#D9E4FF' : '#4C6EF5',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: isDark ? 0.25 : 0.12,
                        shadowRadius: 16,
                    },
                ]}
            >
                <Text style={[styles.prompt, { color: isSearchFocused ? accent : theme.colors.text.muted, fontFamily: MONO }]}>
                    &gt;
                </Text>
                <TextInput
                    ref={inputRef}
                    style={[
                        styles.searchInput,
                        { color: theme.colors.text.primary, fontFamily: MONO },
                        // web-only: kill the browser focus ring, we draw our own
                        { outlineStyle: 'none' } as any,
                    ]}
                    placeholder="SEARCH THE ARENA"
                    placeholderTextColor={theme.colors.text.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    returnKeyType="search"
                />
                {!isSearchFocused && (
                    <View style={[styles.keyHint, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }]}>
                        <Text style={[styles.keyHintText, { color: theme.colors.text.muted, fontFamily: MONO }]}>/</Text>
                    </View>
                )}
            </View>

            {/* Pilot */}
            <DockModule
                title="PILOT"
                right={
                    user ? (
                        <Pressable onPress={() => router.push('/profile')} style={styles.seeAllWrapper}>
                            <Text style={[styles.seeAll, { color: accent, fontFamily: MONO }]}>PROFILE</Text>
                            <Feather name="arrow-up-right" size={11} color={accent} />
                        </Pressable>
                    ) : undefined
                }
            >
                <PilotStatus
                    callsign={callsign}
                    tier={PILOT_TIER}
                    elo={PILOT_ELO}
                    eloToNext={PILOT_ELO_TO_NEXT}
                    tierSpan={PILOT_TIER_SPAN}
                    streakDays={PILOT_STREAK_DAYS}
                    objectives={OBJECTIVES}
                />
            </DockModule>

            {/* Platform activity */}
            <DockModule
                title="SIGNAL"
                right={
                    <Text style={[styles.moduleMeta, { color: theme.colors.text.muted, fontFamily: MONO }]}>24H</Text>
                }
            >
                <SignalTile
                    label="Arena activity"
                    value={SIGNAL_TOTAL}
                    deltaPct={SIGNAL_DELTA_PCT}
                    deltaPeriod="vs yesterday"
                    series={SIGNAL_SERIES}
                    startLabel="-24H"
                    endLabel="NOW"
                    bucketLabel={bucketLabel}
                />
            </DockModule>

            {/* Trending */}
            <DockModule
                title="TRENDING"
                right={
                    <Pressable onPress={() => router.push('/discover')} style={styles.seeAllWrapper}>
                        <Text style={[styles.seeAll, { color: accent, fontFamily: MONO }]}>ALL</Text>
                        <Feather name="arrow-up-right" size={11} color={accent} />
                    </Pressable>
                }
            >
                <View style={styles.collectionsList}>
                    {TRENDING.map((t, i) => (
                        <CollectionItem
                            key={t.title}
                            index={i + 1}
                            iconName={t.icon}
                            title={t.title}
                            views={t.views}
                            delta={t.delta}
                        />
                    ))}
                </View>
            </DockModule>

            {/* Weekly mission */}
            <DockModule
                title="MISSION"
                right={
                    <View style={styles.liveIndicatorContainer}>
                        <View style={styles.liveDotWrapper}>
                            <View style={styles.liveDot} />
                            {Platform.OS === 'web' ? (
                                /* @ts-ignore web-only element */
                                <div
                                    className="status-pulse-anim"
                                    style={{
                                        position: 'absolute',
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: 'rgba(239, 68, 68, 0.5)',
                                    }}
                                />
                            ) : null}
                        </View>
                        <Text style={[styles.liveText, { fontFamily: MONO }]}>LIVE</Text>
                    </View>
                }
            >
                <View style={[styles.challengeCard, { borderColor: isDark ? 'rgba(217, 228, 255, 0.14)' : 'rgba(76, 110, 245, 0.2)', backgroundColor: cardBg }]}>
                    <View style={[styles.cardBracket, styles.cbTL, { borderColor: accent }]} pointerEvents="none" />
                    <View style={[styles.cardBracket, styles.cbBR, { borderColor: accent }]} pointerEvents="none" />

                    <LinearGradient
                        colors={isDark ? ['rgba(217, 228, 255, 0.09)', 'transparent'] : ['rgba(76, 110, 245, 0.07)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                        pointerEvents="none"
                    />

                    <View style={styles.challengeHeaderRow}>
                        <Text style={[styles.topBadgeText, { color: theme.colors.text.muted, fontFamily: MONO }]}>
                            WEEKLY.ARENA
                        </Text>
                        <View style={styles.prizeRow}>
                            <MaterialCommunityIcons name="lightning-bolt" size={12} color={accent} />
                            <Text style={[styles.prizePool, { color: accent, fontFamily: MONO }]}>5,000 XP</Text>
                        </View>
                    </View>

                    <Text style={[styles.challengeTitle, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]} numberOfLines={1}>
                        SLOW MOTION
                    </Text>

                    <Text style={[styles.challengeDesc, { color: theme.colors.text.secondary, fontFamily: MONO }]}>
                        Capture movement deconstructed. Render a high-fidelity slow-motion sequence and claim showcase status on the deck.
                    </Text>

                    <View style={styles.meterRow}>
                        <View style={[styles.meterTrack, { backgroundColor: isDark ? 'rgba(217, 228, 255, 0.14)' : 'rgba(76, 110, 245, 0.14)' }]}>
                            <LinearGradient
                                colors={isDark ? ['#D9E4FF', '#7DE2FF'] : ['#4C6EF5', '#7DA2FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.meterFill, { width: '62%' }]}
                            />
                        </View>
                        <Text style={[styles.meterText, { color: theme.colors.text.muted, fontFamily: MONO }]}>
                            1,248 IN
                        </Text>
                    </View>

                    <Pressable
                        onPress={() => router.push('/ai')}
                        style={({ hovered }: any) => [
                            styles.challengeBtn,
                            {
                                borderColor: accent,
                                backgroundColor: hovered
                                    ? (isDark ? 'rgba(217, 228, 255, 0.18)' : 'rgba(76, 110, 245, 0.14)')
                                    : (isDark ? 'rgba(217, 228, 255, 0.08)' : 'rgba(76, 110, 245, 0.06)'),
                            },
                        ]}
                    >
                        <Text style={[styles.challengeBtnText, { color: accent, fontFamily: MONO }]}>
                            [ ENTER.ARENA ]
                        </Text>
                        <Feather name="arrow-right" size={13} color={accent} />
                    </Pressable>
                </View>
            </DockModule>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }]}>
                <View style={styles.footerRow}>
                    {['ABOUT', 'HELP', 'PRESS', 'API'].map((l) => (
                        <Text key={l} style={[styles.footerLink, { color: theme.colors.text.muted, fontFamily: MONO }]}>{l}</Text>
                    ))}
                </View>
                <View style={styles.footerRow}>
                    {['PRIVACY', 'TERMS', 'LOCATIONS'].map((l) => (
                        <Text key={l} style={[styles.footerLink, { color: theme.colors.text.muted, fontFamily: MONO }]}>{l}</Text>
                    ))}
                </View>
                <Text style={[styles.copyright, { color: theme.colors.text.muted, fontFamily: MONO }]}>© 2026 DATARIOT</Text>
            </View>
        </View>
    );
};

const CollectionItem = ({
    index,
    title,
    views,
    delta,
    iconName,
}: {
    index: number;
    title: string;
    views: string;
    delta: number;
    iconName: any;
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const { theme, isDark, accent } = useDockSurface();
    const up = delta >= 0;

    return (
        <Pressable
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            style={[
                styles.collectionItem,
                {
                    borderColor: isHovered
                        ? (isDark ? 'rgba(217, 228, 255, 0.25)' : 'rgba(76, 110, 245, 0.3)')
                        : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'),
                    backgroundColor: isHovered
                        ? (isDark ? 'rgba(255, 255, 255, 0.045)' : 'rgba(0, 0, 0, 0.03)')
                        : 'transparent',
                },
            ]}
        >
            <Text style={[styles.collectionIndex, { color: isHovered ? accent : theme.colors.text.muted, fontFamily: MONO }]}>
                {String(index).padStart(2, '0')}
            </Text>

            <View style={[styles.collectionIcon, { backgroundColor: isDark ? 'rgba(217, 228, 255, 0.07)' : 'rgba(76, 110, 245, 0.08)' }]}>
                <Feather name={iconName} size={12} color={accent} />
            </View>

            <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.collectionTitle, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.semibold }]}>
                    {title}
                </Text>
                <Text style={[styles.collectionViews, { color: theme.colors.text.muted, fontFamily: MONO }]}>
                    {views} VIEWS
                </Text>
            </View>

            {/* Sign carries direction as well as the colour */}
            <Text style={[styles.delta, { color: up ? '#34D399' : '#F87171', fontFamily: MONO }]}>
                {up ? '+' : '−'}{Math.abs(delta)}%
            </Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 40,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 42,
        borderRadius: 9,
        borderWidth: 1,
        paddingHorizontal: 12,
        gap: 9,
        marginBottom: 30,
        // @ts-ignore
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    },
    prompt: {
        fontSize: 13,
        fontWeight: '700',
    },
    searchInput: {
        flex: 1,
        fontSize: 11,
        letterSpacing: 1,
        height: '100%',
    },
    keyHint: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    keyHintText: {
        fontSize: 9,
    },
    moduleMeta: {
        fontSize: 8.5,
        letterSpacing: 1.6,
        flexShrink: 0,
    },
    seeAllWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        flexShrink: 0,
    },
    seeAll: {
        fontSize: 9.5,
        letterSpacing: 1.5,
        fontWeight: '700',
    },
    collectionsList: {
        gap: 6,
    },
    collectionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        paddingVertical: 9,
        paddingHorizontal: 11,
        borderRadius: 9,
        borderWidth: 1,
        // @ts-ignore
        transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        // @ts-ignore
        cursor: 'pointer',
    },
    collectionIndex: {
        fontSize: 9.5,
        letterSpacing: 1,
        width: 16,
    },
    collectionIcon: {
        width: 26,
        height: 26,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    collectionTitle: {
        fontSize: 12,
        letterSpacing: -0.1,
    },
    collectionViews: {
        fontSize: 8.5,
        letterSpacing: 1,
        marginTop: 2,
    },
    delta: {
        fontSize: 9.5,
        letterSpacing: 0.5,
        fontWeight: '700',
    },
    liveIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        flexShrink: 0,
    },
    liveDotWrapper: {
        width: 6,
        height: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
    },
    liveText: {
        color: '#EF4444',
        fontSize: 8.5,
        letterSpacing: 1.5,
        fontWeight: '700',
    },
    challengeCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    cardBracket: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderWidth: 1.5,
        opacity: 0.7,
    },
    cbTL: { top: 6, left: 6, borderRightWidth: 0, borderBottomWidth: 0 },
    cbBR: { bottom: 6, right: 6, borderLeftWidth: 0, borderTopWidth: 0 },
    challengeHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    topBadgeText: {
        fontSize: 8.5,
        letterSpacing: 1.8,
    },
    prizeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    prizePool: {
        fontSize: 9.5,
        letterSpacing: 1,
        fontWeight: '700',
    },
    challengeTitle: {
        fontSize: 17,
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    challengeDesc: {
        fontSize: 9.5,
        lineHeight: 15,
        letterSpacing: 0.4,
        marginBottom: 16,
    },
    meterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    meterTrack: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    meterFill: {
        height: '100%',
    },
    meterText: {
        fontSize: 8.5,
        letterSpacing: 1,
    },
    challengeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        height: 38,
        borderRadius: 8,
        borderWidth: 1,
        // @ts-ignore
        transition: 'background-color 0.2s ease',
    },
    challengeBtnText: {
        fontSize: 10.5,
        letterSpacing: 1.5,
        fontWeight: '700',
    },
    footer: {
        borderTopWidth: 1,
        paddingTop: 18,
        gap: 8,
    },
    footerRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
    },
    footerLink: {
        fontSize: 8.5,
        letterSpacing: 1.2,
    },
    copyright: {
        fontSize: 8.5,
        letterSpacing: 1.2,
        marginTop: 4,
        opacity: 0.7,
    },
});
