import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MONO, useDockSurface } from './DockModule';

/**
 * Stat tile: label · value · delta · 24-point trend.
 *
 * One series only. The brand's ice blue (#D9E4FF) and cyan (#7DE2FF) sit ΔE 3.0
 * apart under protanopia, so they can never be two series in the same plot — if
 * a second measure is ever added here it needs its own tile, not a second line.
 */
interface SignalTileProps {
    label: string;
    /** Current value; formatted compactly for display. */
    value: number;
    /** Signed percentage change against `deltaPeriod`. */
    deltaPct: number;
    deltaPeriod: string;
    /** Trend samples, oldest first. */
    series: number[];
    /** Label under the first sample. */
    startLabel?: string;
    /** Label under the last sample. */
    endLabel?: string;
    /** Names one bucket in the tooltip, e.g. "02:00". */
    bucketLabel?: (index: number, total: number) => string;
}

const compact = (n: number): string => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(Math.round(n));
};

const VB_W = 280;
const VB_H = 48;
const PAD_X = 5;
const PAD_Y = 6;

export const SignalTile = ({
    label,
    value,
    deltaPct,
    deltaPeriod,
    series,
    startLabel,
    endLabel,
    bucketLabel,
}: SignalTileProps) => {
    const { theme, isDark, accent, surface, cardBg, cardBorder } = useDockSurface();
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);

    const geom = useMemo(() => {
        const n = series.length;
        if (n < 2) return null;
        const min = Math.min(...series);
        const max = Math.max(...series);
        const span = max - min || 1;
        const innerW = VB_W - PAD_X * 2;
        const innerH = VB_H - PAD_Y * 2;

        const pts = series.map((v, i) => ({
            x: PAD_X + (i * innerW) / (n - 1),
            y: PAD_Y + innerH - ((v - min) / span) * innerH,
            v,
        }));

        const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
        const area = `${line} L${pts[n - 1].x.toFixed(2)} ${VB_H} L${pts[0].x.toFixed(2)} ${VB_H} Z`;
        return { pts, line, area };
    }, [series]);

    const up = deltaPct >= 0;
    // Direction is carried by the sign as well as the colour — never colour alone.
    const deltaColor = up ? '#34D399' : '#F87171';
    const active = hoverIdx !== null && geom ? geom.pts[hoverIdx] : null;

    return (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.topRow}>
                <Text style={[styles.label, { color: theme.colors.text.muted, fontFamily: MONO }]}>
                    {label.toUpperCase()}
                </Text>
                <Text style={[styles.delta, { color: deltaColor, fontFamily: MONO }]}>
                    {up ? '+' : '−'}{Math.abs(deltaPct)}%
                </Text>
            </View>

            <View style={styles.valueRow}>
                <Text style={[styles.value, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}>
                    {compact(value)}
                </Text>
                <Text style={[styles.period, { color: theme.colors.text.muted, fontFamily: MONO }]}>
                    {deltaPeriod.toUpperCase()}
                </Text>
            </View>

            {geom && (
                <View style={styles.plotWrap}>
                    {/* @ts-ignore web-only element */}
                    <svg
                        viewBox={`0 0 ${VB_W} ${VB_H}`}
                        preserveAspectRatio="none"
                        style={{ width: '100%', height: VB_H, display: 'block', overflow: 'visible' }}
                        onMouseMove={(e: any) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            const ratio = (e.clientX - r.left) / r.width;
                            const i = Math.round(ratio * (series.length - 1));
                            setHoverIdx(Math.max(0, Math.min(series.length - 1, i)));
                        }}
                        onMouseLeave={() => setHoverIdx(null)}
                    >
                        {/* Area wash — the series hue at ~10% */}
                        <path d={geom.area} fill={accent} fillOpacity={0.1} stroke="none" />
                        {/* Line — 2px, round join and cap */}
                        <path
                            d={geom.line}
                            fill="none"
                            stroke={accent}
                            strokeWidth={2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                        />

                        {active && (
                            <>
                                <line
                                    x1={active.x}
                                    y1={0}
                                    x2={active.x}
                                    y2={VB_H}
                                    stroke={isDark ? 'rgba(217, 228, 255, 0.35)' : 'rgba(76, 110, 245, 0.35)'}
                                    strokeWidth={1}
                                    vectorEffect="non-scaling-stroke"
                                />
                                <circle cx={active.x} cy={active.y} r={4} fill={accent} stroke={surface} strokeWidth={2} />
                            </>
                        )}

                        {/* End marker — r>=4 with a 2px surface ring so it stays legible */}
                        {!active && (
                            <circle
                                cx={geom.pts[geom.pts.length - 1].x}
                                cy={geom.pts[geom.pts.length - 1].y}
                                r={4}
                                fill={accent}
                                stroke={surface}
                                strokeWidth={2}
                            />
                        )}
                    </svg>

                    {/* Tooltip — the only place a per-point value is spelled out */}
                    {active && (
                        <View
                            style={[
                                styles.tooltip,
                                {
                                    backgroundColor: isDark ? 'rgba(10, 11, 17, 0.96)' : 'rgba(255,255,255,0.97)',
                                    borderColor: cardBorder,
                                    left: `${(hoverIdx! / (series.length - 1)) * 100}%`,
                                    // Slide the tooltip across its own width as the
                                    // point moves, so it never hangs off the card.
                                    transform: [{ translateX: -52 * (hoverIdx! / (series.length - 1)) }],
                                },
                            ]}
                            pointerEvents="none"
                        >
                            <Text style={[styles.tooltipValue, { color: theme.colors.text.primary, fontFamily: MONO }]}>
                                {compact(active.v)}
                            </Text>
                            {bucketLabel && (
                                <Text style={[styles.tooltipMeta, { color: theme.colors.text.muted, fontFamily: MONO }]}>
                                    {bucketLabel(hoverIdx!, series.length)}
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            )}

            {(startLabel || endLabel) && (
                <View style={styles.axisRow}>
                    <Text style={[styles.axis, { color: theme.colors.text.muted, fontFamily: MONO }]}>{startLabel}</Text>
                    <Text style={[styles.axis, { color: theme.colors.text.muted, fontFamily: MONO }]}>{endLabel}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 14,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 8.5,
        letterSpacing: 1.8,
    },
    delta: {
        fontSize: 10,
        letterSpacing: 0.6,
        fontWeight: '700',
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginTop: 6,
        marginBottom: 12,
    },
    value: {
        fontSize: 26,
        letterSpacing: -0.5,
    },
    period: {
        fontSize: 8.5,
        letterSpacing: 1.2,
    },
    plotWrap: {
        position: 'relative',
    },
    tooltip: {
        position: 'absolute',
        top: -10,
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        minWidth: 52,
        alignItems: 'center',
    },
    tooltipValue: {
        fontSize: 10,
        fontWeight: '700',
    },
    tooltipMeta: {
        fontSize: 8,
        letterSpacing: 1,
        marginTop: 1,
    },
    axisRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    axis: {
        fontSize: 8,
        letterSpacing: 1.2,
    },
});
