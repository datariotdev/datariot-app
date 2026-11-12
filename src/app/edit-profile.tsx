import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { lightColors } from '@components/Theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { supabase } from '@lib/supabase/client';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

const { background, primary, surface, text } = lightColors;

export default function EditProfile() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingHeader, setUploadingHeader] = useState(false);

    // Log states for debugging
    console.log('EditProfile states:', { loading, uploadingAvatar, uploadingHeader });

    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');

    // Preview states (can be local URIs or remote URLs)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [headerPreview, setHeaderPreview] = useState<string | null>(null);

    // Final URLs (must be remote URLs for saving to DB)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [headerUrl, setHeaderUrl] = useState<string | null>(null);

    const getProfile = useCallback(async () => {
        try {
            setLoading(true);
            if (!user) throw new Error('No user on the session!');

            const { data, error, status } = await supabase
                .from('profiles')
                .select('username, display_name, avatar_url, bio, banner_url')
                .eq('id', user.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setUsername(data.username || '');
                setDisplayName(data.display_name || '');
                setAvatarUrl(data.avatar_url);
                setAvatarPreview(data.avatar_url);
                setBio(data.bio || '');
                setHeaderUrl(data.banner_url);
                setHeaderPreview(data.banner_url);
            }
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('Error', error.message);
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            getProfile();
        }
    }, [user, getProfile]);

    const updateProfile = async () => {
        console.log('Update profile triggered');
        if (uploadingAvatar || uploadingHeader) {
            Alert.alert('Please wait', 'Images are still uploading...');
            return;
        }

        try {
            setLoading(true);
            if (!user) throw new Error('No user found');

            // Ensure we are using the remote URL if available, otherwise fallback to existing
            // If headerUrl is null, it might mean no change or upload finished but state lagged? 
            // Actually, uploadImage sets headerUrl directly.
            // But if user didn't change it, headerUrl starts as null unless we initialized it.
            // Wait, we initialize headerUrl in getProfile.

            // Logic:
            // 1. If we have a new remote URL from upload (headerUrl), use it.
            // 2. If we haven't uploaded a new one, we should use the one from getProfile.
            // Problem: In getProfile we set headerUrl to data.banner_url.
            // So headerUrl should hold the current remote URL.
            // Unless... uploadImage failed?

            // Let's use a robust selection:
            const finalAvatarUrl = avatarUrl && avatarUrl.startsWith('http') ? avatarUrl : (avatarPreview && avatarPreview.startsWith('http') ? avatarPreview : null);
            const finalHeaderUrl = headerUrl && headerUrl.startsWith('http') ? headerUrl : (headerPreview && headerPreview.startsWith('http') ? headerPreview : null);

            console.log('Final URLs for save:', { finalAvatarUrl, finalHeaderUrl });

            const updates = {
                id: user.id,
                username: username.trim(),
                display_name: displayName.trim(),
                bio: bio.trim(),
                avatar_url: finalAvatarUrl,
                banner_url: finalHeaderUrl,
                updated_at: new Date().toISOString(),
            };

            console.log('Upserting profile with:', updates);

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) {
                // Check for missing column error (PostgREST code PGRST204 is common for schema cache issues, 
                // but sometimes it's 42703 'undefined_column' in the message details)
                if (error.code === 'PGRST204' || error.message.includes('Could not find the') || error.message.includes('column')) {
                    console.warn('Schema mismatch detected. Attempting partial save...');

                    // Fallback: Save only standard columns
                    const standardUpdates = {
                        id: user.id,
                        username: username.trim(),
                        display_name: displayName.trim(),
                        avatar_url: finalAvatarUrl,
                        updated_at: new Date().toISOString(),
                    };

                    const { error: fallbackError } = await supabase
                        .from('profiles')
                        .upsert(standardUpdates);

                    if (fallbackError) throw fallbackError;

                    Alert.alert(
                        'Saved (Partial)',
                        'Profile name and avatar saved. Bio and Header could not be saved because the database schema is missing those columns. Please run the SQL script to fix this.'
                    );
                    router.back();
                    return;
                }

                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Profile updated successfully');
            Alert.alert('Success', 'Profile updated!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
            console.log('Update profile attempt finished');
        }
    };

    const pickImage = async (type: 'avatar' | 'header') => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: type === 'avatar' ? [1, 1] : [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0].uri) {
                const localUri = result.assets[0].uri;

                // Set preview immediately
                if (type === 'avatar') {
                    setAvatarPreview(localUri);
                } else {
                    setHeaderPreview(localUri);
                }

                uploadImage(localUri, type);
            }
        } catch {
            Alert.alert('Error', 'Error picking image');
        }
    };



    const uploadImage = async (uri: string, type: 'avatar' | 'header') => {
        const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingHeader;
        try {
            setUploading(true);
            if (!user) return;

            const ext = uri.split('.').pop() || 'png';
            const fileName = `${user.id}/${type}_${Date.now()}.${ext}`;
            const filePath = fileName;

            const bucketName = 'avatars';

            console.log('Reading file (base64):', uri);
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });
            const arrayBuffer = decode(base64);
            console.log('File size (bytes):', arrayBuffer.byteLength);

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, arrayBuffer, {
                    contentType: `image/${ext === 'jpeg' ? 'jpeg' : ext}`,
                    upsert: true
                });

            if (uploadError) {
                if ('message' in uploadError && uploadError.message.includes('Bucket not found')) {
                    throw new Error(`Storage bucket '${bucketName}' not found. Please create it and set to public.`);
                }
                throw uploadError;
            }

            const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

            if (data?.publicUrl) {
                if (type === 'avatar') {
                    console.log('Setting avatar URL:', data.publicUrl);
                    setAvatarUrl(data.publicUrl);
                } else {
                    console.log('Setting header URL:', data.publicUrl);
                    setHeaderUrl(data.publicUrl);
                }
            } else {
                console.warn('GetPublicUrl returned no data');
            }
        } catch (error) {
            console.error('Upload error:', error);
            if (error instanceof Error) {
                Alert.alert('Upload Error', error.message);
            }
        } finally {
            setUploading(false);
        }
    };

    const busy = loading || uploadingAvatar || uploadingHeader;
    const initial = (displayName.trim()[0] || username.trim()[0] || user?.email?.[0] || 'U').toUpperCase();

    return (
        <SafeAreaView style={styles.screen}>
            <StatusBar style="dark" />
            <View style={styles.toolbar}>
                <Pressable accessibilityRole="button" accessibilityLabel="Go back"
                    onPress={() => router.back()} style={styles.back}>
                    <Ionicons name="arrow-back" size={22} color={text.primary} />
                </Pressable>
                <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>Edit profile</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Save profile"
                    accessibilityState={{ disabled: busy, busy }} onPress={updateProfile}
                    style={styles.save} disabled={busy}>
                    {busy ? <ActivityIndicator color={text.primary} size="small" />
                        : <Text style={styles.actionText}>Save</Text>}
                </Pressable>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
                <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Change cover photo"
                        onPress={() => pickImage('header')} style={styles.cover} disabled={uploadingHeader}>
                        {headerPreview ? <Image source={{ uri: headerPreview }} style={StyleSheet.absoluteFill} />
                            : <Ionicons name="image-outline" size={29} color={text.secondary} />}
                        <View style={styles.coverAction}>
                            {uploadingHeader ? <ActivityIndicator color={text.primary} size="small" />
                                : <Ionicons name="camera-outline" size={16} color={text.primary} />}
                            <Text style={styles.actionText}>{headerPreview ? 'Change cover' : 'Add cover'}</Text>
                        </View>
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo"
                        onPress={() => pickImage('avatar')} style={styles.avatarButton} disabled={uploadingAvatar}>
                        <View style={styles.avatar}>
                            {avatarPreview ? <Image source={{ uri: avatarPreview }} style={StyleSheet.absoluteFill} />
                                : <Text style={styles.initial}>{initial}</Text>}
                        </View>
                        <View style={styles.camera}>
                            {uploadingAvatar ? <ActivityIndicator color={text.primary} size="small" />
                                : <Ionicons name="camera-outline" size={15} color={text.primary} />}
                        </View>
                    </Pressable>

                    <View style={styles.form}>
                        <View>
                            <Text style={styles.label}>Display name</Text>
                            <TextInput accessibilityLabel="Display name" style={styles.input}
                                value={displayName} onChangeText={setDisplayName}
                                placeholder="Enter display name" placeholderTextColor={text.secondary} />
                        </View>
                        <View>
                            <Text style={styles.label}>Username</Text>
                            <TextInput accessibilityLabel="Username" style={styles.input}
                                value={username} onChangeText={setUsername}
                                placeholder="Enter username" placeholderTextColor={text.secondary}
                                autoCapitalize="none" autoCorrect={false} />
                        </View>
                        <View>
                            <Text style={styles.label}>Bio</Text>
                            <TextInput accessibilityLabel="Bio" style={[styles.input, styles.bio]}
                                value={bio} onChangeText={setBio} placeholder="A few words about you"
                                placeholderTextColor={text.secondary} multiline textAlignVertical="top" />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: { backgroundColor: background.primary },
    toolbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: surface.border },
    back: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: surface.elevated },
    title: { flex: 1, minWidth: 0, fontFamily: 'Outfit_700Bold', fontSize: 22, color: text.primary },
    save: { minWidth: 70, minHeight: 44, paddingHorizontal: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: primary.ultra },
    actionText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: text.primary },
    body: { flex: 1 },
    content: { width: '100%', maxWidth: 580, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
    cover: { aspectRatio: 3, minHeight: 96, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: background.tertiary },
    coverAction: { position: 'absolute', right: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 34, paddingHorizontal: 9, borderRadius: 10, backgroundColor: surface.elevated },
    avatarButton: { alignSelf: 'flex-start', width: 74, height: 74, marginTop: -24, marginLeft: 12 },
    avatar: { flex: 1, borderRadius: 37, borderWidth: 3, borderColor: background.primary, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: primary.ultra },
    initial: { fontFamily: 'Outfit_600SemiBold', fontSize: 29, color: text.primary },
    camera: { position: 'absolute', right: -2, bottom: -2, width: 29, height: 29, borderRadius: 15, borderWidth: 2, borderColor: background.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: primary.ultra },
    form: { gap: 18, paddingTop: 16 },
    label: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, marginBottom: 7, color: text.primary },
    input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Outfit_400Regular', fontSize: 16, color: text.primary, backgroundColor: surface.elevated, borderColor: surface.borderHover },
    bio: { minHeight: 104 },
});
