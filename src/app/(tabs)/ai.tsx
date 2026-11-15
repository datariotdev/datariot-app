import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, Easing } from 'react-native-reanimated';
import { OrvelisMark } from '../../components/AI/OrvelisMark';
import { OrvelisWelcome } from '../../components/AI/OrvelisWelcome';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { generateVideoAnalysis, chatWithAI, generateDailyInsight, VideoAnalysis, DailyInsight } from '../../lib/ai/client';

type ToolType = 'chat' | 'insight' | 'analyze';

interface Message {
    id: string;
    role: 'user' | 'system' | 'assistant';
    content: string;
    type?: 'text' | 'analysis' | 'insight';
    data?: any;
}

// Generate unique IDs
let _msgIdCounter = 0;
const uniqueId = () => `msg_${Date.now()}_${++_msgIdCounter}`;

// Animated typing dots component
const TypingIndicator = () => {
    const dot1 = useSharedValue(0.3);
    const dot2 = useSharedValue(0.3);
    const dot3 = useSharedValue(0.3);

    useEffect(() => {
        dot1.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 400 }),
                withTiming(0.3, { duration: 400 })
            ), -1, false
        );
        dot2.value = withRepeat(
            withSequence(
                withDelay(150, withTiming(1, { duration: 400 })),
                withTiming(0.3, { duration: 400 })
            ), -1, false
        );
        dot3.value = withRepeat(
            withSequence(
                withDelay(300, withTiming(1, { duration: 400 })),
                withTiming(0.3, { duration: 400 })
            ), -1, false
        );
    }, [dot1, dot2, dot3]);

    const style1 = useAnimatedStyle(() => ({ opacity: dot1.value, transform: [{ scale: 0.8 + dot1.value * 0.4 }] }));
    const style2 = useAnimatedStyle(() => ({ opacity: dot2.value, transform: [{ scale: 0.8 + dot2.value * 0.4 }] }));
    const style3 = useAnimatedStyle(() => ({ opacity: dot3.value, transform: [{ scale: 0.8 + dot3.value * 0.4 }] }));

    return (
        <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
                <View style={{ marginRight: 8 }}><OrvelisMark size={14} color="rgba(255,255,255,0.4)" /></View>
                <Animated.View style={[styles.typingDot, style1]} />
                <Animated.View style={[styles.typingDot, style2]} />
                <Animated.View style={[styles.typingDot, style3]} />
            </View>
        </View>
    );
};

// Glow pulse for the header icon
const PulseGlow = () => {
    const pulse = useSharedValue(0.4);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.ease) })
            ), -1, false
        );
    }, [pulse]);

    const glowStyle = useAnimatedStyle(() => ({
        opacity: pulse.value * 0.6,
        transform: [{ scale: 0.9 + pulse.value * 0.2 }],
    }));

    return (
        <Animated.View style={[styles.headerGlow, glowStyle]}>
            <LinearGradient
                colors={['rgba(217, 228, 255, 0.3)', 'rgba(217, 228, 255, 0.08)', 'transparent']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />
        </Animated.View>
    );
};

export default function AIScreen() {
    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedTool, setSelectedTool] = useState<ToolType>('chat');

    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    // Refs
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 150);
    }, []);

    const choosePrompt = (prompt: string) => {
        setSelectedTool('chat');
        setInputText(prompt);
        inputRef.current?.focus();
    };

    const handleSendMessage = async () => {
        if (loading || !inputText.trim()) return;

        const userMsg: Message = { id: uniqueId(), role: 'user', content: inputText, type: 'text' };
        setMessages(prev => [...prev, userMsg]);
        const textToSend = inputText;
        setInputText('');
        setLoading(true);
        scrollToBottom();

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));
            const response = await chatWithAI(textToSend, history);

            setMessages(prev => [...prev, {
                id: uniqueId(),
                role: 'assistant',
                content: response,
                type: 'text'
            }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, {
                id: uniqueId(),
                role: 'assistant',
                content: "Connection disrupted. I'm operating in local mode — try again or ask me something I can handle offline.",
                type: 'text'
            }]);
        } finally {
            setLoading(false);
            scrollToBottom();
        }
    };

    const handleToolSelect = async (tool: ToolType) => {
        setSelectedTool(tool);

        if (tool === 'insight') {
            setLoading(true);
            scrollToBottom();
            try {
                const insight = await generateDailyInsight();
                setMessages(prev => [...prev, {
                    id: uniqueId(),
                    role: 'assistant',
                    content: 'Daily Insight Generated',
                    type: 'insight',
                    data: insight
                }]);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
                scrollToBottom();
            }
        } else if (tool === 'analyze') {
            setLoading(true);
            scrollToBottom();
            try {
                const analysis = await generateVideoAnalysis();
                setMessages(prev => [...prev, {
                    id: uniqueId(),
                    role: 'assistant',
                    content: 'Analysis Complete',
                    type: 'analysis',
                    data: analysis
                }]);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
                scrollToBottom();
            }
        }
        // For 'chat', just switch tool — don't trigger anything
    };

    const renderMessage = ({ item }: { item: Message }) => {
        if (item.type === 'insight') {
            const insight = item.data as DailyInsight;
            return (
                <Animated.View entering={FadeInUp.springify()} style={[styles.messageBubble, styles.aiBubble, styles.cardBubble, {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0,0,0,0.005)',
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(14, 165, 233, 0.05)'
                }]}>
                    {/* Subtle gradient overlay */}
                    <LinearGradient
                        colors={isDark ? ['rgba(56, 189, 248, 0.02)', 'transparent'] : ['rgba(14, 165, 233, 0.01)', 'transparent']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                    />
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderIcon}>
                            <MaterialCommunityIcons name="lightning-bolt" size={16} color={theme.colors.primary.DEFAULT} />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>DAILY INSIGHT</Text>
                    </View>
                    <Text style={[styles.insightScore, { color: theme.colors.text.primary }]}>{insight.score}</Text>
                    <View style={styles.insightStatusRow}>
                        <Text style={[styles.insightStatus, { color: theme.colors.primary.DEFAULT }]}>{insight.status}</Text>
                        <View style={[styles.trendBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
                            <Ionicons name="trending-up" size={12} color="#10B981" />
                            <Text style={styles.trendText}>{insight.trend}</Text>
                        </View>
                    </View>
                    <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>{insight.message}</Text>
                </Animated.View>
            );
        }

        if (item.type === 'analysis') {
            const analysis = item.data as VideoAnalysis;
            return (
                <Animated.View entering={FadeInUp.springify()} style={[styles.messageBubble, styles.aiBubble, styles.cardBubble, {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0,0,0,0.005)',
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(14, 165, 233, 0.05)'
                }]}>
                    <LinearGradient
                        colors={isDark ? ['rgba(139, 92, 246, 0.02)', 'transparent'] : ['rgba(139, 92, 246, 0.01)', 'transparent']}
                        style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                    />
                    <View style={styles.cardHeader}>
                        <View style={[styles.cardHeaderIcon, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.05)' : 'rgba(139, 92, 246, 0.02)' }]}>
                            <Feather name="eye" size={14} color="#8B5CF6" />
                        </View>
                        <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>TRUTH ANALYSIS</Text>
                    </View>

                    <View style={styles.analysisSection}>
                        <View style={[styles.analysisLabelBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.02)' }]}>
                            <Text style={[styles.analysisLabel, { color: '#10B981' }]}>ESSENCE</Text>
                        </View>
                        <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>{analysis.essence}</Text>
                    </View>
                    <View style={styles.analysisSection}>
                        <View style={[styles.analysisLabelBadge, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)' }]}>
                            <Text style={[styles.analysisLabel, { color: '#EF4444' }]}>MANIPULATION</Text>
                        </View>
                        <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>{analysis.manipulation}</Text>
                    </View>
                    <View style={styles.analysisSection}>
                        <View style={[styles.analysisLabelBadge, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(56, 189, 248, 0.02)' }]}>
                            <Text style={[styles.analysisLabel, { color: '#38BDF8' }]}>REAL VALUE</Text>
                        </View>
                        <Text style={[styles.cardText, { color: theme.colors.text.secondary }]}>{analysis.realValue}</Text>
                    </View>
                </Animated.View>
            );
        }

        // Regular text messages
        const isUser = item.role === 'user';
        return (
            <Animated.View entering={FadeIn.duration(300)}>
                <View style={[
                    styles.messageBubble,
                    isUser
                        ? [styles.userBubble, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]
                        : styles.aiBubble
                ]}>
                    {!isUser && (
                        <View style={styles.aiMessageHeader}>
                            <View style={[styles.aiMessageDot, { backgroundColor: theme.colors.primary.DEFAULT }]} />
                            <Text style={[styles.aiMessageLabel, { color: theme.colors.text.muted }]}>ORVELIS</Text>
                        </View>
                    )}
                    <Text style={[
                        styles.messageText,
                        { color: isUser ? theme.colors.text.primary : theme.colors.text.secondary }
                    ]}>{item.content}</Text>
                </View>
            </Animated.View>
        );
    };

    const getPlaceholder = () => {
        switch (selectedTool) {
            case 'insight': return "Ask about your insight...";
            case 'analyze': return "Ask about the analysis...";
            default: return "Ask Orvelis anything...";
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <SafeAreaView style={styles.safeArea}>
                {/* Premium Header */}
                <View style={[styles.header, { backgroundColor: theme.colors.background.primary }]}>
                    <PulseGlow />
                    <View style={styles.headerContent}>
                        <View style={[styles.headerIconContainer, {
                            backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(14, 165, 233, 0.08)',
                            borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.2)'
                        }]}>
                            <OrvelisMark size={26} color={theme.colors.primary.DEFAULT} />
                        </View>
                        <View>
                            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Orvelis</Text>
                            <Text style={[styles.headerSubtitle, { color: theme.colors.text.muted }]}>Intelligence by Datariot</Text>
                        </View>
                    </View>
                    <View style={styles.headerStatusWrapper}>
                        <View style={[styles.headerStatusDot, { backgroundColor: '#10B981' }]} />
                        {Platform.OS === 'web' ? (
                            // @ts-ignore
                            <div className="status-pulse-anim" style={{
                                position: 'absolute',
                                width: 14,
                                height: 14,
                                borderRadius: 7,
                                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.25)',
                                zIndex: 1,
                            }} />
                        ) : null}
                    </View>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.chatList, messages.length === 0 && { flexGrow: 1, justifyContent: 'center' }]}
                    ListEmptyComponent={<OrvelisWelcome dark={isDark} onChoosePrompt={choosePrompt} />}
                    renderItem={renderMessage}
                    showsVerticalScrollIndicator={false}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                    style={[styles.keyboardArea, { backgroundColor: theme.colors.background.primary }]}
                >
                    {loading && <TypingIndicator />}

                    {/* Tool Selector */}
                    <View style={styles.toolSelector}>
                        {([
                            { key: 'chat' as ToolType, icon: 'chatbubble-ellipses-outline', label: 'Chat' },
                            { key: 'insight' as ToolType, icon: 'bulb-outline', label: 'Insight' },
                            { key: 'analyze' as ToolType, icon: 'scan-outline', label: 'Analyze' },
                        ] as const).map(tool => (
                            <TouchableOpacity
                                key={tool.key}
                                style={[
                                    styles.toolButton,
                                    selectedTool === tool.key && [styles.toolButtonActive, {
                                        backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.1)',
                                        borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 165, 233, 0.2)'
                                    }]
                                ]}
                                onPress={() => handleToolSelect(tool.key)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={tool.icon as any}
                                    size={18}
                                    color={selectedTool === tool.key ? theme.colors.primary.DEFAULT : theme.colors.text.muted}
                                />
                                <Text style={[
                                    styles.toolText,
                                    selectedTool === tool.key && { color: theme.colors.primary.DEFAULT }
                                ]}>{tool.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Input Area — always editable */}
                    <View style={[styles.inputContainer, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                        <View style={[styles.inputWrapper, {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                        }]}>
                            <TextInput
                                ref={inputRef}
                                accessibilityLabel="Message Orvelis"
                                style={[styles.input, { color: theme.colors.text.primary }]}
                                placeholder={getPlaceholder()}
                                placeholderTextColor={theme.colors.text.muted}
                                value={inputText}
                                onChangeText={setInputText}
                                onSubmitEditing={handleSendMessage}
                                returnKeyType="send"
                                multiline={false}
                            />
                        </View>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Send message"
                            onPress={handleSendMessage}
                            style={[
                                styles.sendButton,
                                {
                                    backgroundColor: inputText.trim()
                                        ? theme.colors.primary.DEFAULT
                                        : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                                }
                            ]}
                            disabled={loading || !inputText.trim()}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="arrow-up"
                                size={20}
                                color={inputText.trim() ? '#FFFFFF' : theme.colors.text.muted}
                            />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
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
    // ===== HEADER =====
    header: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 8 : 16,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
    },
    headerGlow: {
        position: 'absolute',
        top: -40,
        left: '30%',
        width: 200,
        height: 120,
        borderRadius: 100,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginTop: 1,
        textTransform: 'uppercase',
    },
    headerStatusWrapper: {
        width: 14,
        height: 14,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginRight: 4,
    },
    headerStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        zIndex: 2,
    },
    // ===== CHAT LIST =====
    chatList: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 16,
    },
    messageBubble: {
        padding: 14,
        borderRadius: 20,
        marginBottom: 12,
        maxWidth: '88%',
    },
    userBubble: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 6,
    },
    aiBubble: {
        backgroundColor: 'transparent',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 6,
        paddingHorizontal: 4,
    },
    aiMessageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    aiMessageDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    aiMessageLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    cardBubble: {
        width: '95%',
        maxWidth: '100%',
        borderWidth: 1,
        borderRadius: 20,
        padding: 20,
        overflow: 'hidden',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    // ===== KEYBOARD AREA =====
    keyboardArea: {
        width: '100%',
    },
    // ===== TYPING INDICATOR =====
    typingContainer: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    typingDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: 'rgba(56, 189, 248, 0.8)',
        marginHorizontal: 2,
    },
    // ===== TOOL SELECTOR =====
    toolSelector: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    toolButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.04)',
        gap: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    toolButtonActive: {
        // Dynamic styles applied inline
    },
    toolText: {
        color: 'rgba(255, 255, 255, 0.45)',
        fontSize: 13,
        fontWeight: '600',
    },
    // ===== INPUT =====
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
        gap: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    inputWrapper: {
        flex: 1,
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
    },
    input: {
        paddingHorizontal: 18,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        fontSize: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ===== CARD STYLES =====
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    cardHeaderIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
    },
    cardTitle: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 2,
    },
    insightScore: {
        fontSize: 56,
        fontWeight: '800',
        marginBottom: 2,
        letterSpacing: -2,
    },
    insightStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    insightStatus: {
        fontSize: 16,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    trendText: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '700',
    },
    cardText: {
        fontSize: 14,
        lineHeight: 21,
    },
    analysisSection: {
        marginBottom: 14,
    },
    analysisLabelBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginBottom: 6,
    },
    analysisLabel: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
});
