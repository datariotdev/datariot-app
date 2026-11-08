import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../Theme/ThemeProvider';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface MoreOptionsModalProps {
    visible: boolean;
    onClose: () => void;
    onDeepDive: () => void;
}

export function MoreOptionsModal({ visible, onClose, onDeepDive }: MoreOptionsModalProps) {
    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const bg = isDark ? '#000814' : '#FFFFFF';
    const handleBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    const textColor = theme.colors.text.primary;
    const subtitleColor = theme.colors.text.secondary;

    const handleSelectDeepDive = () => {
        onClose();
        // Small delay to let closing animation finish before opening the next modal
        setTimeout(() => {
            onDeepDive();
        }, 300);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={[styles.sheet, { backgroundColor: bg }]}>
                    {/* Handle bar */}
                    <View style={[styles.handle, { backgroundColor: handleBg }]} />

                    {/* Header */}
                    <View style={styles.sheetHeader}>
                        <Text style={[styles.sheetTitle, { color: textColor }]}>Options</Text>
                        <Pressable onPress={onClose} hitSlop={12} style={styles.closeButton}>
                            <Ionicons name="close" size={22} color={textColor} style={{ opacity: 0.6 }} />
                        </Pressable>
                    </View>

                    {/* Options List */}
                    <View style={styles.optionsContainer}>
                        <Pressable
                            onPress={handleSelectDeepDive}
                            style={({ pressed }) => [
                                styles.optionCard,
                                {
                                    backgroundColor: isDark 
                                        ? (pressed ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.03)') 
                                        : (pressed ? 'rgba(14, 165, 233, 0.08)' : 'rgba(0,0,0,0.02)'),
                                    borderColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.15)'
                                }
                            ]}
                        >
                            <LinearGradient
                                colors={isDark ? ['rgba(56, 189, 248, 0.05)', 'transparent'] : ['rgba(14, 165, 233, 0.03)', 'transparent']}
                                style={StyleSheet.absoluteFillObject}
                            />
                            <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.1)' }]}>
                                <MaterialCommunityIcons name="brain" size={24} color={theme.colors.primary.DEFAULT} />
                            </View>
                            <View style={styles.optionDetails}>
                                <Text style={[styles.optionTitle, { color: textColor }]}>Orvelis AI Deep Dive</Text>
                                <Text style={[styles.optionDesc, { color: subtitleColor }]}>
                                    Summarize concepts, view terms, and chat with AI
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={subtitleColor} style={{ opacity: 0.5 }} />
                        </Pressable>
                    </View>
                </View>
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
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingBottom: Platform.OS === 'ios' ? 44 : 28,
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
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    sheetTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    closeButton: {
        padding: 4,
    },
    optionsContainer: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 16,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionDetails: {
        flex: 1,
        marginRight: 8,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    optionDesc: {
        fontSize: 12,
        marginTop: 3,
        lineHeight: 16,
    },
});
