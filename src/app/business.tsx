import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Pressable,
    Platform,
    Dimensions,
    Alert,
    Animated,
    KeyboardAvoidingView,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from '@components/UI/SafeAreaView';
import { useTheme } from '../components/Theme/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
    { id: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline' as const, gradient: ['#D9E4FF', '#D9E4FF'] as const },
    { id: 'cafe', label: 'Cafe', icon: 'cafe-outline' as const, gradient: ['#D9E4FF', '#D9E4FF'] as const },
    { id: 'beauty', label: 'Beauty', icon: 'sparkles-outline' as const, gradient: ['#D9E4FF', '#D9E4FF'] as const },
    { id: 'fitness', label: 'Fitness', icon: 'fitness-outline' as const, gradient: ['#D9E4FF', '#D9E4FF'] as const },
    { id: 'shop', label: 'Shop', icon: 'bag-handle-outline' as const, gradient: ['#D9E4FF', '#D9E4FF'] as const },
    { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' as const, gradient: ['#D9E4FF', '#D9E4FF'] as const },
];

const REACH_OPTIONS = [
    { id: 'local', label: 'Local', description: '~5k reach', price: 'Free' },
    { id: 'city', label: 'City', description: '~50k reach', price: '$15/wk' },
    { id: 'national', label: 'National', description: '~500k reach', price: '$75/wk' },
];

export default function BusinessScreen() {
    const router = useRouter();
    const { mode } = useTheme();
    const isDark = mode === 'dark';

    const [selectedCategory, setSelectedCategory] = useState<string>('restaurant');
    const [businessName, setBusinessName] = useState('');
    const [tagline, setTagline] = useState('');
    const [ctaLink, setCtaLink] = useState('');
    const [selectedReach, setSelectedReach] = useState('local');

    const fadeAnim = useRef(new Animated.Value(1)).current;

    const handleCategorySelect = (id: string) => {
        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0.8, duration: 80, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start();
        setSelectedCategory(id);
    };

    const handleLaunch = () => {
        if (!businessName.trim()) {
            Alert.alert('Business Name', 'Please enter your business name.');
            return;
        }
        Alert.alert(
            '🚀 Campaign Created!',
            `"${businessName}" will soon be seen by thousands of people. We'll notify you of the results.`,
            [{ text: 'Great!', onPress: () => router.back() }]
        );
    };

    const selectedCat = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];
    const selectedReachOption = REACH_OPTIONS.find(r => r.id === selectedReach) || REACH_OPTIONS[0];

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            {/* Full-screen gradient background */}
            <LinearGradient
                colors={['#000000', '#000000', '#000000']}
                style={StyleSheet.absoluteFill}
            />

            {/* Top decorative blobs */}
            <View style={[styles.blob, styles.blobTop]} />
            <View style={[styles.blob, styles.blobMid]} />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.8)" />
                        </Pressable>
                        <View style={styles.headerBadge}>
                            <Ionicons name="megaphone-outline" size={13} color="#D9E4FF" />
                            <Text style={styles.headerBadgeText}>For Business</Text>
                        </View>
                    </View>

                    <ScrollView
                        style={styles.scroll}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Hero */}
                        <View style={styles.hero}>
                            <Text style={styles.heroTitle}>
                                Promote{'\n'}
                                <Text style={styles.heroGradientText}>Your Business</Text>
                            </Text>
                            <Text style={styles.heroSubtitle}>
                                Thousands of active users are waiting for your offer. Launch a campaign in 2 minutes.
                            </Text>
                        </View>

                        {/* Category Picker */}
                        <Text style={styles.sectionLabel}>Category</Text>
                        <View style={styles.categoryGrid}>
                            {CATEGORIES.map(cat => {
                                const isActive = cat.id === selectedCategory;
                                return (
                                    <Pressable
                                        key={cat.id}
                                        onPress={() => handleCategorySelect(cat.id)}
                                        style={[
                                            styles.categoryCard,
                                            isActive && styles.categoryCardActive,
                                        ]}
                                    >
                                        {isActive ? (
                                            <LinearGradient
                                                colors={cat.gradient}
                                                style={StyleSheet.absoluteFill}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            />
                                        ) : null}
                                        <Ionicons
                                            name={cat.icon}
                                            size={22}
                                            color={isActive ? '#fff' : 'rgba(255,255,255,0.5)'}
                                        />
                                        <Text style={[styles.categoryLabel, isActive && { color: '#fff', fontWeight: '700' }]}>
                                            {cat.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Form */}
                        <Animated.View style={{ opacity: fadeAnim }}>
                            <BlurView intensity={18} tint="dark" style={styles.formCard}>
                                <Text style={styles.sectionLabel}>Campaign Details</Text>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Business Name *</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="storefront-outline" size={16} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder='e.g. "Bloom Cafe"'
                                            placeholderTextColor="rgba(255,255,255,0.25)"
                                            value={businessName}
                                            onChangeText={setBusinessName}
                                            returnKeyType="next"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Tagline / Offer</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="sparkles-outline" size={16} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Best coffee in town — since 8:00 AM"
                                            placeholderTextColor="rgba(255,255,255,0.25)"
                                            value={tagline}
                                            onChangeText={setTagline}
                                            returnKeyType="next"
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Link (Website / Menu / Social)</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="link-outline" size={16} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="https://..."
                                            placeholderTextColor="rgba(255,255,255,0.25)"
                                            value={ctaLink}
                                            onChangeText={setCtaLink}
                                            autoCapitalize="none"
                                            keyboardType="url"
                                            returnKeyType="done"
                                        />
                                    </View>
                                </View>
                            </BlurView>
                        </Animated.View>

                        {/* Reach */}
                        <Text style={styles.sectionLabel}>Audience Reach</Text>
                        <View style={styles.reachList}>
                            {REACH_OPTIONS.map(opt => {
                                const isActive = opt.id === selectedReach;
                                return (
                                    <Pressable
                                        key={opt.id}
                                        onPress={() => setSelectedReach(opt.id)}
                                        style={[styles.reachCard, isActive && styles.reachCardActive]}
                                    >
                                        {isActive && (
                                            <LinearGradient
                                                colors={['rgba(217, 228, 255,0.2)', 'rgba(217, 228, 255,0.15)']}
                                                style={StyleSheet.absoluteFill}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            />
                                        )}
                                        <View style={styles.reachLeft}>
                                            <View style={[styles.reachRadio, isActive && styles.reachRadioActive]}>
                                                {isActive && <View style={styles.reachRadioDot} />}
                                            </View>
                                            <View>
                                                <Text style={[styles.reachLabel, isActive && { color: '#fff' }]}>{opt.label}</Text>
                                                <Text style={styles.reachDesc}>{opt.description}</Text>
                                            </View>
                                        </View>
                                        <View style={[styles.reachPriceBadge, isActive && { backgroundColor: '#D9E4FF' }]}>
                                            <Text style={styles.reachPriceText}>{opt.price}</Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Ad Preview */}
                        <Text style={styles.sectionLabel}>Ad Preview</Text>
                        <BlurView intensity={18} tint="dark" style={styles.previewCard}>
                            <LinearGradient
                                colors={selectedCat.gradient}
                                style={styles.previewAccent}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                            <View style={styles.previewBody}>
                                <View style={styles.previewTop}>
                                    <View>
                                        <View style={styles.previewBadge}>
                                            <LinearGradient
                                                colors={selectedCat.gradient}
                                                style={StyleSheet.absoluteFill}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                            />
                                            <Text style={styles.previewBadgeText}>{selectedCat.label}</Text>
                                        </View>
                                        <Text style={styles.previewTitle}>
                                            {businessName || 'Business Name'}
                                        </Text>
                                        <Text style={styles.previewTagline}>
                                            {tagline || 'Your tagline will appear here'}
                                        </Text>
                                    </View>
                                    <View style={[styles.previewIcon]}>
                                        <Ionicons name={selectedCat.icon} size={28} color="rgba(255,255,255,0.8)" />
                                    </View>
                                </View>
                                <View style={styles.previewFooter}>
                                    <Text style={styles.previewLink} numberOfLines={1}>
                                        {ctaLink || 'Your link'}
                                    </Text>
                                    <LinearGradient
                                        colors={selectedCat.gradient}
                                        style={styles.previewCta}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.previewCtaText}>Learn More →</Text>
                                    </LinearGradient>
                                </View>
                            </View>
                        </BlurView>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            {[
                                { icon: 'eye-outline', value: selectedReachOption.description.replace('~', ''), label: 'Reach' },
                                { icon: 'trending-up-outline', value: '3.2%', label: 'CTR' },
                                { icon: 'flash-outline', value: '24h', label: 'Launch' },
                            ].map((s, i) => (
                                <BlurView key={i} intensity={18} tint="dark" style={styles.statCard}>
                                    <Ionicons name={s.icon as any} size={18} color="#D9E4FF" />
                                    <Text style={styles.statValue}>{s.value}</Text>
                                    <Text style={styles.statLabel}>{s.label}</Text>
                                </BlurView>
                            ))}
                        </View>

                        {/* CTA Button */}
                        <Pressable onPress={handleLaunch} style={styles.launchWrapper}>
                            <LinearGradient
                                colors={['#D9E4FF', '#D9E4FF']}
                                style={styles.launchBtn}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <MaterialCommunityIcons name="rocket-launch-outline" size={20} color="#fff" />
                                <Text style={styles.launchText}>Launch Campaign</Text>
                            </LinearGradient>
                        </Pressable>

                        <Text style={styles.disclaimer}>
                            By launching a campaign, you agree to the Thinko Advertising Rules.{'\n'}Moderation takes up to 24 hours.
                        </Text>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#000000',
    },
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    blob: {
        position: 'absolute',
        borderRadius: 999,
        opacity: 0.25,
    },
    blobTop: {
        width: 300,
        height: 300,
        backgroundColor: '#D9E4FF',
        top: -80,
        right: -80,
        transform: [{ scale: 1.4 }],
    },
    blobMid: {
        width: 250,
        height: 250,
        backgroundColor: '#D9E4FF',
        top: 350,
        left: -120,
        opacity: 0.12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: 'rgba(217, 228, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(217, 228, 255, 0.3)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    headerBadgeText: {
        color: '#D9E4FF',
        fontSize: 12,
        fontWeight: '600',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    hero: {
        marginBottom: 28,
        marginTop: 8,
    },
    heroTitle: {
        fontSize: 38,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -1.2,
        lineHeight: 44,
        marginBottom: 12,
    },
    heroGradientText: {
        color: '#D9E4FF',
    },
    heroSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.5)',
        lineHeight: 22,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 12,
        marginTop: 4,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 24,
    },
    categoryCard: {
        width: (SCREEN_WIDTH - 60) / 3,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    categoryCardActive: {
        borderColor: 'transparent',
    },
    categoryLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
    },
    formCard: {
        borderRadius: 20,
        overflow: 'hidden',
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.45)',
        fontWeight: '600',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 14,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        paddingVertical: 14,
    },
    reachList: {
        gap: 10,
        marginBottom: 24,
    },
    reachCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    reachCardActive: {
        borderColor: 'rgba(217, 228, 255, 0.4)',
    },
    reachLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    reachRadio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reachRadioActive: {
        borderColor: '#D9E4FF',
    },
    reachRadioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D9E4FF',
    },
    reachLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 2,
    },
    reachDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.35)',
    },
    reachPriceBadge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    reachPriceText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    previewCard: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 24,
    },
    previewAccent: {
        height: 4,
    },
    previewBody: {
        padding: 18,
    },
    previewTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    previewBadge: {
        alignSelf: 'flex-start',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginBottom: 8,
        overflow: 'hidden',
    },
    previewBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    previewTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
        maxWidth: SCREEN_WIDTH * 0.55,
    },
    previewTagline: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        maxWidth: SCREEN_WIDTH * 0.6,
        lineHeight: 18,
    },
    previewIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        paddingTop: 14,
        gap: 10,
    },
    previewLink: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.35)',
        flex: 1,
    },
    previewCta: {
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    previewCtaText: {
        color: '#000000',
        fontSize: 12,
        fontWeight: '700',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 28,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        gap: 4,
    },
    statValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 10,
        fontWeight: '600',
    },
    launchWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 12,
    },
    launchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        borderRadius: 18,
    },
    launchText: {
        color: '#000000',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    disclaimer: {
        textAlign: 'center',
        fontSize: 11,
        color: 'rgba(255,255,255,0.25)',
        lineHeight: 18,
    },
});
