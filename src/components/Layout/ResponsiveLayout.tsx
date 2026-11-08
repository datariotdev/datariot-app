import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { WebSidebar, RAIL_WIDTH } from '../Web/WebSidebar';
import { WebRightPanel } from '../Web/WebRightPanel';
import { GlobalWebStyles } from '../UI/GlobalWebStyles';
import { HudBackdrop } from '../UI/HudBackdrop';
import { usePathname } from 'expo-router';
import { useTheme } from '../Theme/ThemeProvider';

interface ResponsiveLayoutProps {
    children: React.ReactNode;
}

/** Below this the right dock folds away and the deck takes the full width. */
const DOCK_BREAKPOINT = 1440;
const DOCK_WIDTH = 320;

export const ResponsiveLayout = ({ children }: ResponsiveLayoutProps) => {
    const { width } = useWindowDimensions();
    const isWeb = Platform.OS === 'web' && width > 768;
    const pathname = usePathname();
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const isCompactDesktop = width < 1100;

    if (!isWeb) {
        return <View style={{ flex: 1 }}>{children}</View>;
    }

    // Routes that keep the nav rail
    const showSidebar = [
        '/',
        '/index',
        '/discover',
        '/ai',
        '/inbox',
        '/profile',
        '/settings',
        '/create',
    ].includes(pathname);

    // The right dock is a home-feed instrument only, and only when there's room
    const showRightPanel = (pathname === '/' || pathname === '/index') && width >= DOCK_BREAKPOINT;

    if (!showSidebar) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
                <GlobalWebStyles />
                <HudBackdrop isDark={isDark} />
                <View style={[styles.content, { maxWidth: '100%', paddingHorizontal: isCompactDesktop ? 16 : 32 }]}>
                    <View style={styles.fullWidthColumn}>{children}</View>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <GlobalWebStyles />
            <HudBackdrop isDark={isDark} />

            {/* The rail floats above everything; this column just reserves its gutter */}
            <WebSidebar />

            <View style={[styles.content, { paddingLeft: RAIL_WIDTH }]}>
                {/* Deck — the main working surface */}
                <View style={[styles.deckColumn, { paddingHorizontal: isCompactDesktop ? 12 : 24 }]}>
                    <View style={styles.deckInner}>{children}</View>
                </View>

                {/* Instrument dock */}
                {showRightPanel && (
                    <View
                        style={[
                            styles.dockColumn,
                            {
                                width: DOCK_WIDTH,
                                borderLeftColor: isDark ? 'rgba(217, 228, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
                            },
                        ]}
                    >
                        <WebRightPanel />
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        zIndex: 1,
    },
    fullWidthColumn: {
        flex: 1,
        width: '100%',
        maxWidth: 1300,
        alignSelf: 'center',
    },
    deckColumn: {
        flex: 1,
        maxWidth: 1180,
        minWidth: 0,
        position: 'relative',
        // @ts-ignore — web-only
        overflowY: 'auto',
    },
    deckInner: {
        flex: 1,
        minHeight: '100%',
    },
    dockColumn: {
        borderLeftWidth: 1,
        paddingTop: 24,
        paddingLeft: 24,
        paddingRight: 12,
        // @ts-ignore — web-only
        overflowY: 'auto',
    },
});
