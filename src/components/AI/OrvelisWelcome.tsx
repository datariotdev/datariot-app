import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OrvelisMark } from './OrvelisMark';

const ICE = '#7DA5D9';
const STARTERS = [
  { title: 'Analyze a video', icon: 'play-circle', description: 'Break down the bigger picture.', prompt: 'Analyze this video: ', tag: 'UNDERSTAND' },
  { title: 'Check a claim', icon: 'shield', description: 'Examine the reasoning.', prompt: 'Fact-check this claim: ', tag: 'QUESTION' },
  { title: 'Explain an idea', icon: 'layers', description: 'Connect the dots.', prompt: 'Explain this idea: ', tag: 'EXPLORE' },
] as const;
const CONTOURS = [0, 1, 2, 3, 4];

type Props = { dark: boolean; onChoosePrompt: (prompt: string) => void };

function CoreSculpture() {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none" style={styles.sculpture}>
      {CONTOURS.map(layer => <View key={layer} style={[styles.contour, {
        width: 130 + layer * 21, height: 130 + layer * 21,
        borderColor: `rgba(150, 182, 224, ${0.25 - layer * 0.04})`,
        transform: [{ rotate: `${30 + layer * 11}deg` }, { scaleY: 0.73 }],
      }]} />)}
      <View style={styles.coreGlow} />
      <View style={styles.coreGlass}><OrvelisMark size={78} color="#DBE9FF" /></View>
      <View style={[styles.node, { top: 36, right: 46 }]} />
      <View style={[styles.node, { bottom: 39, left: 35, opacity: 0.4 }]} />
      <View style={styles.axisHorizontal} />
      <View style={styles.axisVertical} />
    </View>
  );
}

/** Cards prepare an editable prompt without sending a request. */
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
        <LinearGradient colors={['#0D1119', '#182638', '#111B29']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <View style={[styles.sculpturePosition, compact && styles.sculptureCompact]}><CoreSculpture /></View>
        <LinearGradient colors={['#0D1119', '#0D1119EB', '#0D111900']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.textShade} />
        <View style={styles.heroContent}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowLine} />
            <Text style={styles.eyebrowText}>ORVELIS INTELLIGENCE</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.title, short && styles.titleShort, compact && styles.titleCompact]}>Go beyond{ '\n' }<Text style={styles.titleAccent}>the obvious.</Text></Text>
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>Turn information into understanding.{ '\n' }Analyze, question and connect the dots.</Text>
          <View style={styles.heroFooter}>
            <View style={styles.footerRule} />
            <Text style={styles.heroCaption}>A DEEPER PERSPECTIVE, BY DATARIOT</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: muted }]}>CHOOSE A DIRECTION</Text>
        {!compact && <Text style={[styles.sectionNote, { color: muted }]}>Start exploring</Text>}
      </View>
      <View style={[styles.cards, compact && styles.cardsCompact]}>
        {STARTERS.map((starter, index) => (
          <Pressable key={starter.title} accessibilityRole="button" accessibilityLabel={starter.title}
            accessibilityHint="Adds a prompt to the message field for you to complete."
            onPress={() => onChoosePrompt(starter.prompt)}
            onHoverIn={() => setActiveCard(index)} onHoverOut={() => setActiveCard(null)}
            onFocus={() => setActiveCard(index)} onBlur={() => setActiveCard(null)}
            style={({ pressed }) => [styles.card, compact && styles.cardCompact, {
              backgroundColor: dark ? (activeCard === index ? '#1D2939' : '#161D27') : (activeCard === index ? '#F3F6FB' : '#FFFFFF'),
              borderColor: activeCard === index ? ICE : (dark ? '#303B4B' : '#DDE4ED'),
              opacity: pressed ? 0.72 : 1,
              transform: [{ translateY: activeCard === index && !compact ? -3 : 0 }],
            }]}>
            <View style={[styles.cardIcon, { backgroundColor: dark ? '#202C3D' : '#F0F4FA' }]}>
              <Feather name={starter.icon} size={19} color={ICE} />
            </View>
            <View style={styles.cardCopy}>
              {!compact && <Text style={[styles.cardTag, { color: muted }]}>0{index + 1} / {starter.tag}</Text>}
              <Text style={[styles.cardTitle, { color: ink }]}>{starter.title}</Text>
              <Text style={[styles.cardDescription, { color: muted }]}>{starter.description}</Text>
            </View>
            <Feather name="arrow-up-right" size={16} color={muted} style={compact ? undefined : styles.cardArrow} />
          </Pressable>
        ))}
      </View>
      <Text style={[styles.note, { color: muted }]}>Bring a question. Build a clearer picture.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 780, alignSelf: 'center', paddingVertical: 8 },
  hero: { minHeight: 290, padding: 26, borderRadius: 22, borderWidth: 1, borderColor: '#2A374A', overflow: 'hidden', justifyContent: 'center', marginBottom: 25 },
  heroShort: { minHeight: 262, padding: 23, marginBottom: 21 },
  heroCompact: { minHeight: 245, padding: 21, marginBottom: 22 },
  heroContent: { zIndex: 1 },
  textShade: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '80%' },
  sculpturePosition: { position: 'absolute', right: -20, top: -5, opacity: 0.94 },
  sculptureCompact: { right: -83, top: -32, opacity: 0.65, transform: [{ scale: 0.78 }] },
  sculpture: { width: 280, height: 280, alignItems: 'center', justifyContent: 'center' },
  contour: { position: 'absolute', borderWidth: 1, borderRadius: 38 },
  coreGlow: { position: 'absolute', width: 134, height: 134, borderRadius: 67, backgroundColor: '#ADCFFF05', shadowColor: '#8DB9F5', shadowOpacity: 0.26, shadowRadius: 28, shadowOffset: { width: 0, height: 0 } },
  coreGlass: { width: 100, height: 100, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A5C8FF08', borderWidth: 1, borderColor: '#AFCDF426', transform: [{ rotate: '-9deg' }] },
  node: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#BDDAFF' },
  axisHorizontal: { position: 'absolute', height: 1, width: 256, backgroundColor: '#A6C5F00A', transform: [{ rotate: '-30deg' }] },
  axisVertical: { position: 'absolute', height: 242, width: 1, backgroundColor: '#A6C5F00A', transform: [{ rotate: '-30deg' }] },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrowLine: { width: 18, height: 1, backgroundColor: '#9BB9E2' },
  eyebrowText: { color: '#A6B8D1', fontSize: 8, letterSpacing: 2.1, fontWeight: '600' },
  title: { color: '#F5F7FC', fontSize: 42, lineHeight: 46, letterSpacing: -1.8, fontWeight: '600', marginTop: 22 },
  titleAccent: { color: '#AFC9EC' },
  titleShort: { fontSize: 36, lineHeight: 40, marginTop: 18 },
  titleCompact: { fontSize: 34, lineHeight: 38, marginTop: 20, letterSpacing: -1.4 },
  subtitle: { color: '#B1BED0', fontSize: 12, lineHeight: 19, marginTop: 13 },
  subtitleCompact: { fontSize: 11, lineHeight: 18 },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 },
  footerRule: { width: 14, height: 1, backgroundColor: '#536781' },
  heroCaption: { fontSize: 7, letterSpacing: 1.3, color: '#869AB5' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 9, fontWeight: '600', letterSpacing: 1.7 },
  sectionNote: { fontSize: 11 },
  cards: { flexDirection: 'row', gap: 10 },
  cardsCompact: { flexDirection: 'column', gap: 8 },
  card: { flex: 1, minWidth: 0, minHeight: 152, padding: 16, borderRadius: 16, borderWidth: 1 },
  cardCompact: { flex: 0, flexDirection: 'row', alignItems: 'center', minHeight: 68, padding: 12, gap: 13, borderRadius: 14 },
  cardIcon: { width: 33, height: 33, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTag: { fontSize: 8, fontWeight: '500', letterSpacing: 1.2, marginTop: 16, marginBottom: 7 },
  cardTitle: { fontSize: 14, fontWeight: '600', letterSpacing: -0.2 },
  cardDescription: { fontSize: 10, lineHeight: 15, marginTop: 5 },
  cardArrow: { position: 'absolute', right: 15, top: 24 },
  note: { fontSize: 10, lineHeight: 16, textAlign: 'center', marginTop: 17 },
});
