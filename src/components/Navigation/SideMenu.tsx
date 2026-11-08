import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, Platform, Image as RNImage } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    FadeInLeft
} from 'react-native-reanimated';
import { useRouter, usePathname } from 'expo-router';
import { Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { useTheme } from '../Theme/ThemeProvider';
import { supabase } from '../../lib/supabase/client';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';


interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

// Minimalist Menu Configuration
const MENU_ITEMS = [
    { title: 'DEBATE ARENA', route: '/(tabs)/index' },
    { title: 'RULES', route: '/rules' },
    { title: 'LEADERBOARD', route: '/leaderboard' },
    { title: 'FORUM', route: '/forum' },
    { title: 'SETTINGS', route: '/settings' },
];

const SOCIAL_LINKS = [
    { id: 'twitter', icon: 'twitter', url: 'https://twitter.com/datariot_xyz', color: '#FFFFFF' },
    { id: 'discord', icon: 'discord', url: 'https://discord.gg/SKWCux4bb', color: '#FFFFFF' },
    { id: 'instagram', icon: 'instagram', url: 'https://instagram.com/datariot.xyz', color: '#FFFFFF' },
];

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();
    const { user, signOut } = useAuth();
    const { theme, mode, toggleTheme } = useTheme();
    const [likedVideos, setLikedVideos] = useState<any[]>([]);

    const fetchLikedVideos = React.useCallback(async () => {
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
                .limit(4);

            if (error) throw error;

            const videos = likes.map((item: any) => ({
                id: item.videos?.id,
                title: item.videos?.title || 'Untitled',
                url: item.videos?.url || item.videos?.s3_url,
            })).filter((v: { id: string }) => v.id);

            setLikedVideos(videos);

        } catch (err) {
            console.error('Error fetching liked videos for menu:', err);
        }
    }, [user]);

    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withSpring(isOpen ? 1 : 0, {
            damping: 20,
            stiffness: 90,
        });

        if (isOpen && user) {
            fetchLikedVideos();
        }
    }, [isOpen, user, fetchLikedVideos, progress]);


    const containerStyle = useAnimatedStyle(() => {
        const opacity = interpolate(progress.value, [0, 1], [0, 1]);
        return {
            opacity,
            pointerEvents: isOpen ? 'auto' : 'none',
        };
    });

    const contentStyle = useAnimatedStyle(() => {
        const translateY = interpolate(progress.value, [0, 1], [50, 0]);
        return {
            transform: [{ translateY }],
        };
    });

    const handleNavigation = (path?: string) => {
        if (path) {
            onClose();
            setTimeout(() => {
                router.push(path as any);
            }, 300);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        onClose();
    };

    const openLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            {/* Blurry Background */}
            <View style={StyleSheet.absoluteFill}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5, 5, 10, 0.95)' }]} />
                )}
                {/* Subtle Gradient Overlay for depth */}
                <LinearGradient
                    colors={['rgba(217, 228, 255, 0.1)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>

            {/* Header / Close */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <Pressable onPress={onClose} style={styles.closeButton}>
                    <Feather name="x" size={32} color="white" />
                </Pressable>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ position: 'relative', width: 26, height: 26, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        {/* Blue 'Ice' Tone Overlay */}
                        <View style={{ position: 'absolute', width: 28, height: 28, backgroundColor: 'rgba(56, 189, 248, 0.15)', borderRadius: 14 }} />
                        <RNImage
                            source={require('../../../assets/logo.jpg')}
                            style={{ width: 22, height: 22, borderRadius: 11 }}
                        />
                    </View>
                    <Text style={[styles.logoText, { color: theme.colors.primary.DEFAULT, fontFamily: theme.typography.fontFamilies.brand, letterSpacing: 1 }]}>DATARIOT</Text>
                </View>
            </View>

            <Animated.View style={[styles.content, contentStyle]}>

                {/* Main Menu Links - Big Typography */}
                <View style={styles.menuLinks}>
                    {MENU_ITEMS.map((item, index) => {
                        const isActive = pathname === item.route;
                        return (
                            <Animated.View
                                key={item.title}
                                entering={FadeInLeft.delay(100 + index * 50).duration(500)}
                            >
                                <Pressable
                                    onPress={() => handleNavigation(item.route)}
                                    style={({ pressed }) => [
                                        styles.menuItem,
                                        isActive && styles.menuItemActive,
                                        pressed && { opacity: 0.5 }
                                    ]}
                                >
                                    <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                                        {item.title}
                                    </Text>
                                    {isActive && <View style={styles.activeDot} />}
                                </Pressable>
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Liked Videos Strip */}
                {likedVideos.length > 0 && (
                    <Animated.View entering={FadeInLeft.delay(400).duration(500)} style={styles.mediaSection}>
                        <Text style={styles.sectionLabel}>RECENTLY LIKED</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaScroll}>
                            {likedVideos.map((video, idx) => (
                                <Pressable key={video.id} style={styles.mediaCard}>
                                    <LinearGradient
                                        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']}
                                        style={styles.mediaGradient}
                                    >
                                        <View style={styles.mediaIconPlaceholder}>
                                            <Feather name="play" size={12} color="white" />
                                        </View>
                                        <Text numberOfLines={1} style={styles.mediaTitle}>{video.title}</Text>
                                    </LinearGradient>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </Animated.View>
                )}

                {/* Theme Toggle & Footer Actions */}
                <View style={styles.footer}>
                    <View style={styles.themeToggleContainer}>
                        <Pressable
                            style={styles.themeToggleBtn}
                            onPress={toggleTheme}
                        >
                            <Ionicons
                                name={mode === 'dark' ? "moon" : "sunny"}
                                size={18}
                                color="white"
                            />
                            <Text style={styles.themeToggleText}>
                                {mode === 'dark' ? "DARK MODE" : "LIGHT MODE"}
                            </Text>
                        </Pressable>
                    </View>

                    <View style={styles.socialRow}>
                        {SOCIAL_LINKS.map(social => (
                            <Pressable
                                key={social.id}
                                onPress={() => openLink(social.url)}
                                style={styles.socialBtn}
                            >
                                <FontAwesome5 name={social.icon} size={20} color={social.color} />
                            </Pressable>
                        ))}
                    </View>

                    <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
                        <Text style={styles.signOutText}>SIGN OUT</Text>
                    </Pressable>

                    <Text style={styles.version}>v1.0.2</Text>
                </View>

            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2000,
    },
    header: {
        paddingHorizontal: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    closeButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 22,
    },
    logoText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 4,
    },
    content: {
        flex: 1,
        paddingHorizontal: 0,
    },
    menuLinks: {
        paddingHorizontal: 40,
        marginBottom: 40,
    },
    menuItem: {
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemActive: {
        // Optional active state styling
    },
    menuItemText: {
        fontSize: 32,
        color: 'rgba(255,255,255,0.3)',
        fontWeight: '200',
        letterSpacing: -1,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif-thin',
    },
    menuItemTextActive: {
        color: 'white',
        fontWeight: '600',
        // textShadowColor: 'rgba(255,255,255,0.5)',
        // textShadowOffset: {width: 0, height: 0},
        // textShadowRadius: 10,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#D9E4FF',
        marginLeft: 15,
        marginTop: 5,
    },
    sectionLabel: {
        marginHorizontal: 40,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 20,
    },
    mediaSection: {
        marginBottom: 40,
    },
    mediaScroll: {
        paddingHorizontal: 40,
    },
    mediaCard: {
        width: 140,
        height: 80,
        marginRight: 15,
        borderRadius: 16,
        overflow: 'hidden',
    },
    mediaGradient: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    mediaIconPlaceholder: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mediaTitle: {
        color: 'white',
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    footer: {
        marginTop: 'auto',
        paddingBottom: 50,
        alignItems: 'center',
    },
    socialRow: {
        flexDirection: 'row',
        gap: 30,
        marginBottom: 30,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 100, // Pill shape dock
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    socialBtn: {
        opacity: 0.8,
    },
    signOutBtn: {
        marginBottom: 15,
    },
    signOutText: {
        color: 'rgba(255,100,100,0.8)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    version: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 10,
    },
    themeToggleContainer: {
        marginBottom: 20,
    },
    themeToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 8,
    },
    themeToggleText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
