import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../components/Theme/ThemeProvider';
import * as SplashScreen from 'expo-splash-screen';
import {
    useFonts,
    Oxanium_400Regular,
    Oxanium_500Medium,
    Oxanium_600SemiBold,
    Oxanium_700Bold
} from '@expo-google-fonts/oxanium';
import {
    Orbitron_400Regular,
    Orbitron_500Medium,
    Orbitron_600SemiBold,
    Orbitron_700Bold,
    Orbitron_900Black
} from '@expo-google-fonts/orbitron';
import {
    Audiowide_400Regular
} from '@expo-google-fonts/audiowide';
import {
    Syncopate_400Regular,
    Syncopate_700Bold
} from '@expo-google-fonts/syncopate';
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold
} from '@expo-google-fonts/inter';
import {
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black
} from '@expo-google-fonts/outfit';
import {
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold
} from '@expo-google-fonts/space-grotesk';

import { Feather, Ionicons, MaterialCommunityIcons, Entypo, SimpleLineIcons, AntDesign, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

SplashScreen.preventAutoHideAsync();

function AppContent() {
    const { mode } = useTheme();
    const systemAreaBackground = mode === 'dark' ? '#08090D' : '#DCE6F8';
    const [fontsLoaded, fontError] = useFonts({
        Oxanium_400Regular,
        Oxanium_500Medium,
        Oxanium_600SemiBold,
        Oxanium_700Bold,
        Orbitron_400Regular,
        Orbitron_500Medium,
        Orbitron_600SemiBold,
        Orbitron_700Bold,
        Orbitron_900Black,
        Audiowide_400Regular,
        Syncopate_400Regular,
        Syncopate_700Bold,
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Outfit_300Light,
        Outfit_400Regular,
        Outfit_500Medium,
        Outfit_600SemiBold,
        Outfit_700Bold,
        Outfit_800ExtraBold,
        Outfit_900Black,
        SpaceGrotesk_400Regular,
        SpaceGrotesk_500Medium,
        SpaceGrotesk_700Bold,
        ...Feather.font,
        ...Ionicons.font,
        ...MaterialCommunityIcons.font,
        ...Entypo.font,
        ...SimpleLineIcons.font,
        ...AntDesign.font,
        ...FontAwesome5.font,
        ...MaterialIcons.font,
    });

    useEffect(() => {
        if (fontsLoaded || fontError) {
            SplashScreen.hideAsync().catch(() => { });
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

    return (
        <>
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: systemAreaBackground }}>
                <SafeAreaProvider>
                    <Stack screenOptions={{ contentStyle: { backgroundColor: '#08090D' } }}>
                        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                        <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
                        <Stack.Screen name="auth" options={{ headerShown: false }} />
                        <Stack.Screen name="editor" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
                    </Stack>
                </SafeAreaProvider>
            </GestureHandlerRootView>
            {Platform.OS === 'web' && (
                <>
                    <Analytics />
                    <SpeedInsights />
                </>
            )}
        </>
    );
}

export default function RootLayout() {
    return <ThemeProvider><AppContent /></ThemeProvider>;
}
