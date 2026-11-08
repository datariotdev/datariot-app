import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Switch, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatItem } from '../../components/UI/ChatItem';
import { useRouter } from 'expo-router';
import { useChats } from '../../lib/supabase/hooks/useChats';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../lib/supabase/hooks/useAuth';
import { useTheme } from '../../components/Theme/ThemeProvider';

interface Profile {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
}

// Mock Data
const AI_BOT = {
    id: 'ai-bot',
    name: 'Orvelis AI',
    message: 'I can help you analyze that improved engagement strategy.',
    time: 'Now',
    isAi: true,
    unreadCount: 3,
};

// Removed mock THOUGHTS
export default function InboxScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [isFocusMode, setIsFocusMode] = useState(false);
    const { chats, loading } = useChats();

    // Search state
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [foundUsers, setFoundUsers] = useState<Profile[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        if (searchQuery.length >= 2) {
            searchUsers(searchQuery);
        } else {
            setFoundUsers([]);
        }
    }, [searchQuery]);

    const searchUsers = async (query: string) => {
        if (!user) return;
        setSearchLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .ilike('username', `%${query}%`)
                .neq('id', user.id)
                .limit(20);

            if (error) throw error;
            setFoundUsers(data || []);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const startChat = async (targetUser: Profile) => {
        if (!user) return;
        try {
            // Check if we already have a chat with this user locally
            const existingChat = chats.find(c => c.id === targetUser.id);
            let chatId = existingChat?.chat_id;

            if (!chatId) {
                // Determine a consistent chat ID structure or attempt creation
                const { data: newChat, error: createError } = await supabase
                    .from('chats')
                    .insert({ type: 'direct' })
                    .select('id')
                    .single();

                if (createError) throw createError;
                chatId = newChat.id;

                // Attempt to insert participants one by one to avoid total failure if one is blocked by RLS
                // First, add yourself (should usually work due to RLS)
                const { error: selfError } = await supabase
                    .from('chat_participants')
                    .insert({ chat_id: chatId, user_id: user.id });

                if (selfError) {
                    console.error('Error adding self as participant:', selfError.message);
                }

                // Then try to add the other person
                const { error: otherError } = await supabase
                    .from('chat_participants')
                    .insert({ chat_id: chatId, user_id: targetUser.id });

                if (otherError) {
                    console.log('Note: Could not add other participant via RLS (common), proceeding anyway.');
                }
            }

            // Close search and go to chat
            setIsSearching(false);
            setSearchQuery('');
            router.push({
                pathname: `/chat/[id]` as any,
                params: { id: chatId, name: targetUser.display_name || targetUser.username, userId: targetUser.id }
            });

        } catch (error) {
            console.error('Error starting chat:', error);
            // Fallback: If creation completely fails, use the targetUser ID to let useMessages try its fallback
            setIsSearching(false);
            setSearchQuery('');
            router.push({
                pathname: `/chat/[id]` as any,
                params: { id: targetUser.id, name: targetUser.display_name || targetUser.username, userId: targetUser.id }
            });
        }
    };

    const handleChatPress = (id: string, name?: string) => {
        if (id === 'ai-bot') {
            router.push('/ai');
        } else {
            router.push({
                pathname: `/chat/[id]` as any,
                params: { id, name }
            });
        }
    };

    const { theme, mode } = useTheme();
    const isDark = mode === 'dark';

    const renderHeader = () => (
        <View>
            {/* Focus Mode & Calls Header */}
            <View style={styles.topControls}>
                <TouchableOpacity
                    style={[styles.focusButton, { backgroundColor: isDark ? '#FFFFFF' : theme.colors.text.primary }, isFocusMode && [styles.focusButtonActive, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.1)' }]]}
                    onPress={() => setIsFocusMode(!isFocusMode)}
                >
                    <Ionicons
                        name={isFocusMode ? "moon" : "sunny"}
                        size={16}
                        color={isFocusMode ? theme.colors.background.primary : theme.colors.background.primary}
                    />
                    <Text style={[styles.focusText, { color: isDark ? '#000' : theme.colors.background.primary }, isFocusMode && [styles.focusTextActive, { color: theme.colors.text.primary }]]}>
                        {isFocusMode ? "Focus On" : "Focus Off"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.callsButton} disabled>
                    <Ionicons name="call" size={20} color={theme.colors.primary.DEFAULT} />
                </TouchableOpacity>
            </View>

            {/* Title & Search Button */}
            <View style={styles.titleRow}>
                <Text style={[styles.pageTitle, { color: theme.colors.text.primary }]}>Messages</Text>
                <TouchableOpacity style={[styles.searchButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => setIsSearching(!isSearching)}>
                    <Ionicons name={isSearching ? "close" : "search"} size={22} color={theme.colors.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            {isSearching && (
                <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <Ionicons name="search" size={20} color={theme.colors.text.muted} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.colors.text.primary }]}
                        placeholder="Search users to chat..."
                        placeholderTextColor={theme.colors.text.muted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        autoFocus
                    />
                </View>
            )}

            {!isSearching && (
                <>
                    {/* AI Section */}
                    <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>ASSISTANT</Text>
                    <ChatItem
                        {...AI_BOT}
                        onPress={() => handleChatPress(AI_BOT.id)}
                    />
                </>
            )}
        </View>
    );

    if (isSearching) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]} edges={['top']}>
                {renderHeader()}
                {searchLoading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color={theme.colors.primary.DEFAULT} />
                    </View>
                ) : (
                    <FlatList
                        data={foundUsers}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            searchQuery.length >= 2 ? (
                                <Text style={[styles.emptyText, { color: theme.colors.text.muted }]}>No users found</Text>
                            ) : (
                                <Text style={[styles.emptyText, { color: theme.colors.text.muted }]}>Type at least 2 characters to search</Text>
                            )
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity style={[styles.userItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} onPress={() => startChat(item)}>
                                <View style={[styles.avatar, { backgroundColor: theme.colors.primary.DEFAULT }]}>
                                    <Text style={styles.avatarText}>
                                        {(item.display_name || item.username)[0].toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={[styles.displayName, { color: theme.colors.text.primary }]}>{item.display_name || item.username}</Text>
                                    <Text style={[styles.username, { color: theme.colors.text.secondary }]}>@{item.username}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]} edges={['top']}>
            <FlatList
                data={chats}
                keyExtractor={(item) => item.chat_id || item.id}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ color: theme.colors.text.muted }}>
                            {loading ? 'Loading chats...' : 'No conversations yet.'}
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <ChatItem
                        {...item}
                        onPress={() => handleChatPress(item.chat_id, item.name)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 100,
    },
    topControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 10,
    },
    focusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    focusButtonActive: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    focusText: {
        marginLeft: 6,
        fontWeight: '600',
        fontSize: 12,
        color: '#000',
    },
    focusTextActive: {
        color: '#FFF',
    },
    callsButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(217, 228, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
        marginTop: 10,
    },
    pageTitle: {
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    searchButton: {
        padding: 10,
        borderRadius: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 48,
        borderRadius: 24,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 12,
        letterSpacing: 1.5,
        opacity: 0.6,
    },
    // Removed thoughts styles
    fab: {
        position: 'absolute',
        bottom: 90,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#D9E4FF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    // Search List Styles
    listContainer: {
        paddingHorizontal: 20,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'center',
        marginTop: 20,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#D9E4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    displayName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    username: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        marginTop: 2,
    },
});
