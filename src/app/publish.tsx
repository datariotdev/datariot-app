import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from '../components/UI/SafeAreaView';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioRecorder, useAudioPlayer, requestRecordingPermissionsAsync, RecordingPresets, useAudioPlayerStatus } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../lib/supabase/hooks/useAuth';
import { VIDEO_CATEGORIES, CATEGORY_DISPLAY_NAMES, VideoCategory } from '../lib/constants/categories';
import { supabase } from '../lib/supabase/client';
import { generateDebateSeed, generateVideoAnalysis, DebateSeed } from '../lib/ai/client';
import { useTheme } from '../components/Theme/ThemeProvider';

const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
        alert(`${title}\n\n${message}`);
    } else {
        Alert.alert(title, message);
    }
};

export default function PublishScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { videoUri, trimStart, trimEnd, debateId, side } = params;
    const { user } = useAuth();
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const [caption, setCaption] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<VideoCategory | null>(null);
    const [uploading, setUploading] = useState(false);

    // New Media State
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [aiSeed, setAiSeed] = useState<DebateSeed | null>(null);
    const [suggesting, setSuggesting] = useState(false);

    const videoPlayer = useVideoPlayer((videoUri as string) || null, player => {
        player.loop = false;
        player.muted = true;
    });

    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const audioPlayer = useAudioPlayer(audioUri);
    const audioStatus = useAudioPlayerStatus(audioPlayer);
    const isPlaying = audioStatus.playing;
    const isRecording = recorder.isRecording;

    // --- Image Picker ---
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permission needed', 'Please allow access to your photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            // Clear other media types if needed (e.g. valid only one attachment)
            setAudioUri(null);
        }
    };

    // --- Audio Recording ---
    async function startRecording() {
        try {
            const { granted } = await requestRecordingPermissionsAsync();
            if (granted) {
                await recorder.prepareToRecordAsync();
                recorder.record();
                // Clear other media
                setImageUri(null);
                setAudioUri(null);
            } else {
                showAlert('Permission needed', 'Microphone access is required.');
            }
        } catch (err) {
            console.error('Failed to start recording', err);
        }
    }

    async function stopRecording() {
        if (!recorder.isRecording) return;

        await recorder.stop();
        setAudioUri(recorder.uri);
    }

    function playSound() {
        if (!audioUri) return;

        if (audioPlayer.currentTime >= audioPlayer.duration && audioPlayer.duration > 0) {
            audioPlayer.seekTo(0);
        }
        audioPlayer.play();
    }

    function stopSound() {
        audioPlayer.pause();
    }

    // --- Posting ---
    const handlePost = async () => {
        const hasMedia = videoUri || imageUri || audioUri;
        if (!caption.trim() && !hasMedia) {
            showAlert('Empty Post', 'Please write something or attach media.');
            return;
        }

        if (!user) {
            showAlert('Error', 'You must be logged in.');
            return;
        }

        setUploading(true);

        const uploadFile = async (uri: string, bucket: string, path: string) => {
            let body: any;
            const filename = uri.split('/').pop() || 'file';
            const exc = filename.split('.').pop() || '';
            const type = bucket === 'videos' ? 'video/mp4' : (bucket === 'images' ? 'image/jpeg' : 'audio/mpeg');

            if (Platform.OS === 'web') {
                try {
                    const response = await fetch(uri);
                    body = await response.blob();
                } catch (fetchErr) {
                    console.error("Failed to fetch blob URL:", fetchErr);
                    throw new Error("Could not read local file. Please try again.");
                }
            } else {
                const formData = new FormData();
                formData.append('file', {
                    uri,
                    name: filename,
                    type: type,
                } as any);
                body = formData;
            }

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, body, {
                    contentType: type,
                    upsert: true
                });

            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
            return publicUrl;
        };

        try {
            let uploadedVideoUrl = null;
            let uploadedImageUrl = null;

            if (debateId) {
                // Video ARGUMENT flow
                let videoId = null;
                if (videoUri) {
                    const fileName = `${user.id}/${Date.now()}.mp4`;
                    uploadedVideoUrl = await uploadFile(videoUri as string, 'videos', fileName);

                    const { data: vData, error: vError } = await supabase
                        .from('videos')
                        .insert({
                            user_id: user.id,
                            title: `Response to ${debateId}`,
                            url: uploadedVideoUrl,
                            duration: Math.round((Number(trimEnd || 0) - Number(trimStart || 0)) / 1000) || 600
                        })
                        .select('id')
                        .single();
                    if (vError) throw vError;
                    videoId = vData.id;
                }

                const prefix = side === 'AGAINST' ? 'AGAINST:|' : 'FOR:|';
                const { error: commentError } = await supabase
                    .from('comments')
                    .insert({
                        post_id: debateId,
                        user_id: user.id,
                        text: prefix + caption,
                        video_id: videoId
                    });
                if (commentError) throw commentError;

            } else {
                // New DEBATE thesis flow
                if (videoUri) {
                    const fileName = `${user.id}/${Date.now()}.mp4`;
                    uploadedVideoUrl = await uploadFile(videoUri as string, 'videos', fileName);

                    const { error: videoError } = await supabase
                        .from('videos')
                        .insert({
                            user_id: user.id,
                            title: caption.substring(0, 50) || 'New Short Video',
                            description: caption,
                            url: uploadedVideoUrl,
                            category: selectedCategory,
                            duration: Math.round((Number(trimEnd || 0) - Number(trimStart || 0)) / 1000) || 600
                        });
                    if (videoError) throw videoError;
                } else if (imageUri) {
                    const fileName = `${user.id}/${Date.now()}.jpg`;
                    uploadedImageUrl = await uploadFile(imageUri, 'posts', fileName);
                }

                const { data: postData, error: postError } = await supabase
                    .from('posts')
                    .insert({
                        user_id: user.id,
                        content: caption,
                        image_url: uploadedImageUrl,
                        is_published: true,
                        video_url: videoUri ? uploadedVideoUrl : null
                    })
                    .select('id')
                    .single();

                if (postError) {
                    console.error("Post insert error:", postError);
                    throw postError;
                }

                // AI Seeding: Insert generated arguments
                if (aiSeed && postData) {
                    const aiArgs = aiSeed.arguments.map(arg => ({
                        post_id: postData.id,
                        user_id: user.id,
                        text: `AI_ORACLE:|${arg.side}:|${arg.text}`,
                        likes_count: arg.strength,
                        is_published: true
                    }));

                    await supabase.from('comments').insert(aiArgs);
                }
            }

            // Wait a sec for propagation
            await new Promise(resolve => setTimeout(resolve, 500));

            showAlert('Success', 'Published!');
            router.replace('/(tabs)/profile'); // Or back to feed
        } catch (error: any) {
            console.error(error);
            showAlert('Error', 'Failed to publish: ' + (error.message || 'Unknown error'));
        } finally {
            setUploading(false);
        }
    };

    // Verification State
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verified' | 'rejected'>('idle');

    useEffect(() => {
        if (videoUri) {
            verifyVideoContent();
        } else {
            setVerificationStatus('idle');
        }
    }, [videoUri]);

    const verifyVideoContent = async () => {
        setIsVerifying(true);
        setVerificationStatus('idle');

        try {
            // Real AI Analysis
            const analysis = await generateVideoAnalysis();
            if (analysis) {
                setVerificationStatus('verified');
            } else {
                setVerificationStatus('rejected');
            }
        } catch (error) {
            console.error("AI Verification error:", error);
            setVerificationStatus('idle');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleAISuggest = async () => {
        setSuggesting(true);
        try {
            const seed = await generateDebateSeed(caption || "New Video");
            if (seed) {
                setCaption(seed.thesis);
                setAiSeed(seed);
                setVerificationStatus('verified');
            }
        } catch (error) {
            console.error("AI Suggestion error:", error);
            showAlert("Error", "AI is currently resting. Try again soon!");
        } finally {
            setSuggesting(false);
        }
    };

    const isVideoSelection = !!videoUri;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={[styles.cancelText, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamilies.medium }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handlePost}
                    disabled={uploading || isVerifying || (isVideoSelection && verificationStatus !== 'verified')}
                    style={[
                        styles.postButton,
                        {
                            backgroundColor: isDark ? '#D9E4FF' : '#4C6EF5',
                        },
                        (uploading || isVerifying || (isVideoSelection && verificationStatus !== 'verified')) && styles.disabledButton
                    ]}
                >
                    {uploading ? (
                        <ActivityIndicator color={isDark ? '#000000' : '#ffffff'} size="small" />
                    ) : (
                        <Text style={[
                            styles.postButtonText,
                            {
                                color: isDark ? '#000000' : '#ffffff',
                                fontFamily: theme.typography.fontFamilies.bold
                            }
                        ]}>Post</Text>
                    )}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* User Info (Optional) */}
                    <View style={styles.userInfo}>
                        <View style={[
                            styles.avatarPlaceholder,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }
                        ]}>
                            <Text style={[styles.avatarText, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}>
                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <Text style={[styles.username, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.semibold }]}>
                            @{user?.email?.split('@')[0] || 'username'}
                        </Text>
                    </View>

                    {/* Text Input */}
                    <TextInput
                        style={[
                            styles.textInput,
                            {
                                color: theme.colors.text.primary,
                                fontFamily: theme.typography.fontFamilies.regular,
                                // @ts-ignore - Web outline reset
                                outlineStyle: 'none',
                                outlineWidth: 0,
                            }
                        ]}
                        placeholder={isVideoSelection ? "Write a caption..." : "State your thesis..."}
                        placeholderTextColor={theme.colors.text.muted}
                        multiline
                        value={caption}
                        onChangeText={setCaption}
                        autoFocus={!isVideoSelection}
                    />

                    {/* AI Suggestion Button */}
                    <TouchableOpacity
                        style={[
                            styles.aiSuggestBtn,
                            {
                                backgroundColor: isDark ? 'rgba(217, 228, 255, 0.08)' : 'rgba(76, 110, 245, 0.06)',
                                borderColor: isDark ? 'rgba(217, 228, 255, 0.15)' : 'rgba(76, 110, 245, 0.12)',
                                borderWidth: 1,
                            },
                            suggesting && { opacity: 0.7 }
                        ]}
                        onPress={handleAISuggest}
                        disabled={suggesting}
                    >
                        {suggesting ? (
                            <ActivityIndicator size="small" color={isDark ? '#D9E4FF' : '#4C6EF5'} />
                        ) : (
                            <>
                                <Ionicons name="sparkles" size={16} color={isDark ? '#D9E4FF' : '#4C6EF5'} />
                                <Text style={[
                                    styles.aiSuggestText,
                                    { color: isDark ? '#D9E4FF' : '#4C6EF5', fontFamily: theme.typography.fontFamilies.bold }
                                ]}>
                                    AI Logic Oracle: Extract Thesis
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* PREVIEWS */}
                    {isVideoSelection && (
                        <View style={[
                            styles.mediaPreview,
                            {
                                backgroundColor: isDark ? '#000000' : 'rgba(0,0,0,0.02)',
                                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                borderWidth: 1,
                            }
                        ]}>
                            <VideoView
                                player={videoPlayer}
                                style={styles.video}
                                contentFit="cover"
                                nativeControls={false}
                            />

                            {/* Verification Overlay */}
                            {isVerifying && (
                                <View style={styles.verificationOverlay}>
                                    <ActivityIndicator size="large" color={isDark ? '#D9E4FF' : '#4C6EF5'} />
                                    <Text style={[styles.verificationText, { fontFamily: theme.typography.fontFamilies.medium }]}>Verifying AI Content...</Text>
                                </View>
                            )}

                            {/* Verification Badges */}
                            {!isVerifying && verificationStatus === 'verified' && (
                                <View style={[styles.videoBadge, { backgroundColor: 'rgba(34, 197, 94, 0.9)' }]}>
                                    <Ionicons name="checkmark-circle" size={14} color="white" />
                                    <Text style={[styles.videoBadgeText, { fontFamily: theme.typography.fontFamilies.bold }]}>AI Verified</Text>
                                </View>
                            )}

                            {!isVerifying && verificationStatus === 'rejected' && (
                                <View style={styles.errorOverlay}>
                                    <Ionicons name="alert-circle" size={48} color="#ef4444" />
                                    <Text style={[styles.errorTitle, { fontFamily: theme.typography.fontFamilies.bold }]}>Verification Failed</Text>
                                    <Text style={[styles.errorText, { fontFamily: theme.typography.fontFamilies.regular }]}>
                                        This video does not appear to be high-quality content.
                                        Please upload engaging short videos only.
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {imageUri && (
                        <View style={[
                            styles.imagePreviewContainer,
                            {
                                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                borderWidth: 1,
                            }
                        ]}>
                            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                            <TouchableOpacity style={styles.removeMedia} onPress={() => setImageUri(null)}>
                                <Ionicons name="close" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {audioUri && (
                        <View style={[
                            styles.audioPreviewContainer,
                            {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                borderWidth: 1,
                            }
                        ]}>
                            <TouchableOpacity
                                onPress={isPlaying ? stopSound : playSound}
                                style={[
                                    styles.playButton,
                                    { backgroundColor: isDark ? '#D9E4FF' : '#4C6EF5' }
                                ]}
                            >
                                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={isDark ? '#000000' : '#ffffff'} />
                            </TouchableOpacity>
                            <View style={styles.audioWaveform}>
                                <View style={[styles.bar, { height: 12, backgroundColor: isDark ? '#D9E4FF' : '#4C6EF5' }]} />
                                <View style={[styles.bar, { height: 20, backgroundColor: isDark ? '#D9E4FF' : '#4C6EF5' }]} />
                                <View style={[styles.bar, { height: 16, backgroundColor: isDark ? '#D9E4FF' : '#4C6EF5' }]} />
                                <View style={[styles.bar, { height: 24, backgroundColor: isDark ? '#D9E4FF' : '#4C6EF5' }]} />
                                <View style={[styles.bar, { height: 10, backgroundColor: isDark ? '#D9E4FF' : '#4C6EF5' }]} />
                            </View>
                            <TouchableOpacity style={styles.deleteAudio} onPress={() => {
                                setAudioUri(null);
                            }}>
                                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Category Selection */}
                    {isVideoSelection && (
                        <View style={styles.categorySection}>
                            <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamilies.bold }]}>Select Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
                                {VIDEO_CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setSelectedCategory(cat)}
                                        style={[
                                            styles.categoryChip,
                                            {
                                                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                                                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                                                borderWidth: 1,
                                            },
                                            selectedCategory === cat && {
                                                backgroundColor: isDark ? '#D9E4FF' : '#4C6EF5',
                                                borderColor: isDark ? '#D9E4FF' : '#4C6EF5',
                                            }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            {
                                                color: theme.colors.text.secondary,
                                                fontFamily: theme.typography.fontFamilies.medium
                                            },
                                            selectedCategory === cat && {
                                                color: isDark ? '#000000' : '#FFFFFF',
                                                fontFamily: theme.typography.fontFamilies.bold
                                            }
                                        ]}>
                                            {CATEGORY_DISPLAY_NAMES[cat]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                </ScrollView>

                {/* TOOLBAR */}
                {!isVideoSelection && (
                    <View style={[styles.toolbar, { backgroundColor: theme.colors.background.primary, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
                        <TouchableOpacity
                            style={[styles.toolbarButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }]}
                            onPress={pickImage}
                        >
                            <Ionicons name="image-outline" size={24} color={isDark ? '#D9E4FF' : '#4C6EF5'} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.toolbarButton,
                                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' },
                                isRecording && styles.recordingButton
                            ]}
                            onPressIn={startRecording}
                            onPressOut={stopRecording}
                        >
                            <MaterialIcons
                                name="mic"
                                size={24}
                                color={isRecording ? "#FFF" : (isDark ? '#D9E4FF' : '#4C6EF5')}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.toolbarButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }]}>
                            <MaterialIcons name="poll" size={24} color={isDark ? '#D9E4FF' : '#4C6EF5'} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.toolbarButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' }]}>
                            <Ionicons name="location-outline" size={24} color={isDark ? '#D9E4FF' : '#4C6EF5'} />
                        </TouchableOpacity>

                        {isRecording && (
                            <Text style={styles.recordingText}>Recording...</Text>
                        )}
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    cancelText: {
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 8,
    },
    postButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    disabledButton: {
        opacity: 0.5,
    },
    postButtonText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    content: {
        flex: 1,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
    },
    username: {
        fontSize: 16,
    },
    textInput: {
        fontSize: 18,
        minHeight: 120,
        textAlignVertical: 'top',
        paddingHorizontal: 20,
        paddingTop: 16,
    },

    // Media Previews
    mediaPreview: {
        marginHorizontal: 20,
        height: 250,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        marginTop: 10,
    },
    categorySection: {
        marginTop: 24,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14,
        marginBottom: 12,
        opacity: 0.8,
    },
    categoryList: {
        gap: 8,
        paddingRight: 20,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    categoryChipText: {
        fontSize: 14,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    videoBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    videoBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },

    imagePreviewContainer: {
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 16,
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
        borderRadius: 16,
    },
    removeMedia: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    audioPreviewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 20,
        padding: 12,
        borderRadius: 16,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    audioWaveform: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        gap: 4,
    },
    bar: {
        width: 4,
        borderRadius: 2,
    },
    deleteAudio: {
        padding: 8,
    },

    // Toolbar
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
    },
    toolbarButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    recordingButton: {
        backgroundColor: '#ef4444',
    },
    recordingText: {
        color: '#ef4444',
        marginLeft: 'auto',
        fontWeight: 'bold',
    },
    verificationOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    verificationText: {
        color: '#FFF',
        marginTop: 10,
        fontSize: 14,
        fontWeight: '600',
    },
    errorOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        padding: 20,
    },
    errorTitle: {
        color: '#ef4444',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
    },
    errorText: {
        color: '#ccc',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    aiSuggestBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginHorizontal: 20,
        marginTop: 8,
        gap: 8,
        alignSelf: 'flex-start',
    },
    aiSuggestText: {
        fontSize: 13,
    },
});
