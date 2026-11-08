import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@design-system/theme';
import { Ionicons } from '@expo/vector-icons';

export type MessageType = 'user' | 'ai';

interface ChatMessageProps {
    type: MessageType;
    text: string;
    timestamp?: string;
}

export const ChatMessage = ({ type, text, timestamp }: ChatMessageProps) => {
    const isUser = type === 'user';

    return (
        <View style={[
            styles.container,
            isUser ? styles.userContainer : styles.aiContainer
        ]}>
            {!isUser && (
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Ionicons name="flash" size={12} color="#FFFFFF" />
                    </View>
                </View>
            )}

            <View style={[
                styles.bubble,
                isUser ? styles.userBubble : styles.aiBubble
            ]}>
                <Text style={[
                    styles.text,
                    isUser ? styles.userText : styles.aiText
                ]}>
                    {text}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
        maxWidth: '100%',
        paddingHorizontal: theme.spacing.sm,
    },
    userContainer: {
        justifyContent: 'flex-end',
    },
    aiContainer: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        marginRight: theme.spacing.sm,
        justifyContent: 'flex-end',
        paddingBottom: 4,
    },
    avatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.primary.DEFAULT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bubble: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 18,
        maxWidth: '80%',
    },
    userBubble: {
        backgroundColor: theme.colors.primary.DEFAULT,
        borderBottomRightRadius: 4,
    },
    aiBubble: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    text: {
        fontSize: theme.typography.sizes.base,
        lineHeight: 22,
    },
    userText: {
        color: '#FFFFFF',
    },
    aiText: {
        color: theme.colors.text.primary,
    },
});
