import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useMessages } from '../../lib/supabase/hooks/useMessages';
import { supabase } from '../../lib/supabase/client';
import { useTheme } from '../../components/Theme/ThemeProvider';

export default function ChatScreen() {
    const { id, name, userId } = useLocalSearchParams<{ id: string; name?: string; userId?: string }>();
    const router = useRouter();
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const [inputText, setInputText] = useState('');
    const { chatId, messages, loading, error, retry, sendMessage } = useMessages(id, userId);
    const [sendError, setSendError] = useState('');
    const [sending, setSending] = useState(false);
    const busy = React.useRef(false);
    const [uploading, setUploading] = useState(false);
    const flatListRef = React.useRef<FlatList>(null);
    const insets = useSafeAreaInsets();

    const handleSend = async () => {
        const draft = inputText;
        if (!draft.trim() || !chatId || busy.current) return;

        busy.current = true;
        setSending(true);
        setSendError('');
        try {
            await sendMessage(draft.trim());
            setInputText(current => current === draft ? '' : current);
        } catch {
            setSendError('Message couldn’t be sent. Tap send to try again.');
        } finally {
            busy.current = false;
            setSending(false);
        }
    };

    const attachMedia = async () => {
        if (!chatId || !supabase || busy.current) return;
        busy.current = true;
        setUploading(true);
        setSendError('');
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'],
                allowsEditing: true,
                quality: 0.8,
            });
            const asset = result.assets?.[0];
            if (result.canceled || !asset) return;

            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const fileExt = asset.uri.split('.').pop() || 'mp4';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${chatId}/${fileName}`;
            const bucket = supabase.storage.from('chat-media');
            const { error: uploadError } = await bucket.upload(filePath, blob, {
                contentType: asset.mimeType || `video/${fileExt === 'mov' ? 'quicktime' : fileExt}`,
            });
            if (uploadError) throw uploadError;

            await sendMessage('Sent a video', bucket.getPublicUrl(filePath).data.publicUrl, 'video');
        } catch {
            setSendError('Video couldn’t be sent. Please try again.');
        } finally {
            busy.current = false;
            setUploading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <LinearGradient
                colors={isDark ? ['#000000', '#000000'] : ['#FFFFFF', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                    style={{ flex: 1 }}
                >
                    {/* Header */}
                    <View style={[styles.header, { borderBottomWidth: 0 }]}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="chevron-back" size={24} color={theme.colors.primary.light} />
                        </TouchableOpacity>
                        <View style={styles.headerInfo}>
                            <Text style={[styles.headerTitle, { color: theme.colors.primary.light }]}>{name || 'Chat'}</Text>
                            <Text style={[styles.headerStatus, { color: theme.colors.primary.DEFAULT }]}>SYSTEM.ONLINE</Text>
                        </View>
                        <TouchableOpacity style={[styles.headerAction, { backgroundColor: isDark ? 'rgba(217, 228, 255, 0.1)' : 'rgba(217, 228, 255, 0.05)' }]}>
                            <Ionicons name="call" size={22} color={theme.colors.primary.light} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.headerAction, { marginLeft: 8, backgroundColor: isDark ? 'rgba(217, 228, 255, 0.1)' : 'rgba(217, 228, 255, 0.05)' }]}>
                            <Ionicons name="videocam" size={24} color={theme.colors.primary.light} />
                        </TouchableOpacity>
                    </View>

                    {/* Messages */}
                    {error ? (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.text.primary} />
                            <Text style={{ color: theme.colors.text.primary, textAlign: 'center', marginTop: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{error}</Text>
                            <TouchableOpacity
                                onPress={retry} accessibilityRole="button"
                                style={{ marginTop: 20, padding: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, borderWidth: 1, borderColor: theme.colors.primary.light }}
                            >
                                <Text style={{ color: theme.colors.text.primary }}>Try again</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.messageList}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            ListEmptyComponent={loading ? <ActivityIndicator color={theme.colors.primary.light} style={{ marginTop: 50 }} /> : null}
                            renderItem={({ item }) => (
                                <View style={[
                                    styles.messageBubble,
                                    item.sender === 'me' ? styles.myBubble : styles.theirBubble,
                                    item.media_url ? styles.mediaBubble : null
                                ]}>
                                    {item.media_url ? (
                                        <View style={styles.videoPlaceholder}>
                                            <Ionicons name="play-circle" size={48} color={theme.colors.primary.DEFAULT} />
                                            <Text style={{ color: '#FFFFFF', marginTop: 8 }}>Video Message</Text>
                                        </View>
                                    ) : (
                                        item.sender === 'me' ? (
                                            <View style={[styles.myBubbleContent, { backgroundColor: isDark ? 'rgba(217, 228, 255, 0.15)' : 'rgba(217, 228, 255, 0.1)', borderColor: theme.colors.primary.light }]}>
                                                <Text style={[styles.messageTextMy, { color: theme.colors.primary.light }]}>{item.content}</Text>
                                            </View>
                                        ) : (
                                            <View style={[styles.theirBubbleContent, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]}>
                                                <Text style={[styles.messageTextTheir, { color: theme.colors.text.primary }]}>{item.content}</Text>
                                            </View>
                                        )
                                    )}
                                    <Text style={styles.messageTime}>{item.time}</Text>
                                </View>
                            )}
                        />
                    )}

                    {/* Input */}
                    <View style={[styles.floatingInputWrapper, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                        {sendError ? (
                            <Text accessibilityRole="alert" style={{ color: theme.colors.text.primary, marginBottom: 8 }}>{sendError}</Text>
                        ) : null}
                        <View style={[styles.floatingInputContainer, { backgroundColor: isDark ? 'rgba(217, 228, 255, 0.05)' : 'rgba(217, 228, 255, 0.05)' }]}>
                            <TouchableOpacity style={styles.attachButton} onPress={attachMedia} disabled={!chatId || uploading || sending} accessibilityLabel="Attach a video">
                                {uploading ? (
                                    <ActivityIndicator size="small" color={theme.colors.primary.light} />
                                ) : (
                                    <Ionicons name="add-circle" size={28} color={theme.colors.primary.light} />
                                )}
                            </TouchableOpacity>
                            <TextInput
                                style={[styles.input, { color: theme.colors.primary.light }]}
                                placeholder="> MESSAGE..."
                                placeholderTextColor="rgba(217, 228, 255, 0.5)"
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                            />
                            <TouchableOpacity onPress={handleSend} disabled={!chatId || !inputText.trim() || uploading || sending}
                                accessibilityRole="button" accessibilityLabel="Send message" accessibilityState={{ busy: sending }}
                                style={styles.sendButtonContainer}>
                                <View style={[styles.sendButton, { backgroundColor: theme.colors.primary.light }]}>
                                    {sending ? <ActivityIndicator size="small" color="#000" /> : <Ionicons name="arrow-up" size={20} color="#000" />}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        textTransform: 'uppercase',
    },
    headerStatus: {
        fontSize: 11,
        fontWeight: 'bold',
        marginTop: 2,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        letterSpacing: 1,
    },
    headerAction: {
        padding: 10,
        backgroundColor: 'rgba(217, 228, 255, 0.1)',
        borderRadius: 20,
    },
    messageList: {
        padding: 16,
        paddingBottom: 20, // Reduced padding since input is not floating over it anymore
        gap: 16,
    },
    messageBubble: {
        maxWidth: '82%',
    },
    myBubble: {
        alignSelf: 'flex-end',
    },
    theirBubble: {
        alignSelf: 'flex-start',
    },
    myBubbleContent: {
        padding: 12,
        paddingHorizontal: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 4,
    },
    theirBubbleContent: {
        padding: 12,
        paddingHorizontal: 16,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        borderBottomLeftRadius: 4,
    },
    mediaBubble: {
        padding: 4,
    },
    videoPlaceholder: {
        width: 240,
        height: 180,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        overflow: 'hidden',
    },
    messageTextMy: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    messageTextTheir: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    messageTime: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 10,
        marginTop: 6,
        paddingHorizontal: 4,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        letterSpacing: 0.5,
    },
    floatingInputWrapper: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    floatingInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        borderRadius: 8,
    },
    attachButton: {
        padding: 8,
        marginHorizontal: 4,
    },
    input: {
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 12,
        fontSize: 14,
        maxHeight: 100,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    sendButtonContainer: {
        padding: 4,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
