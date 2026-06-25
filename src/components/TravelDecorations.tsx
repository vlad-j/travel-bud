import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function Sparkle({ color = '#FFD700', size = 16, style }: { color?: string; size?: number; style?: any }) {
  return (
    <Text style={[{ fontSize: size, color, position: 'absolute' }, style]}>
      ✦
    </Text>
  );
}

export function Star({ color = '#FFD700', size = 14, style }: { color?: string; size?: number; style?: any }) {
  return (
    <Text style={[{ fontSize: size, color, position: 'absolute' }, style]}>
      ★
    </Text>
  );
}

export function Cloud({ color = '#E3F2FD', size = 24, style }: { color?: string; size?: number; style?: any }) {
  return (
    <Text style={[{ fontSize: size, color, position: 'absolute' }, style]}>
      ☁️
    </Text>
  );
}

export function Dot({ color = '#DDD', size = 6, style }: { color?: string; size?: number; style?: any }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, position: 'absolute' }, style]} />
  );
}

export function TravelStamp({ label, color = '#4CAF50', style }: { label: string; color?: string; style?: any }) {
  return (
    <View style={[styles.stamp, { borderColor: color }, style]}>
      <Text style={[styles.stampText, { color }]}>{label}</Text>
    </View>
  );
}

export function DottedLine({ color = '#CCC', style }: { color?: string; style?: any }) {
  return (
    <View style={[styles.dottedLine, style]}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={[styles.dot, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

export function RouteArrow({ color = '#FF9800', size = 18, style }: { color?: string; size?: number; style?: any }) {
  return (
    <Text style={[{ fontSize: size, color, position: 'absolute' }, style]}>
      →
    </Text>
  );
}

export function PlaneTrail({ style }: { style?: any }) {
  return (
    <View style={[styles.planeTrail, style]}>
      <Text style={styles.planeEmoji}>✈️</Text>
      <DottedLine color="#B3E5FC" style={{ marginTop: 4 }} />
    </View>
  );
}

export function DecorativeHeader({ title, accentColor = '#4CAF50' }: { title: string; accentColor?: string }) {
  return (
    <View style={styles.headerDecor}>
      <Sparkle color={accentColor} size={12} style={{ top: -4, left: -8 }} />
      <Dot color={`${accentColor}66`} size={5} style={{ top: 2, right: -6 }} />
      <Text style={styles.headerTitle}>{title}</Text>
      <Dot color={`${accentColor}66`} size={4} style={{ bottom: -2, left: -4 }} />
      <Sparkle color={accentColor} size={10} style={{ top: -2, right: -10 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderStyle: 'dashed',
    transform: [{ rotate: '-8deg' }],
  },
  stampText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dottedLine: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  planeTrail: {
    alignItems: 'center',
  },
  planeEmoji: {
    fontSize: 20,
  },
  headerDecor: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.8,
  },
});
