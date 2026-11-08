import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface HudBackdropProps {
    isDark: boolean;
}

/**
 * Mission-control backdrop: blueprint grid, drifting aurora blobs, a slow
 * scanline sweep and a vignette. Web gets the full treatment (raw divs so we
 * can use repeating-gradients + CSS animation); native falls back to the
 * gradient wash.
 */
export const HudBackdrop = ({ isDark }: HudBackdropProps) => {
    if (Platform.OS !== 'web') {
        return (
            <LinearGradient
                colors={isDark
                    ? ['rgba(217, 228, 255, 0.07)', 'rgba(217, 228, 255, 0.015)', 'transparent']
                    : ['rgba(107, 127, 204, 0.08)', 'rgba(107, 127, 204, 0.02)', 'transparent']}
                style={styles.nativeWash}
                pointerEvents="none"
            />
        );
    }

    const line = isDark ? 'rgba(217, 228, 255, 0.035)' : 'rgba(40, 60, 120, 0.055)';
    const lineBold = isDark ? 'rgba(217, 228, 255, 0.06)' : 'rgba(40, 60, 120, 0.08)';

    return (
        <View style={styles.root} pointerEvents="none">
            {/* Blueprint grid — 40px minor cells with a 200px major rule */}
            {/* @ts-ignore web-only element */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: [
                        `linear-gradient(to right, ${line} 1px, transparent 1px)`,
                        `linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
                        `linear-gradient(to right, ${lineBold} 1px, transparent 1px)`,
                        `linear-gradient(to bottom, ${lineBold} 1px, transparent 1px)`,
                    ].join(','),
                    backgroundSize: '40px 40px, 40px 40px, 200px 200px, 200px 200px',
                    maskImage: 'radial-gradient(ellipse 110% 80% at 50% 0%, #000 20%, transparent 78%)',
                    WebkitMaskImage: 'radial-gradient(ellipse 110% 80% at 50% 0%, #000 20%, transparent 78%)',
                    opacity: isDark ? 1 : 0.7,
                }}
            />

            {/* Aurora blob — cool ice, upper left */}
            {/* @ts-ignore web-only element */}
            <div
                className="dr-drift-a"
                style={{
                    position: 'absolute',
                    top: '-22%',
                    left: '-12%',
                    width: '58vw',
                    height: '58vw',
                    borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(217, 228, 255, 0.10) 0%, rgba(165, 198, 255, 0.045) 40%, transparent 68%)'
                        : 'radial-gradient(circle, rgba(107, 127, 204, 0.12) 0%, rgba(107, 127, 204, 0.04) 42%, transparent 70%)',
                    filter: 'blur(28px)',
                }}
            />

            {/* Aurora blob — cyan, right shoulder */}
            {/* @ts-ignore web-only element */}
            <div
                className="dr-drift-b"
                style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-18%',
                    width: '48vw',
                    height: '48vw',
                    borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(125, 226, 255, 0.075) 0%, rgba(125, 226, 255, 0.025) 45%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(80, 170, 220, 0.09) 0%, transparent 68%)',
                    filter: 'blur(34px)',
                }}
            />

            {/* Aurora blob — violet counterweight, lower centre */}
            {/* @ts-ignore web-only element */}
            <div
                className="dr-drift-a"
                style={{
                    position: 'absolute',
                    bottom: '-30%',
                    left: '28%',
                    width: '52vw',
                    height: '52vw',
                    borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(150, 130, 255, 0.055) 0%, transparent 65%)'
                        : 'radial-gradient(circle, rgba(140, 120, 220, 0.06) 0%, transparent 66%)',
                    filter: 'blur(40px)',
                    animationDelay: '-14s',
                }}
            />

            {/* Scanline sweep */}
            {isDark && (
                /* @ts-ignore web-only element */
                <div
                    className="dr-scan"
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: 180,
                        background: 'linear-gradient(to bottom, transparent, rgba(217, 228, 255, 0.022), transparent)',
                    }}
                />
            )}

            {/* Vignette — pushes focus to the middle of the deck */}
            {/* @ts-ignore web-only element */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: isDark
                        ? 'radial-gradient(ellipse 80% 65% at 50% 42%, transparent 35%, rgba(4, 5, 8, 0.55) 100%)'
                        : 'radial-gradient(ellipse 85% 70% at 50% 42%, transparent 45%, rgba(220, 224, 236, 0.45) 100%)',
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        overflow: 'hidden',
    },
    nativeWash: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 700,
        zIndex: 0,
    },
});
