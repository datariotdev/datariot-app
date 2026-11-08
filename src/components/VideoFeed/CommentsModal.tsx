import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    FlatList,
    Image,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useComments, Comment } from '@lib/supabase/hooks/useComments';
import { useAuth } from '@lib/supabase/hooks/useAuth';
import { useTheme } from '../Theme/ThemeProvider';

interface CommentsModalProps {
    visible: boolean;
    videoId: string | null;
    onClose: () => void;
}

function CommentRow({
    comment,
    isDark,
    isOwn,
    onLike,
    onReply,
    onDelete,
}: {
    comment: Comment;
    isDark: boolean;
    isOwn: boolean;
    onLike: (id: string) => void;
    onReply: (id: string, name: string) => void;
    onDelete: (id: string) => void;
}) {
    const heartScale = useRef(new Animated.Value(1)).current;

    const handleLike = () => {
        Animated.sequence([
            Animated.spring(heartScale, { toValue: 1.5, useNativeDriver: true, speed: 60, bounciness: 12 }),
            Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 8 }),
        ]).start();
        onLike(comment.id);
    };

    const handleDelete = () => {
        Alert.alert('Delete comment', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(comment.id) },
        ]);
    };

    return (
        <View style={styles.commentRow}>
            <Image
                source={{ uri: comment.authorAvatar || `https://ui-avatars.com/api/?name=${comment.authorName}&background=222&color=fff` }}
                style={styles.commentAvatar}
            />
            <View style={styles.commentBody}>
                <View style={styles.commentBubble}>
                    <Text style={[styles.commentAuthor, { color: isDark ? '#fff' : '#111' }]}>
                        {comment.authorName}
                    </Text>
                    <Text style={[styles.commentText, { color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' }]}>
                        {comment.content}
                    </Text>
                </View>
                <View style={styles.commentMeta}>
                    <Text style={styles.commentTime}>{comment.timestamp}</Text>
                    <Pressable onPress={() => onReply(comment.id, comment.authorName)} hitSlop={12}>
                        <Text style={[styles.replyBtn]}>Reply</Text>
                    </Pressable>
                    <Pressable onPress={handleLike} style={[styles.commentLike, comment.isLiked && styles.commentLikePill]} hitSlop={16}>
                        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                            <Text style={[styles.sparkle, comment.isLiked && { color: '#D9E4FF' }]}>✦</Text>
                        </Animated.View>
                        {comment.likes > 0 && (
                            <Text style={[styles.commentLikeCount, comment.isLiked && { color: '#D9E4FF' }]}>
                                {comment.likes}
                            </Text>
                        )}
                    </Pressable>
                    {isOwn && (
                        <Pressable onPress={handleDelete} hitSlop={16} style={styles.deleteBtn}>
                            <Ionicons name="trash-outline" size={17} color={isDark ? 'rgba(255,80,80,0.85)' : 'rgba(200,0,0,0.7)'} />
                        </Pressable>
                    )}
                </View>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <View style={styles.repliesContainer}>
                        {comment.replies.map(reply => (
                            <View key={reply.id} style={styles.replyRow}>
                                <Image
                                    source={{ uri: reply.authorAvatar || `https://ui-avatars.com/api/?name=${reply.authorName}&background=333&color=fff` }}
                                    style={styles.replyAvatar}
                                />
                                <View style={styles.commentBubble}>
                                    <Text style={[styles.commentAuthor, { color: isDark ? '#fff' : '#111' }]}>
                                        {reply.authorName}
                                    </Text>
                                    <Text style={[styles.commentText, { color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)' }]}>
                                        {reply.content}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

export function CommentsModal({ visible, videoId, onClose }: CommentsModalProps) {
    const { mode } = useTheme();
    const isDark = mode === 'dark';
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { comments, loading, posting, fetchComments, postComment, toggleLikeComment, deleteComment } = useComments(videoId);
    const [text, setText] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (visible && videoId) {
            fetchComments();
            Animated.spring(slideAnim, {
                toValue: 1,
                useNativeDriver: true,
                speed: 14,
                bounciness: 5,
            }).start();
        } else {
            slideAnim.setValue(0);
        }
    }, [visible, videoId]);

    const handleReply = useCallback((id: string, name: string) => {
        setReplyTo({ id, name });
        inputRef.current?.focus();
    }, []);

    const handleSend = async () => {
        if (!text.trim() || !user) return;
        await postComment(text, replyTo?.id);
        setText('');
        setReplyTo(null);
    };

    const bg = isDark ? '#111' : '#f9f9f9';
    const handleBg = isDark ? '#333' : '#ddd';

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={[styles.sheet, { backgroundColor: bg }]}
                    keyboardVerticalOffset={0}
                >
                    {/* Handle bar */}
                    <View style={[styles.handle, { backgroundColor: handleBg }]} />

                    {/* Header */}
                    <View style={styles.sheetHeader}>
                        <Text style={[styles.sheetTitle, { color: isDark ? '#fff' : '#111' }]}>
                            Comments
                        </Text>
                        <Pressable onPress={onClose} hitSlop={12}>
                            <Ionicons name="close" size={22} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
                        </Pressable>
                    </View>

                    {/* Comments list — flex:1 so it fills space and pushes input to bottom */}
                    <View style={styles.listWrapper}>
                        {loading ? (
                            <View style={styles.loader}>
                                <ActivityIndicator color="#D9E4FF" />
                            </View>
                        ) : comments.length === 0 ? (
                            <View style={styles.empty}>
                                <Text style={[styles.emptyText, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)' }]}>
                                    No comments yet. Be the first!
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={comments}
                                keyExtractor={c => c.id}
                                renderItem={({ item }) => (
                                    <CommentRow
                                        comment={item}
                                        isDark={isDark}
                                        isOwn={item.authorId === user?.id}
                                        onLike={toggleLikeComment}
                                        onReply={handleReply}
                                        onDelete={deleteComment}
                                    />
                                )}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>

                    {/* Reply indicator */}
                    {replyTo && (
                        <View style={[styles.replyIndicator, { backgroundColor: isDark ? 'rgba(217, 228, 255, 0.15)' : 'rgba(217, 228, 255, 0.08)' }]}>
                            <Text style={styles.replyIndicatorText}>Replying to @{replyTo.name}</Text>
                            <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
                                <Ionicons name="close" size={16} color="rgba(217, 228, 255, 0.8)" />
                            </Pressable>
                        </View>
                    )}

                    {/* Input row */}
                    <View style={[styles.inputRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', paddingBottom: insets.bottom + 8 }]}>
                        <TextInput
                            ref={inputRef}
                            value={text}
                            onChangeText={setText}
                            placeholder={user ? 'Write a comment...' : 'Sign in to comment'}
                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                            style={[
                                styles.input,
                                {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                                    color: isDark ? '#fff' : '#111',
                                }
                            ]}
                            multiline
                            maxLength={500}
                            editable={!!user}
                            returnKeyType="send"
                            onSubmitEditing={handleSend}
                        />
                        <Pressable
                            onPress={handleSend}
                            disabled={posting || !text.trim() || !user}
                            style={[
                                styles.sendBtn,
                                {
                                    backgroundColor: text.trim() && user ? '#D9E4FF' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                                }
                            ]}
                        >
                            {posting ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Ionicons name="arrow-up" size={18} color={text.trim() && user ? '#000' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
                            )}
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        height: '70%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    listWrapper: {
        flex: 1,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 4,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    sheetTitle: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    loader: {
        padding: 40,
        alignItems: 'center',
    },
    empty: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 15,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 4,
    },
    commentRow: {
        flexDirection: 'row',
        gap: 10,
        paddingVertical: 8,
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        flexShrink: 0,
    },
    commentBody: {
        flex: 1,
        gap: 4,
    },
    commentBubble: {
        gap: 2,
    },
    commentAuthor: {
        fontSize: 13,
        fontWeight: '700',
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
    },
    commentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    commentTime: {
        fontSize: 12,
        color: 'rgba(140,140,150,0.9)',
    },
    replyBtn: {
        fontSize: 12,
        fontWeight: '600',
        color: '#D9E4FF',
    },
    commentLike: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginLeft: 'auto',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 12,
    },
    commentLikePill: {
        backgroundColor: 'rgba(217, 228, 255, 0.1)',
    },
    sparkle: {
        fontSize: 14,
        color: 'rgba(150,150,160,0.8)',
        fontWeight: '700',
    },
    commentLikeCount: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(140,140,150,0.9)',
    },
    repliesContainer: {
        marginTop: 6,
        gap: 8,
        paddingLeft: 4,
        borderLeftWidth: 2,
        borderLeftColor: 'rgba(217, 228, 255, 0.2)',
    },
    replyRow: {
        flexDirection: 'row',
        gap: 8,
    },
    replyAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
    },
    replyIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 16,
        borderRadius: 10,
        marginBottom: 4,
    },
    replyIndicatorText: {
        fontSize: 13,
        color: '#D9E4FF',
        fontWeight: '600',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        maxHeight: 100,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginBottom: 2,
    },
    deleteBtn: {
        padding: 4,
        marginLeft: 'auto',
    },
});
