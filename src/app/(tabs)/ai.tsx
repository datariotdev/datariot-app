import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput, KeyboardAvoidingView, Platform, FlatList, Modal, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, Easing } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../components/Theme/ThemeProvider';
import { generateVideoAnalysis, chatWithAI, generateDailyInsight, VideoAnalysis, DailyInsight } from '../../lib/ai/client';

const { width } = Dimensions.get('window');

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

// Example prompts for first-time users
const EXAMPLE_PROMPTS = [
    { iconType: 'material', iconName: 'lightning-bolt', color: '#A5C6FF', text: 'Daily insight', tool: 'insight' as ToolType, desc: 'Focus reading' },
    { iconType: 'material', iconName: 'microscope', color: '#10B981', text: 'Analyze content', tool: 'analyze' as ToolType, desc: 'Truth scan' },
    { iconType: 'material', iconName: 'brain', color: '#8B5CF6', text: 'What can you do?', tool: 'chat' as ToolType, desc: 'Capabilities' },
    { iconType: 'feather', iconName: 'lightbulb', color: '#EC4899', text: 'Tell me something interesting', tool: 'chat' as ToolType, desc: 'Random insight' },
];

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
    }, []);

    const style1 = useAnimatedStyle(() => ({ opacity: dot1.value, transform: [{ scale: 0.8 + dot1.value * 0.4 }] }));
    const style2 = useAnimatedStyle(() => ({ opacity: dot2.value, transform: [{ scale: 0.8 + dot2.value * 0.4 }] }));
    const style3 = useAnimatedStyle(() => ({ opacity: dot3.value, transform: [{ scale: 0.8 + dot3.value * 0.4 }] }));

    return (
        <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
                <MaterialCommunityIcons name="robot-excited-outline" size={14} color="rgba(255,255,255,0.4)" style={{ marginRight: 8 }} />
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
    }, []);

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

const SuggestionChip = ({ prompt, isDark, theme, onPress }: { prompt: any, isDark: boolean, theme: any, onPress: () => void }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Pressable
            style={({ pressed }: any) => [
                styles.suggestionChip,
                {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.65)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                },
                isHovered && {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.95)',
                    borderColor: prompt.color,
                    transform: [{ scale: 1.02 }],
                    shadowColor: prompt.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.2 : 0.08,
                    shadowRadius: 12,
                },
                pressed && {
                    opacity: 0.7,
                }
            ]}
            onPress={onPress}
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
        >
            <View style={[
                styles.suggestionIconContainer,
                {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
                },
                isHovered && {
                    backgroundColor: `${prompt.color}15`,
                    borderColor: `${prompt.color}35`,
                }
            ]}>
                {prompt.iconType === 'feather' ? (
                    <Feather name={prompt.iconName as any} size={15} color={prompt.color} />
                ) : prompt.iconType === 'ionicon' ? (
                    <Ionicons name={prompt.iconName as any} size={15} color={prompt.color} />
                ) : (
                    <MaterialCommunityIcons name={prompt.iconName as any} size={17} color={prompt.color} />
                )}
            </View>
            <View style={styles.suggestionTextWrap}>
                <Text style={[styles.suggestionText, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}>{prompt.text}</Text>
                <Text style={[styles.suggestionDesc, { color: theme.colors.text.muted, fontFamily: theme.typography.fontFamilies.regular }]}>{prompt.desc}</Text>
            </View>
        </Pressable>
    );
};

const AIIntroCard = ({ theme, isDark }: { theme: any, isDark: boolean }) => {
    return (
        <Animated.View 
            entering={FadeInDown.duration(400).springify()}
            style={[
                styles.introCard,
                {
                    backgroundColor: isDark ? 'rgba(14, 16, 23, 0.4)' : 'rgba(255, 255, 255, 0.45)',
                    borderColor: isDark ? 'rgba(217, 228, 255, 0.08)' : 'rgba(107, 127, 204, 0.12)',
                }
            ]}
        >
            {/* Ambient subtle flare background */}
            <LinearGradient
                colors={isDark ? ['rgba(217, 228, 255, 0.01)', 'transparent'] : ['rgba(107, 127, 204, 0.01)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.introHeader}>
                <View style={[
                    styles.introIconContainer,
                    {
                        backgroundColor: isDark ? 'rgba(217, 228, 255, 0.01)' : 'rgba(107, 127, 204, 0.02)',
                        borderColor: isDark ? 'rgba(217, 228, 255, 0.05)' : 'rgba(107, 127, 204, 0.08)',
                    }
                ]}>
                    <MaterialCommunityIcons name="brain" size={22} color={theme.colors.primary.DEFAULT} />
                </View>
                <View style={styles.introHeaderText}>
                    <Text style={[styles.introTitle, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.bold }]}>
                        ORVELIS COGNITIVE CORE
                    </Text>
                    <Text style={[styles.introSubtitle, { color: theme.colors.text.muted, fontFamily: theme.typography.fontFamilies.tech }]}>
                        SECURE SYNAPSE NODE // V1.0.0
                    </Text>
                </View>
            </View>

            <Text style={[styles.introDesc, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamilies.regular }]}>
                Engineered at the intersection of media forensics and high-fidelity intelligence synthesis. Orvelis is designed to stress-test concepts through strategic dialogue, analyze narrative parameters, and generate deep cognitive focus insight readings in real-time.
            </Text>

            <View style={[styles.introDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }]} />

            <View style={styles.introMetaRow}>
                <View style={styles.introMetaCol}>
                    <Text style={[styles.introMetaLabel, { color: theme.colors.text.muted, fontFamily: theme.typography.fontFamilies.tech }]}>
                        STRATEGIC DEPTH
                    </Text>
                    <Text style={[styles.introMetaVal, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.semibold }]}>
                        SYNTHETIC COGNITION
                    </Text>
                </View>
                <View style={styles.introMetaCol}>
                    <Text style={[styles.introMetaLabel, { color: theme.colors.text.muted, fontFamily: theme.typography.fontFamilies.tech }]}>
                        SYNC STATUS
                    </Text>
                    <Text style={[styles.introMetaVal, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamilies.semibold }]}>
                        ⚡ REAL-TIME LATENCY
                    </Text>
                </View>
            </View>
        </Animated.View>
    );
};

export default function AIScreen() {
    // Chat State
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'init',
            role: 'assistant',
            content: "Welcome to the synapse. Select an analysis module below or introduce a query to initiate dialogue.",
            type: 'text'
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedTool, setSelectedTool] = useState<ToolType>('chat');

    // Onboarding State
    const [showSuggestions, setShowSuggestions] = useState(true);

    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    // Refs
    const flatListRef = useRef<FlatList>(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 150);
    }, []);

    const handleExamplePrompt = (prompt: typeof EXAMPLE_PROMPTS[0]) => {
        setShowSuggestions(false);
        setSelectedTool(prompt.tool);

        if (prompt.tool === 'chat') {
            // Immediately send as a message
            const userMsg: Message = { id: uniqueId(), role: 'user', content: prompt.text, type: 'text' };
            setMessages(prev => [...prev, userMsg]);
            setLoading(true);
            scrollToBottom();

            const history = messages.map(m => ({ role: m.role, content: m.content }));
            chatWithAI(prompt.text, history).then(response => {
                setMessages(prev => [...prev, {
                    id: uniqueId(),
                    role: 'assistant',
                    content: response,
                    type: 'text'
                }]);
            }).catch(console.error).finally(() => {
                setLoading(false);
                scrollToBottom();
            });
        } else {
            handleToolSelect(prompt.tool);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        // Hide suggestions after first message
        setShowSuggestions(false);

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
        setShowSuggestions(false);

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
                            <MaterialCommunityIcons name="robot-excited" size={22} color={theme.colors.primary.DEFAULT} />
                        </View>
                        <View>
                            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>Orvelis</Text>
                            <Text style={[styles.headerSubtitle, { color: theme.colors.text.muted }]}>AI Core • Online</Text>
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
                    contentContainerStyle={styles.chatList}
                    ListHeaderComponent={<AIIntroCard theme={theme} isDark={isDark} />}
                    renderItem={renderMessage}
                    showsVerticalScrollIndicator={false}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                    style={[styles.keyboardArea, { backgroundColor: theme.colors.background.primary }]}
                >
                    {/* Example Prompt Suggestions */}
                    {showSuggestions && messages.length <= 1 && (
                        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.suggestionsContainer}>
                            <Text style={[styles.suggestionsTitle, { color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)' }]}>Quick Start</Text>
                            <View style={styles.suggestionsGrid}>
                                {EXAMPLE_PROMPTS.map((prompt, index) => (
                                    <SuggestionChip
                                        key={index}
                                        prompt={prompt}
                                        isDark={isDark}
                                        theme={theme}
                                        onPress={() => handleExamplePrompt(prompt)}
                                    />
                                ))}
                            </View>
                        </Animated.View>
                    )}

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
                            onPress={handleSendMessage}
                            style={[
                                styles.sendButton,
                                {
                                    backgroundColor: inputText.trim()
                                        ? theme.colors.primary.DEFAULT
                                        : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                                }
                            ]}
                            disabled={!inputText.trim()}
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
    // ===== INTRO CARD =====
    introCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
    },
    introHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    introIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    introHeaderText: {
        flex: 1,
    },
    introTitle: {
        fontSize: 12,
        letterSpacing: 2,
    },
    introSubtitle: {
        fontSize: 8,
        letterSpacing: 1.5,
        marginTop: 3,
    },
    introDesc: {
        fontSize: 13,
        lineHeight: 20,
        letterSpacing: 0.2,
    },
    introDivider: {
        height: 1,
        marginVertical: 18,
    },
    introMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    introMetaCol: {
        flex: 1,
    },
    introMetaLabel: {
        fontSize: 8,
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    introMetaVal: {
        fontSize: 10,
        letterSpacing: 0.5,
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
    // ===== SUGGESTION CHIPS =====
    suggestionsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    suggestionsTitle: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 10,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    suggestionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 18,
        borderWidth: 1,
        gap: 12,
        width: '48%',
        // @ts-ignore
        transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
    },
    suggestionIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        // @ts-ignore
        transition: 'all 0.2s ease',
    },
    suggestionTextWrap: {
        flex: 1,
    },
    suggestionText: {
        fontSize: 13,
        fontWeight: '700',
    },
    suggestionDesc: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 1,
    },
});
