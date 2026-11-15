import React from 'react';
import { View, StyleSheet } from 'react-native';

type Point = readonly [number, number];
const OUTER: readonly Point[] = [[50, 5], [89, 27.5], [89, 72.5], [50, 95], [11, 72.5], [11, 27.5]];
const INNER: readonly Point[] = [[50, 28], [69, 39], [69, 61], [50, 72], [31, 61], [31, 39]];
const EDGES = [
  ...OUTER.map((point, index) => [point, OUTER[(index + 1) % 6]] as const),
  ...INNER.map((point, index) => [point, INNER[(index + 1) % 6]] as const),
  [OUTER[0], INNER[0]], [OUTER[2], INNER[2]], [OUTER[4], INNER[4]],
] as const;

/** A geometric core, drawn with native primitives at every icon size. */
export function OrvelisMark({ size = 26, color = '#D9E4FF' }: { size?: number; color?: string }) {
  const stroke = Math.max(1.15, size * 0.038);
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={{ width: size, height: size }}>
      {EDGES.map(([a, b], index) => {
        const dx = (b[0] - a[0]) * size / 100;
        const dy = (b[1] - a[1]) * size / 100;
        const length = Math.hypot(dx, dy);
        return <View key={index} style={[styles.line, {
          width: length, height: stroke, borderRadius: stroke / 2, backgroundColor: color,
          left: (a[0] + b[0]) * size / 200 - length / 2,
          top: (a[1] + b[1]) * size / 200 - stroke / 2,
          transform: [{ rotate: `${Math.atan2(dy, dx) * 180 / Math.PI}deg` }],
        }]} />;
      })}
    </View>
  );
}
const styles = StyleSheet.create({ line: { position: 'absolute' } });
