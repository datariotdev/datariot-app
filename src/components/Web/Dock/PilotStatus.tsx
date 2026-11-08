import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MONO, useDockSurface } from './DockModule';

export interface Objective {
    id: string;
    label: string;
    done: number;
    total: number;
}

interface PilotStatusProps {
    callsign: string | null;
    /** Rank name, e.g. "Silver". */
    tier: string;
    elo: number;
    /** Rating needed to reach the next tier. */
    eloToNext: number;
    /** Rating span of the current tier, used for the meter. */
    tierSpan: number;
    streakDays: number;
    objectives: Objective[];
}

export const PilotStatus = ({
    callsign,
    tier,
    elo,
    eloToNext,
    tierSpan,
    streakDays,
    objectives,
}: PilotStatusProps) => {
    const router = useRouter();
    const { theme, isDark, accent, cardBg, cardBorder, hairline } = useDockSurface();

    if (!callsign) {
        return (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.loggedOut, { color: theme.colors.text.secondary, fontFamily: MONO }]}>
                    NO PILOT SIGNED IN. CONNECT TO TRACK RATING, STREAK AND DAILY OBJECTIVES.
                </Text>
                <Pressable
                    onPress={() => router.push('/auth/login')}
                    style={({ hovered }: any) => [
                        styles.connectBtn,
                        {
                            borderColor: accent,
                            backgroundColor: hovered
                                ? (isDark ? 'rgba(217, 228, 255, 0.16)' : 'rgba(76, 110, 245, 0.12)')
                                : 'transparent',
                        },
                    ]}
                >
                    <Text style={[styles.connectText, { color: accent, fontFamily: MONO }]}>[ CONNECT ]</Text>
                </Pressable>
            </View>
        );
    }

    const progress = Math.max(0, Math.min(1, (tierSpan - eloToNext) / tierSpan));
    const completed = objectives.filter(o => o.done >= o.total).length;

    return (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {/* Identity */}
            <View style={styles.identityRow}>
                <LinearGradient
                    colors={isDark ? ['#D9E4FF', '#7DE2FF'] : ['#4C6EF5', '#7DA2FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatar}
                >
                    <Text style={[styles.avatarText, { fontFamily: MONO }]}>{callsign[0].toUpperCase()}</Text>
                </LinearGradient>

                <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={[styles.callsign, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}>
                        {callsign.toUpperCase()}
                    </Text>
                    <Text style={[styles.tier, { color: theme.colors.text.muted, fontFamily: MONO }]}>
                        {tier.toUpperCase()} · {elo.toLocaleString()} ELO
                    </Text>
                </View>

                <View style={[styles.streakChip, { borderColor: 'rgba(251, 191, 36, 0.45)' }]}>
                    <MaterialCommunityIcons name="fire" size={12} color="#FBBF24" />
                    <Text style={[styles.streakText, { fontFamily: MONO }]}>{streakDays}D</Text>
                </View>
            </View>

            {/* Tier meter — the unfilled track is a dimmer step of the same ramp,
                so the whole bar reads as one scale rather than fill-on-gray. */}
            <View style={styles.meterBlock}>
                <View style={[styles.meterTrack, { backgroundColor: isDark ? 'rgba(217, 228, 255, 0.14)' : 'rgba(76, 110, 245, 0.14)' }]}>
                    <LinearGradient
                        colors={isDark ? ['#D9E4FF', '#7DE2FF'] : ['#4C6EF5', '#7DA2FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.meterFill, { width: `${progress * 100}%` }]}
                    />
                </View>
                <Text style={[styles.meterCaption, { color: theme.colors.text.muted, fontFamily: MONO }]}>
                    {eloToNext} ELO TO NEXT TIER
                </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: hairline }]} />

            {/* Daily objectives */}
            <View style={styles.objHeader}>
                <Text style={[styles.objTitle, { color: theme.colors.text.secondary, fontFamily: MONO }]}>
                    TODAY
                </Text>
                <Text style={[styles.objCount, { color: theme.colors.text.muted, fontFamily: MONO }]}>
                    {completed}/{objectives.length}
                </Text>
            </View>

            {objectives.map((o) => {
                const done = o.done >= o.total;
                return (
                    <View key={o.id} style={styles.objRow}>
                        <View
                            style={[
                                styles.checkbox,
                                {
                                    borderColor: done ? accent : (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)'),
                                    backgroundColor: done ? accent : 'transparent',
                                },
                            ]}
                        >
                            {done && <Feather name="check" size={9} color={isDark ? '#08090D' : '#FFFFFF'} />}
                        </View>
                        <Text
                            numberOfLines={1}
                            style={[
                                styles.objLabel,
                                {
                                    color: done ? theme.colors.text.muted : theme.colors.text.secondary,
                                    fontFamily: MONO,
                                    textDecorationLine: done ? 'line-through' : 'none',
                                },
                            ]}
                        >
                            {o.label.toUpperCase()}
                        </Text>
                        <Text style={[styles.objProgress, { color: done ? accent : theme.colors.text.muted, fontFamily: MONO }]}>
                            {o.done}/{o.total}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 14,
    },
    loggedOut: {
        fontSize: 9.5,
        lineHeight: 15,
        letterSpacing: 0.6,
        marginBottom: 14,
    },
    connectBtn: {
        height: 34,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        // @ts-ignore web transition
        transition: 'background-color 0.2s ease',
    },
    connectText: {
        fontSize: 10.5,
        letterSpacing: 1.6,
        fontWeight: '700',
    },
    identityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#000000',
        fontSize: 15,
        fontWeight: '800',
    },
    callsign: {
        fontSize: 13,
        letterSpacing: 0.4,
    },
    tier: {
        fontSize: 8.5,
        letterSpacing: 1.2,
        marginTop: 3,
    },
    streakChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 5,
        borderWidth: 1,
    },
    streakText: {
        color: '#FBBF24',
        fontSize: 9,
        letterSpacing: 0.5,
        fontWeight: '700',
    },
    meterBlock: {
        marginTop: 14,
    },
    meterTrack: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    meterFill: {
        height: '100%',
        borderRadius: 2,
    },
    meterCaption: {
        fontSize: 8.5,
        letterSpacing: 1.2,
        marginTop: 7,
    },
    divider: {
        height: 1,
        marginVertical: 14,
    },
    objHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    objTitle: {
        fontSize: 8.5,
        letterSpacing: 2,
        fontWeight: '700',
    },
    objCount: {
        fontSize: 8.5,
        letterSpacing: 1,
    },
    objRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
        paddingVertical: 5,
    },
    checkbox: {
        width: 14,
        height: 14,
        borderRadius: 4,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    objLabel: {
        flex: 1,
        fontSize: 9.5,
        letterSpacing: 0.8,
    },
    objProgress: {
        fontSize: 9,
        letterSpacing: 0.5,
    },
});
