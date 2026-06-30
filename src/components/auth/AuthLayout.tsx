import React from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

interface Props {
  headline: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthLayout({ headline, subtitle, children }: Props) {
  return (
    <View style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Travel Buddy</Text>
            <Text style={styles.welcome}>{headline}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* Generic decorative hero — same across all auth states */}
          <View style={styles.heroWrap}>
            <Text style={styles.heroSun}>☀️</Text>
            <View style={styles.heroScene}>
              <Text style={styles.heroPalmLeft}>🌴</Text>
              <Text style={styles.heroMountain}>🏔️</Text>
              <Text style={styles.heroPlane}>✈️</Text>
              <Text style={styles.heroSuitcase}>🧳</Text>
              <Text style={styles.heroPalmRight}>🌴</Text>
            </View>
            <View style={styles.heroGround} />
          </View>

          {children}

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFF8F0' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 16, flexGrow: 1, justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  welcome: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginTop: 10 },
  subtitle: { fontSize: 12, color: '#8A817A', marginTop: 2, fontWeight: '600' },

  heroWrap: { height: 90, marginBottom: 14, position: 'relative', justifyContent: 'flex-end' },
  heroSun: { position: 'absolute', top: 0, left: '38%', fontSize: 18, opacity: 0.85 },
  heroScene: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 14 },
  heroPalmLeft: { fontSize: 26, marginBottom: 2 },
  heroMountain: { fontSize: 34 },
  heroPlane: { fontSize: 20, marginBottom: 28, marginLeft: -8 },
  heroSuitcase: { fontSize: 24 },
  heroPalmRight: { fontSize: 26, marginBottom: 2 },
  heroGround: { height: 10, backgroundColor: '#C8E6C9', borderRadius: 6, marginTop: 6, opacity: 0.6 },
});
