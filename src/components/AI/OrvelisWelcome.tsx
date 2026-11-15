import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ICE = '#7DA5D9';
const STARTERS = [
  { title: 'Analyze a video', icon: 'play-circle', description: 'Look beyond the headline.', prompt: 'Analyze this video: ', tint: '#EEF4FC', darkTint: '#1A293C', tag: 'UNDERSTAND' },
  { title: 'Check a claim', icon: 'shield', description: 'A fresh look at the facts.', prompt: 'Fact-check this claim: ', tint: '#F2F0FA', darkTint: '#252338', tag: 'QUESTION' },
  { title: 'Explain an idea', icon: 'zap', description: 'Make the complex click.', prompt: 'Explain this idea: ', tint: '#FAF5EC', darkTint: '#302A21', tag: 'EXPLORE' },
] as const;

type Props = { dark: boolean; onChoosePrompt: (prompt: string) => void };

/** Shared by the web and native welcome screens. Cards prepare an editable prompt. */
export function OrvelisWelcome({ dark, onChoosePrompt }: Props) {
  const [width, setWidth] = useState(0);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const { height } = useWindowDimensions();
  const compact = width < 540;
  const short = height < 820;
  const ink = dark ? '#F2F5FA' : '#17202B';
  const muted = dark ? '#A2B0C2' : '#67768A';

  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={styles.container}>
      <View style={[styles.hero, short && styles.heroShort, compact && styles.heroCompact]}>
        <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={[styles.orbit, short && styles.orbitShort, compact && styles.orbitCompact]}>
          <LinearGradient colors={dark ? ['#1D3048', '#10182000'] : ['#E7F0FE', '#FAFBFD00']} style={styles.halo} />
          <View style={[styles.ring, { borderColor: dark ? '#344A67' : '#D9E5F5', transform: [{ rotate: '-24deg' }] }]} />
          <View style={[styles.ring, styles.innerRing, { borderColor: dark ? '#263E5C' : '#E2EAF7', transform: [{ rotate: '28deg' }] }]} />
          <LinearGradient colors={dark ? ['#2E4565', '#1C2C43'] : ['#FFFFFF', '#E4EDFB']} style={[styles.core, { borderColor: dark ? '#48617F' : '#FFFFFF' }]}>
            <MaterialCommunityIcons name="brain" size={35} color={ICE} />
          </LinearGradient>
          <View style={[styles.orbitDot, { backgroundColor: ICE }]} />
          <View style={[styles.smallDot, { backgroundColor: dark ? '#6B7395' : '#BBBBDD' }]} />
        </View>
        {!compact && <View style={[styles.eyebrow, { backgroundColor: dark ? '#1C293B' : '#EDF3FC' }]}>
          <View style={styles.eyebrowDot} />
          <Text style={[styles.eyebrowText, { color: dark ? '#B3CCEF' : '#54749F' }]}>A LITTLE CURIOSITY GOES A LONG WAY</Text>
        </View>}
        <Text accessibilityRole="header" style={[styles.title, short && styles.titleShort, compact && styles.titleCompact, { color: ink }]}>Big ideas start with{ '\n' }<Text style={{ color: dark ? '#A6C7F2' : '#658CBC' }}>a simple question.</Text></Text>
        <Text style={[styles.subtitle, short && styles.subtitleShort, { color: muted }]}>Unpack a video. Challenge a claim.{ '\n' }Find a perspective you haven’t considered.</Text>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: muted }]}>FOLLOW YOUR CURIOSITY</Text>
        {!compact && <Text style={[styles.sectionNote, { color: muted }]}>Pick a starting point</Text>}
      </View>
      <View style={[styles.cards, compact && styles.cardsCompact]}>
        {STARTERS.map((starter, index) => (
          <Pressable key={starter.title} accessibilityRole="button" accessibilityLabel={starter.title}
            accessibilityHint="Adds a prompt to the message field for you to complete."
            onPress={() => onChoosePrompt(starter.prompt)}
            onHoverIn={() => setActiveCard(index)} onHoverOut={() => setActiveCard(null)}
            onFocus={() => setActiveCard(index)} onBlur={() => setActiveCard(null)}
            style={({ pressed }) => [styles.card, compact && styles.cardCompact, {
              backgroundColor: dark ? starter.darkTint : starter.tint,
              borderColor: activeCard === index ? ICE : (dark ? '#344052' : '#E5EAF2'),
              opacity: pressed ? 0.72 : 1,
              transform: [{ translateY: activeCard === index && !compact ? -3 : 0 }],
            }]}>
            <View style={[styles.cardIcon, { backgroundColor: dark ? '#FFFFFF09' : '#FFFFFFC4' }]}>
              <Feather name={starter.icon} size={20} color={ICE} />
            </View>
            <View style={styles.cardCopy}>
              {!compact && <Text style={[styles.cardTag, { color: muted }]}>{starter.tag}</Text>}
              <Text style={[styles.cardTitle, { color: ink }]}>{starter.title}</Text>
              <Text style={[styles.cardDescription, { color: muted }]}>{starter.description}</Text>
            </View>
            <Feather name="arrow-up-right" size={17} color={muted} style={compact ? undefined : styles.cardArrow} />
          </Pressable>
        ))}
      </View>
      <View style={styles.note}>
        <Feather name="message-circle" size={12} color={muted} />
        <Text style={[styles.noteText, { color: muted }]}>Or just ask whatever’s on your mind.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 780, alignSelf: 'center', paddingBottom: 8 },
  hero: { alignItems: 'center', paddingTop: 18, paddingBottom: 30 },
  heroShort: { paddingTop: 4, paddingBottom: 20 },
  heroCompact: { paddingTop: 10, paddingBottom: 22 },
  orbit: { width: 210, height: 108, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  orbitShort: { height: 96, marginBottom: 8 },
  orbitCompact: { height: 64, marginBottom: 0, transform: [{ scale: 0.72 }] },
  halo: { position: 'absolute', width: 160, height: 108, borderRadius: 80 },
  ring: { position: 'absolute', width: 166, height: 64, borderRadius: 90, borderWidth: 1 },
  innerRing: { width: 128, height: 90 },
  core: { width: 70, height: 70, borderRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center', shadowColor: ICE, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 18 },
  orbitDot: { position: 'absolute', width: 9, height: 9, borderRadius: 5, top: 23, right: 32 },
  smallDot: { position: 'absolute', width: 5, height: 5, borderRadius: 3, bottom: 20, left: 39 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  eyebrowDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: ICE },
  eyebrowText: { fontSize: 8, letterSpacing: 1.1, fontWeight: '700' },
  title: { fontSize: 36, lineHeight: 42, letterSpacing: -1.35, fontWeight: '700', textAlign: 'center', marginTop: 17 },
  titleShort: { fontSize: 32, lineHeight: 37, marginTop: 12 },
  titleCompact: { fontSize: 29, lineHeight: 35, letterSpacing: -1, marginTop: 9 },
  subtitle: { fontSize: 13, lineHeight: 21, textAlign: 'center', marginTop: 12 },
  subtitleShort: { lineHeight: 19, marginTop: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 9, fontWeight: '700', letterSpacing: 1.7 },
  sectionNote: { fontSize: 11 },
  cards: { flexDirection: 'row', gap: 10 },
  cardsCompact: { flexDirection: 'column', gap: 8 },
  card: { flex: 1, minWidth: 0, minHeight: 156, padding: 16, borderRadius: 20, borderWidth: 1 },
  cardCompact: { flex: 0, flexDirection: 'row', alignItems: 'center', minHeight: 72, padding: 13, gap: 13, borderRadius: 18 },
  cardIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTag: { fontSize: 8, fontWeight: '600', letterSpacing: 1.3, marginTop: 16, marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  cardDescription: { fontSize: 11, lineHeight: 16, marginTop: 5 },
  cardArrow: { position: 'absolute', right: 15, top: 24 },
  note: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 17 },
  noteText: { fontSize: 10, lineHeight: 16 },
});
