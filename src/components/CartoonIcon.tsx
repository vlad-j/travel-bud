import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  emoji: string;
  bg: string;
  size?: number;
}

export default function CartoonIcon({ emoji, bg, size = 48 }: Props) {
  const fontSize = size * 0.45;
  const borderRadius = size * 0.28;
  return (
    <View style={[styles.icon, { backgroundColor: bg, width: size, height: size, borderRadius }]}>
      <Text style={{ fontSize }}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
