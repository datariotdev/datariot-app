import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image as RNImage } from 'react-native';
import { theme as baseTheme } from '../../design-system/theme';
import { useTheme } from '../Theme/ThemeProvider';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export const WebTopNav = () => {
    const router = useRouter();
    const { theme, mode, toggleTheme } = useTheme();
    const isDark = mode === 'dark';

    return (
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
            <View style={styles.content}>
                {/* Left: Logo */}
                <View style={styles.left}>
                    <Pressable onPress={() => router.push('/')} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.logoIconPlaceholder, { borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)', backgroundColor: 'transparent', position: 'relative' }]}>
                            <View style={{ position: 'absolute', width: 48, height: 48, backgroundColor: 'rgba(217, 228, 255, 0.1)', borderRadius: 24, left: -4, top: -4 }} />
                            <RNImage
                                source={require('../../../assets/logo.jpg')}
                                style={styles.logoImage}
                            />
                        </View>
                        <Text style={[styles.logo, { color: theme.colors.primary.DEFAULT, fontFamily: theme.typography.fontFamilies.brand, letterSpacing: 2 }]}>DATARIOT</Text>
                    </Pressable>
                </View>

                {/* Center: Navigation Links */}
                <View style={styles.center}>
                    <NavButton theme={theme} isDark={isDark} title="Arena (Beta)" onPress={() => router.push('/')} />
                    <NavButton theme={theme} isDark={isDark} title="Rules" />
                    <NavButton theme={theme} isDark={isDark} title="Leaderboard" />
                    <NavButton theme={theme} isDark={isDark} title="Forum" />
                </View>

                {/* Right: Actions */}
                <View style={styles.right}>
                    <Pressable style={[styles.searchButton, {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    }]}>
                        <Feather name="search" size={16} color={theme.colors.text.muted} />
                        <Text style={[styles.searchText, { color: theme.colors.text.muted }]}>Search creators...</Text>
                    </Pressable>

                    <Pressable
                        onPress={toggleTheme}
                        style={[styles.themeIconButton, {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        }]}
                    >
                        <Feather
                            name={isDark ? 'sun' : 'moon'}
                            size={18}
                            color={theme.colors.text.secondary}
                        />
                    </Pressable>

                    <View style={styles.loginButtonWrapper}>
                        <LinearGradient
                            colors={['#D9E4FF', '#A5C6FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.loginGradient}
                        >
                            <Pressable
                                style={styles.loginButton}
                                onPress={() => router.push('/auth/login')}
                            >
                                <Text style={[styles.loginText, { fontFamily: theme.typography.fontFamilies.bold }]}>Launch App</Text>
                            </Pressable>
                        </LinearGradient>
                    </View>
                </View>
            </View>

        </View>
    );
};

const NavButton = ({ title, onPress, theme, isDark }: { title: string, onPress?: () => void, theme: any, isDark: boolean }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Pressable
            style={[
                styles.navButton,
                isHovered && {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                },
            ]}
            onPress={onPress}
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
        >
            <Text style={[
                styles.navButtonText,
                {
                    color: isHovered ? theme.colors.text.primary : theme.colors.text.secondary,
                    fontFamily: theme.typography.fontFamilies.medium,
                },
            ]}>{title}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 72,
        width: '100%',
        zIndex: 100,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        maxWidth: 1400,
        alignSelf: 'center',
        width: '100%',
    },
    left: {
        flex: 1,
    },
    logoIconPlaceholder: {
        width: 34,
        height: 34,
        borderRadius: 10,
        marginRight: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    logo: {
        fontSize: 17,
        letterSpacing: 3,
    },
    center: {
        flexDirection: 'row',
        gap: 4,
        flex: 2,
        justifyContent: 'center',
    },
    right: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
        justifyContent: 'flex-end',
    },
    navButton: {
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 12,
        // @ts-ignore
        transition: 'all 0.2s ease',
    },
    navButtonText: {
        fontSize: 13,
        letterSpacing: 0.3,
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 12,
        width: 200,
        // @ts-ignore
        transition: 'border-color 0.2s ease',
    },
    searchText: {
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    loginButtonWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    loginGradient: {
        borderRadius: 12,
    },
    loginButton: {
        paddingVertical: 11,
        paddingHorizontal: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#000000',
        fontSize: 13,
        letterSpacing: 0.5,
    },
    themeIconButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        // @ts-ignore
        transition: 'all 0.2s ease',
    },
});

