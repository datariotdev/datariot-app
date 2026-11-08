import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { theme } from '@design-system/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { AntDesign } from '@expo/vector-icons';

export default function SignupFormScreen() {
    const { signUp } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignUp = async () => {
        if (!email || !password || !username) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await signUp(email, password, username);

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
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                {/* Back Button */}
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </Pressable>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Sign Up</Text>
                        <Text style={styles.subtitle}>Create your account</Text>
                    </View>

                    <View style={styles.form}>
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor={theme.colors.text.muted}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={theme.colors.text.muted}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor={theme.colors.text.muted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Pressable
                            style={[styles.signupButton, loading && styles.buttonDisabled]}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#D9E4FF', '#D9E4FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.signupButtonGradient}
                            >
                                <Text style={styles.signupButtonText}>
                                    {loading ? 'Loading...' : 'Create Account'}
                                </Text>
                            </LinearGradient>
                        </Pressable>



                        {/* Google Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.googleButton,
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
        backgroundColor: theme.colors.background.primary,
    },
    container: {
        flex: 1,
    },
    backButton: {
        padding: theme.spacing.lg,
    },
    backButtonText: {
        color: '#D9E4FF',
        fontSize: theme.typography.sizes.lg,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    header: {
        marginBottom: theme.spacing['3xl'],
    },
    title: {
        fontSize: theme.typography.sizes['4xl'],
        fontWeight: 'bold',
        color: theme.colors.white,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: theme.typography.sizes.lg,
        color: theme.colors.text.secondary,
    },
    form: {
        gap: theme.spacing.lg,
    },
    input: {
        backgroundColor: theme.colors.surface.DEFAULT,
        borderRadius: theme.borderRadius.lg,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        fontSize: theme.typography.sizes.lg,
        color: theme.colors.text.primary,
        borderWidth: 1,
        borderColor: 'rgba(217, 228, 255, 0.2)',
    },
    errorText: {
        color: theme.colors.error,
        fontSize: theme.typography.sizes.sm,
        textAlign: 'center',
    },
    signupButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#D9E4FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    signupButtonGradient: {
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signupButtonText: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: '600',
        color: '#000000',
    },
    buttonDisabled: {
        opacity: 0.5,
    },

    googleButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: theme.borderRadius.xl,
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        flexDirection: 'row',
    },
    googleButtonText: {
        fontSize: theme.typography.sizes.xl,
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
