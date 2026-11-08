import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../Theme/ThemeProvider';

const MONO = Platform.OS === 'ios' ? 'Courier' : 'monospace';

export interface CommandTab {
    key: string;
    label: string;
    hint?: string;
}

interface CommandBarProps {
    tabs: CommandTab[];
    activeKey: string;
    onTabPress: (key: string) => void;
    /** Rendered at the far right — view toggles, theme switch, etc. */
    actions?: React.ReactNode;
    /** Status strings shown in the readout cluster */
    readout?: string[];
}

const Segment = ({
    tab,
    isActive,
    onPress,
}: {
    tab: CommandTab;
    isActive: boolean;
    onPress: () => void;
}) => {
    const [hovered, setHovered] = useState(false);
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const accent = theme.colors.primary.DEFAULT;

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            style={[
                styles.segment,
                {
                    backgroundColor: isActive
                        ? (isDark ? 'rgba(217, 228, 255, 0.10)' : 'rgba(76, 110, 245, 0.09)')
                        : hovered
                            ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')
                            : 'transparent',
                },
            ]}
        >
            <Text
                numberOfLines={1}
                style={[
                    styles.segmentText,
                    {
                        color: isActive
                            ? theme.colors.text.primary
                            : hovered
                                ? theme.colors.text.secondary
                                : theme.colors.text.muted,
                        fontFamily: MONO,
                    },
                ]}
            >
                {tab.label}
            </Text>

            {tab.hint ? (
                <Text style={[styles.segmentHint, { color: isActive ? accent : theme.colors.text.muted, fontFamily: MONO }]}>
                    {tab.hint}
                </Text>
            ) : null}

            {/* Active underline — replaces the pill, kills the tab-bar look */}
            {isActive && (
                <LinearGradient
                    colors={isDark ? ['#D9E4FF', '#7DE2FF'] : ['#4C6EF5', '#7DA2FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.segmentUnderline}
                />
            )}
        </Pressable>
    );
};

export const HudButton = ({
    icon,
    onPress,
    active = false,
    label,
}: {
    icon: React.ReactNode;
    onPress: () => void;
    active?: boolean;
    label?: string;
}) => {
    const [hovered, setHovered] = useState(false);
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            accessibilityLabel={label}
            style={[
                styles.hudButton,
                {
                    borderColor: active
                        ? theme.colors.primary.DEFAULT
                        : hovered
                            ? (isDark ? 'rgba(217, 228, 255, 0.3)' : 'rgba(76, 110, 245, 0.3)')
                            : (isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)'),
                    backgroundColor: active
                        ? (isDark ? 'rgba(217, 228, 255, 0.13)' : 'rgba(76, 110, 245, 0.10)')
                        : hovered
                            ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)')
                            : 'transparent',
                },
            ]}
        >
            {icon}
        </Pressable>
    );
};

export const CommandBar = ({ tabs, activeKey, onTabPress, actions, readout = [] }: CommandBarProps) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    return (
        <View
            style={[
                styles.bar,
                {
                    backgroundColor: isDark ? '#0A0B11' : '#FBFBFD',
                    borderBottomColor: isDark ? 'rgba(217, 228, 255, 0.09)' : 'rgba(0, 0, 0, 0.07)',
                },
            ]}
        >
            {/* Segmented command group */}
            <View style={styles.segments}>
                {tabs.map((tab) => (
                    <Segment
                        key={tab.key}
                        tab={tab}
                        isActive={tab.key === activeKey}
                        onPress={() => onTabPress(tab.key)}
                    />
                ))}
            </View>

            <View style={{ flex: 1 }} />

            {/* Telemetry readout */}
            {readout.length > 0 && (
                <View style={styles.readout}>
                    <View style={styles.liveDotWrap}>
                        <View style={[styles.liveDot, { backgroundColor: '#34D399' }]} />
                        {Platform.OS === 'web' ? (
                            /* @ts-ignore web-only element */
                            <div
                                className="status-pulse-anim"
                                style={{
                                    position: 'absolute',
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: 'rgba(52, 211, 153, 0.6)',
                                }}
                            />
                        ) : null}
                    </View>
                    {readout.map((line, i) => (
                        <React.Fragment key={line}>
                            {i > 0 && (
                                <Text style={[styles.readoutSep, { color: theme.colors.text.muted, fontFamily: MONO }]}>·</Text>
                            )}
                            <Text
                                // @ts-ignore web className
                                className={i === 0 ? 'dr-flicker' : undefined}
                                style={[styles.readoutText, { color: theme.colors.text.muted, fontFamily: MONO }]}
                            >
                                {line}
                            </Text>
                        </React.Fragment>
                    ))}
                </View>
            )}

            {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
    );
};

/** Scrolling marquee of live platform events. Web-only motion; static elsewhere. */
export const LiveTicker = ({ items }: { items: string[] }) => {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const accent = theme.colors.primary.DEFAULT;

    const shell = [
        styles.ticker,
        {
            borderBottomColor: isDark ? 'rgba(217, 228, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
            backgroundColor: isDark ? '#0C0D14' : '#F6F6FA',
        },
    ];

    const badge = (
        <View style={[styles.tickerBadge, { borderColor: 'rgba(248, 113, 113, 0.5)' }]}>
            <View style={[styles.liveDot, { backgroundColor: '#F87171' }]} />
            <Text style={[styles.tickerBadgeText, { color: '#F87171', fontFamily: MONO }]}>LIVE</Text>
        </View>
    );

    if (Platform.OS !== 'web') {
        return (
            <View style={shell}>
                {badge}
                <View style={styles.tickerViewport}>
                    <View style={styles.tickerStatic}>
                        {items.map((item, i) => (
                            <React.Fragment key={`${item}-${i}`}>
                                <Text numberOfLines={1} style={[styles.tickerItem, { color: theme.colors.text.secondary, fontFamily: MONO }]}>
                                    {item}
                                </Text>
                                <Text style={[styles.tickerSep, { color: accent, fontFamily: MONO }]}>{'///'}</Text>
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            </View>
        );
    }

    // On web the marquee is raw markup: RN's StyleSheet drops `white-space`, and
    // without it every item wraps and stacks on top of the next.
    const itemStyle: any = {
        fontSize: 9.5,
        letterSpacing: '1.2px',
        marginRight: 14,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        color: theme.colors.text.secondary,
        fontFamily: MONO,
    };
    const sepStyle: any = { ...itemStyle, color: accent, opacity: 0.6 };

    const run = (copy: number) => items.map((item, i) => (
        <React.Fragment key={`${copy}-${item}-${i}`}>
            {/* @ts-ignore web-only element */}
            <span style={itemStyle}>{item}</span>
            {/* @ts-ignore web-only element */}
            <span style={sepStyle}>{'///'}</span>
        </React.Fragment>
    ));

    return (
        <View style={shell}>
            {badge}
            <View style={styles.tickerViewport}>
                {/* @ts-ignore web-only element */}
                <div
                    className="dr-ticker"
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: 'max-content', willChange: 'transform' }}
                >
                    {/* Duplicated so the -50% translate loops seamlessly */}
                    {run(0)}
                    {run(1)}
                </div>
                {/* A marquee cut dead at both ends reads as broken text rather
                    than as something in motion. */}
                <LinearGradient
                    pointerEvents="none"
                    colors={[isDark ? '#0C0D14' : '#F6F6FA', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[styles.tickerFade, { left: 0 }]}
                />
                <LinearGradient
                    pointerEvents="none"
                    colors={['transparent', isDark ? '#0C0D14' : '#F6F6FA']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[styles.tickerFade, { right: 0 }]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'stretch',
        height: 54,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        zIndex: 20,
    },
    segments: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    segment: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        paddingHorizontal: 18,
        position: 'relative',
        // @ts-ignore
        transition: 'background-color 0.18s ease',
        // @ts-ignore
        cursor: 'pointer',
    },
    segmentText: {
        fontSize: 11,
        letterSpacing: 2,
        fontWeight: '700',
    },
    segmentHint: {
        fontSize: 8,
        letterSpacing: 1,
        opacity: 0.85,
    },
    segmentUnderline: {
        position: 'absolute',
        left: 10,
        right: 10,
        bottom: 0,
        height: 2,
    },
    readout: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginRight: 16,
    },
    liveDotWrap: {
        width: 6,
        height: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    readoutText: {
        fontSize: 9,
        letterSpacing: 1.4,
    },
    readoutSep: {
        fontSize: 9,
        opacity: 0.5,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    hudButton: {
        width: 34,
        height: 34,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        // @ts-ignore
        transition: 'all 0.18s ease',
        // @ts-ignore
        cursor: 'pointer',
    },
    ticker: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 32,
        borderBottomWidth: 1,
        paddingLeft: 20,
        gap: 14,
        overflow: 'hidden',
        zIndex: 19,
    },
    tickerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
    },
    tickerBadgeText: {
        fontSize: 8.5,
        letterSpacing: 1.5,
        fontWeight: '700',
    },
    tickerViewport: {
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
    },
    tickerFade: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 34,
        zIndex: 2,
    },
    tickerStatic: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tickerItem: {
        fontSize: 9.5,
        letterSpacing: 1.2,
        marginRight: 14,
        flexShrink: 0,
        // @ts-ignore — web-only: the marquee must run on one line
        whiteSpace: 'nowrap',
    },
    tickerSep: {
        fontSize: 9.5,
        marginRight: 14,
        opacity: 0.6,
        flexShrink: 0,
        // @ts-ignore — web-only
        whiteSpace: 'nowrap',
    },
});
