import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '../../components/Theme/ThemeProvider';

export default function LoginFormScreen() {
    const { signIn } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await signIn(email, password);

            if (result.error) {
                setError(result.error.message);
            } else {
                router.replace('/(tabs)');
            }
        } catch {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background.primary }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Back Button */}
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.backButtonText, { color: '#D9E4FF' }]}>← Back</Text>
                </Pressable>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.text.primary }]}>Login</Text>
                        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Welcome back!</Text>
                    </View>

                    <View style={styles.form}>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                                color: theme.colors.text.primary,
                                borderColor: isDark ? 'rgba(217, 228, 255, 0.2)' : 'rgba(0,0,0,0.08)',
                            }]}
                            placeholder="Email"
                            placeholderTextColor={theme.colors.text.muted}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                                color: theme.colors.text.primary,
                                borderColor: isDark ? 'rgba(217, 228, 255, 0.2)' : 'rgba(0,0,0,0.08)',
                            }]}
                            placeholder="Password"
                            placeholderTextColor={theme.colors.text.muted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Pressable
                            style={[styles.loginButton, loading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#D9E4FF', '#D9E4FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.loginButtonGradient}
                            >
                                <Text style={styles.loginButtonText}>
                                    {loading ? 'Loading...' : 'Login'}
                                </Text>
                            </LinearGradient>
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    backButton: {
        padding: 16,
    },
    backButtonText: {
        fontSize: 18,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
    },
    form: {
        gap: 16,
    },
    input: {
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        fontSize: 18,
        borderWidth: 1,
    },
    errorText: {
        color: '#FFFFFF',
        fontSize: 14,
        textAlign: 'center',
    },
    loginButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    loginButtonGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
    },
    buttonDisabled: {
        opacity: 0.5,
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
    },
    googleIcon: {
        marginRight: 10,
    },
    buttonPressed: {
        opacity: 0.8,
    },
});
