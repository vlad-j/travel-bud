import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { DestinationHeroConfig } from '../../lib/destinationHero';

type Props = {
  hero: DestinationHeroConfig;
  destination?: string | null;
};

export default function HeroBanner({ hero, destination }: Props) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.backdrop,
          {
            backgroundColor: hero.background,
            borderColor: hero.border,
          },
        ]}
      >
        <View
          style={[
            styles.blob,
            styles.blobOne,
            { backgroundColor: hero.blobOne },
          ]}
        />

        <View
          style={[
            styles.blob,
            styles.blobTwo,
            { backgroundColor: hero.blobTwo },
          ]}
        />

        <Text style={styles.cloudLeft}>☁️</Text>
        <Text style={styles.cloudRight}>☁️</Text>

        <View
          style={[
            styles.destinationPill,
            {
              backgroundColor: hero.pillBg,
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.destinationText,
              {
                color: hero.text,
              },
            ]}
          >
            {destination ?? 'Next adventure'}
          </Text>
        </View>

        <View
          style={[
            styles.backHill,
            {
              backgroundColor: hero.hillBack,
            },
          ]}
        />

        <View
          style={[
            styles.frontHill,
            {
              backgroundColor: hero.hillFront,
            },
          ]}
        />

        {hero.image && (
          <Image
            source={hero.image}
            resizeMode="contain"
            style={styles.illustration}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 0,
  },

  backdrop: {
    height: 142,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
  },

  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.75,
  },

  blobOne: {
    width: 160,
    height: 160,
    top: -60,
    left: -40,
  },

  blobTwo: {
    width: 180,
    height: 180,
    right: -60,
    bottom: -80,
  },

  cloudLeft: {
    position: 'absolute',
    top: 18,
    left: 28,
    fontSize: 22,
    opacity: 0.75,
  },

  cloudRight: {
    position: 'absolute',
    top: 38,
    right: 105,
    fontSize: 18,
    opacity: 0.65,
  },

  destinationPill: {
    position: 'absolute',
    left: 18,
    top: 58,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    maxWidth: '48%',
  },

  destinationText: {
    fontSize: 14,
    fontWeight: '800',
  },

  backHill: {
    position: 'absolute',
    left: -30,
    right: -30,
    bottom: -34,
    height: 82,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    transform: [{ rotate: '-2deg' }],
  },

  frontHill: {
    position: 'absolute',
    left: 60,
    right: -20,
    bottom: -42,
    height: 88,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
    transform: [{ rotate: '3deg' }],
  },

  illustration: {
    position: 'absolute',
    right: -10,
    bottom: -12,
    width: 315,
    height: 150,
  },
});