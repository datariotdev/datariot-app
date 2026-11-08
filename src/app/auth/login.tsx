import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Image as RNImage } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useTheme } from '../../components/Theme/ThemeProvider';

export default function WelcomeScreen() {
    const router = useRouter();
    const loginScale = useRef(new Animated.Value(1)).current;
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const handleLogin = () => {
        router.push('/auth/login-form');
    };

    const handleSignUp = () => {
        router.push('/auth/signup-form');
    };

    const onLoginPressIn = useCallback(() => {
        Animated.spring(loginScale, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    }, [loginScale]);

    const onLoginPressOut = useCallback(() => {
        Animated.spring(loginScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 8,
        }).start();
    }, [loginScale]);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.contentContainer}>
                    {/* App Name */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ marginRight: 12, position: 'relative', width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
                            {/* Blue 'Ice' Tone Overlay */}
                            <View style={{ position: 'absolute', width: 38, height: 38, backgroundColor: 'rgba(56, 189, 248, 0.15)', borderRadius: 19 }} />
                            <RNImage
                                source={require('../../../assets/logo.jpg')}
                                style={{ width: 32, height: 32, borderRadius: 16 }}
                            />
                        </View>
                        <Text style={[styles.appName, { color: theme.colors.primary.DEFAULT, fontFamily: theme.typography.fontFamilies.brand, letterSpacing: 2, fontSize: 28 }]}>Datariot</Text>
                    </View>

                    {/* Tagline */}
                    <Text style={[styles.tagline, { color: theme.colors.text.muted }]}>Discover, Learn, Grow.</Text>

                    {/* Buttons Section */}
                    <View style={styles.buttonsSection}>
                        {/* Log In Button — Premium Gradient */}
                        <Animated.View style={[styles.loginButtonWrapper, { transform: [{ scale: loginScale }] }]}>
                            <Pressable
                                onPress={handleLogin}
                                onPressIn={onLoginPressIn}
                                onPressOut={onLoginPressOut}
                                style={styles.loginPressable}
                            >
                                <LinearGradient
                                    colors={['#D9E4FF', '#D9E4FF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.loginGradient}
                                >
                                    <Text style={styles.loginButtonText}>Sign In</Text>
                                    <Feather name="arrow-right" size={20} color="#000000" style={styles.loginArrow} />
                                </LinearGradient>
                            </Pressable>
                        </Animated.View>

                        {/* Create Account Button - Outlined */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.createAccountButton,
                                { borderColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)' },
                                pressed && styles.buttonPressed
                            ]}
                            onPress={handleSignUp}
                        >
                            <Text style={[styles.createAccountButtonText, { color: theme.colors.text.primary }]}>Create Account</Text>
                        </Pressable>

                        {/* Google Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.googleButton,
                                { backgroundColor: isDark ? '#FFFFFF' : '#F1F5F9' },
                                pressed && styles.buttonPressed
                            ]}
                            onPress={() => {/* TODO: Google Auth */ }}
                        >
                            <AntDesign name="google" size={20} color="#D9E4FF" style={styles.googleIcon} />
                            <Text style={styles.googleButtonText}>Continue with Google</Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
        width: '100%',
    },
    appName: {
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    tagline: {
        fontSize: 16,
        marginBottom: 60,
        textAlign: 'center',
    },
    buttonsSection: {
        width: '100%',
        maxWidth: 400,
        gap: 12,
        alignItems: 'center',
    },
    loginButtonWrapper: {
        width: '100%',
        borderRadius: 16,
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
        elevation: 12,
    },
    loginPressable: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    loginGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000000',
        textAlign: 'center',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    loginArrow: {
        marginLeft: 10,
    },
    createAccountButton: {
        backgroundColor: 'transparent',
        borderRadius: 14,
        borderWidth: 1.5,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    createAccountButtonText: {
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
    },
    googleButton: {
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        flexDirection: 'row',
    },
    googleButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000000',
        textAlign: 'center',
    },
    googleIcon: {
        marginRight: 10,
    },
    buttonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.97 }],
    },
});
