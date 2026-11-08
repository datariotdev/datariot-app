import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    FlatList,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../Theme/ThemeProvider';
import { generateDeepDive, chatWithVideo, DeepDiveData, DeepDiveMessage } from '../../lib/ai/client';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

interface DeepDiveModalProps {
    visible: boolean;
    video: any | null;
    onClose: () => void;
}

type TabType = 'summary' | 'resources' | 'chat';

// Typing dots for Q&A loading state
const TypingIndicator = () => {
    const dot1 = useSharedValue(0.3);
    const dot2 = useSharedValue(0.3);
    const dot3 = useSharedValue(0.3);

    useEffect(() => {
        dot1.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, false);
        dot2.value = withRepeat(withSequence(withDelay(150, withTiming(1, { duration: 400 })), withTiming(0.3, { duration: 400 })), -1, false);
        dot3.value = withRepeat(withSequence(withDelay(300, withTiming(1, { duration: 400 })), withTiming(0.3, { duration: 400 })), -1, false);
    }, []);

    const style1 = useAnimatedStyle(() => ({ opacity: dot1.value, transform: [{ scale: 0.8 + dot1.value * 0.4 }] }));
    const style2 = useAnimatedStyle(() => ({ opacity: dot2.value, transform: [{ scale: 0.8 + dot2.value * 0.4 }] }));
    const style3 = useAnimatedStyle(() => ({ opacity: dot3.value, transform: [{ scale: 0.8 + dot3.value * 0.4 }] }));

    return (
        <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
                <Animated.View style={[styles.typingDot, style1]} />
                <Animated.View style={[styles.typingDot, style2]} />
                <Animated.View style={[styles.typingDot, style3]} />
            </View>
        </View>
    );
};

export function DeepDiveModal({ visible, video, onClose }: DeepDiveModalProps) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';
    const insets = useSafeAreaInsets();

    const [activeTab, setActiveTab] = useState<TabType>('summary');
    const [loading, setLoading] = useState(false);
    const [deepDiveData, setDeepDiveData] = useState<DeepDiveData | null>(null);

    // Q&A Chat State
    const [chatHistory, setChatHistory] = useState<DeepDiveMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    const chatListRef = useRef<FlatList>(null);
    const chatInputRef = useRef<TextInput>(null);

    // Load AI deep dive content on video change
    useEffect(() => {
        if (visible && video) {
            setLoading(true);
            setDeepDiveData(null);
            setChatHistory([
                {
                    role: 'assistant',
                    content: `Hello! I'm **Orvelis**, your logic partner. I've scanned **"${video.title || 'this video'}"**. Ask me any clarifying questions, or review the tabs above for a full brief.`,
                }
            ]);
            setActiveTab('summary');

            generateDeepDive(video.title || 'Educational Topic', video.description || '')
                .then((data) => {
                    setDeepDiveData(data);
                })
                .catch((err) => {
                    console.error('Deep Dive fetch error:', err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [visible, video]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !video) return;

        const userMsg: DeepDiveMessage = { role: 'user', content: inputText };
        setChatHistory(prev => [...prev, userMsg]);
        const textToSend = inputText;
        setInputText('');
        setChatLoading(true);

        // Scroll to bottom
        setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100);

        try {
            const formattedHistory = chatHistory.map(h => ({
                role: h.role,
                content: h.content
            }));
            const response = await chatWithVideo(
                video.title || 'Video Topic',
                video.description || '',
                textToSend,
                formattedHistory
            );
            setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (e) {
            console.error('Video Chat error:', e);
            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: "Apologies, my synaptic bridge is experiencing latency. Let's try that question again.",
            }]);
        } finally {
            setChatLoading(false);
            setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 150);
        }
    };

    const bg = isDark ? '#000814' : '#FFFFFF';
    const handleBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const textColor = theme.colors.text.primary;
    const subtitleColor = theme.colors.text.secondary;

    const renderChatBubble = ({ item }: { item: DeepDiveMessage }) => {
        const isUser = item.role === 'user';
        return (
            <Animated.View entering={FadeIn.duration(200)} style={isUser ? styles.userBubbleContainer : styles.aiBubbleContainer}>
                {!isUser && (
                    <View style={[styles.aiAvatar, { backgroundColor: theme.colors.primary.DEFAULT }]}>
                        <MaterialCommunityIcons name="robot-excited" size={14} color="#FFF" />
                    </View>
                )}
                <View style={[
                    styles.chatBubble,
                    isUser
                        ? [styles.userBubble, { backgroundColor: theme.colors.primary.DEFAULT }]
                        : [styles.aiBubble, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0.04)' }]
                ]}>
                    <Text style={[styles.chatText, { color: isUser ? '#FFF' : textColor }]}>
                        {item.content}
                    </Text>
                </View>
            </Animated.View>
        );
    };

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
                        <View style={styles.headerInfo}>
                            <View style={[styles.headerIconWrapper, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(14, 165, 233, 0.1)' }]}>
                                <MaterialCommunityIcons name="brain" size={20} color={theme.colors.primary.DEFAULT} />
                            </View>
                            <View style={styles.headerTitles}>
                                <Text style={[styles.sheetTitle, { color: textColor }]}>ORVELIS DEEP DIVE</Text>
                                <Text style={[styles.videoTitle, { color: subtitleColor }]} numberOfLines={1}>
                                    {video?.title || 'Understanding the Topic'}
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={textColor} style={{ opacity: 0.6 }} />
                        </Pressable>
                    </View>

                    {/* Tab Navigation */}
                    <View style={[styles.tabsRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                        {(['summary', 'resources', 'chat'] as TabType[]).map((tab) => {
                            const isActive = activeTab === tab;
                            let icon = '';
                            let label = '';
                            if (tab === 'summary') { icon = 'book-outline'; label = 'Summary'; }
                            else if (tab === 'resources') { icon = 'library-outline'; label = 'Resources'; }
                            else { icon = 'chatbubble-ellipses-outline'; label = 'Ask AI'; }

                            return (
                                <Pressable
                                    key={tab}
                                    onPress={() => setActiveTab(tab)}
                                    style={[styles.tabButton, isActive && { borderBottomColor: theme.colors.primary.DEFAULT }]}
                                >
                                    <Ionicons
                                        name={icon as any}
                                        size={18}
                                        color={isActive ? theme.colors.primary.DEFAULT : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                                    />
                                    <Text style={[
                                        styles.tabLabel,
                                        { color: isActive ? theme.colors.primary.DEFAULT : isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }
                                    ]}>
                                        {label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Content Section */}
                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
                            <Text style={[styles.loaderText, { color: subtitleColor }]}>Synthesizing cognitive models...</Text>
                        </View>
                    ) : (
                        <View style={styles.contentWrapper}>
                            {activeTab === 'summary' && (
                                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                                    <Animated.View entering={FadeInDown.duration(300)}>
                                        <Text style={[styles.sectionTitle, { color: theme.colors.primary.DEFAULT }]}>CONCEPT BRIEF</Text>
                                        <View style={[styles.cardContainer, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0,0,0,0.02)', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                                            <Text style={[styles.summaryText, { color: textColor }]}>
                                                {deepDiveData?.summary || 'Generating summary summary details...'}
                                            </Text>
                                        </View>

                                        <Text style={[styles.sectionTitle, { color: theme.colors.primary.DEFAULT, marginTop: 24 }]}>KEY TERMINOLOGY</Text>
                                        {deepDiveData?.keyTerms.map((term, index) => (
                                            <View
                                                key={index}
                                                style={[
                                                    styles.termCard,
                                                    {
                                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0,0,0,0.01)',
                                                        borderLeftColor: theme.colors.primary.DEFAULT
                                                    }
                                                ]}
                                            >
                                                <Text style={[styles.termName, { color: textColor }]}>{term.term}</Text>
                                                <Text style={[styles.termDef, { color: subtitleColor }]}>{term.definition}</Text>
                                            </View>
                                        ))}
                                    </Animated.View>
                                </ScrollView>
                            )}

                            {activeTab === 'resources' && (
                                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                                    <Animated.View entering={FadeInDown.duration(300)}>
                                        <Text style={[styles.sectionTitle, { color: theme.colors.primary.DEFAULT }]}>RECOMMENDED STUDY</Text>
                                        {deepDiveData?.recommendations.map((rec, index) => {
                                            let icon = 'book';
                                            let iconColor = '#38BDF8';
                                            if (rec.type === 'Video') { icon = 'videocam'; iconColor = '#F43F5E'; }
                                            else if (rec.type === 'Podcast') { icon = 'mic'; iconColor = '#10B981'; }

                                            return (
                                                <View
                                                    key={index}
                                                    style={[
                                                        styles.resourceCard,
                                                        {
                                                            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
                                                        }
                                                    ]}
                                                >
                                                    <View style={styles.resourceHeader}>
                                                        <View style={[styles.resourceIcon, { backgroundColor: iconColor + '20' }]}>
                                                            <Ionicons name={icon as any} size={16} color={iconColor} />
                                                        </View>
                                                        <View style={styles.resourceMeta}>
                                                            <Text style={[styles.resourceTitle, { color: textColor }]}>{rec.title}</Text>
                                                            <View style={styles.badgeRow}>
                                                                <Text style={[styles.typeBadge, { color: iconColor }]}>{rec.type.toUpperCase()}</Text>
                                                                {(rec.readTime || rec.duration) && (
                                                                    <Text style={styles.timeBadge}>{rec.readTime || rec.duration}</Text>
                                                                )}
                                                            </View>
                                                        </View>
                                                    </View>
                                                    <Text style={[styles.resourceReason, { color: subtitleColor }]}>{rec.reason}</Text>
                                                </View>
                                            );
                                        })}
                                    </Animated.View>
                                </ScrollView>
                            )}

                            {activeTab === 'chat' && (
                                <View style={styles.chatWrapper}>
                                    <FlatList
                                        ref={chatListRef}
                                        data={chatHistory}
                                        keyExtractor={(_, index) => index.toString()}
                                        renderItem={renderChatBubble}
                                        contentContainerStyle={styles.chatListContent}
                                        showsVerticalScrollIndicator={false}
                                        ListFooterComponent={() => (
                                            chatLoading ? <TypingIndicator /> : null
                                        )}
                                    />

                                    {/* Input bar */}
                                    <View style={[styles.inputRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', paddingBottom: insets.bottom + 8 }]}>
                                        <TextInput
                                            ref={chatInputRef}
                                            value={inputText}
                                            onChangeText={setInputText}
                                            placeholder="Ask Orvelis a question..."
                                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                                    color: textColor,
                                                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                                }
                                            ]}
                                            multiline={false}
                                            onSubmitEditing={handleSendMessage}
                                            returnKeyType="send"
                                        />
                                        <Pressable
                                            onPress={handleSendMessage}
                                            disabled={chatLoading || !inputText.trim()}
                                            style={[
                                                styles.sendBtn,
                                                {
                                                    backgroundColor: inputText.trim() ? theme.colors.primary.DEFAULT : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
                                                }
                                            ]}
                                        >
                                            {chatLoading ? (
                                                <ActivityIndicator size="small" color="#FFF" />
                                            ) : (
                                                <Ionicons name="arrow-up" size={18} color={inputText.trim() ? '#FFF' : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
                                            )}
                                        </Pressable>
                                    </View>
                                </View>
                            )}
                        </View>
                    )}
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
        height: '75%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
    },
    handle: {
        width: 36,
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
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    headerIconWrapper: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitles: {
        flex: 1,
    },
    sheetTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
    },
    videoTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
    // Tabs
    tabsRow: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        borderBottomWidth: 1,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Content wrapper
    contentWrapper: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 12,
    },
    loaderText: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 12,
    },
    cardContainer: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
    },
    summaryText: {
        fontSize: 14,
        lineHeight: 22,
    },
    termCard: {
        borderLeftWidth: 3,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    termName: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    termDef: {
        fontSize: 13,
        lineHeight: 18,
    },
    // Resources
    resourceCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
    },
    resourceHeader: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10,
    },
    resourceIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resourceMeta: {
        flex: 1,
        justifyContent: 'center',
    },
    resourceTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 2,
    },
    typeBadge: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    timeBadge: {
        fontSize: 11,
        color: 'rgba(150,150,160,0.8)',
        fontWeight: '600',
    },
    resourceReason: {
        fontSize: 13,
        lineHeight: 18,
    },
    // Chat Screen
    chatWrapper: {
        flex: 1,
    },
    chatListContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
    },
    userBubbleContainer: {
        alignSelf: 'flex-end',
        maxWidth: '85%',
    },
    aiBubbleContainer: {
        flexDirection: 'row',
        gap: 8,
        alignSelf: 'flex-start',
        maxWidth: '85%',
    },
    aiAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    chatBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
    },
    userBubble: {
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        borderBottomLeftRadius: 4,
    },
    chatText: {
        fontSize: 14,
        lineHeight: 20,
    },
    typingContainer: {
        alignSelf: 'flex-start',
        paddingLeft: 32,
        paddingVertical: 4,
    },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(56, 189, 248, 0.8)',
        marginHorizontal: 1.5,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    input: {
        flex: 1,
        borderRadius: 22,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 44,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
});
