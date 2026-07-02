import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

function getTripMood(destinations: any[]): string {
  const names = destinations
    ?.map((d) => `${d?.name ?? ''} ${d?.country ?? ''}`.toLowerCase())
    .join(' ') ?? '';

  if (
    names.includes('phi phi') ||
    names.includes('phuket') ||
    names.includes('krabi') ||
    names.includes('bali') ||
    names.includes('island')
  ) {
    return '🏝 Island journey';
  }

  if (
    names.includes('bangkok') ||
    names.includes('chiang mai') ||
    names.includes('kyoto') ||
    names.includes('rome') ||
    names.includes('athens')
  ) {
    return '🏯 Culture adventure';
  }

  if (
    names.includes('bromo') ||
    names.includes('khao sok') ||
    names.includes('alps') ||
    names.includes('fuji') ||
    names.includes('mount')
  ) {
    return '🥾 Nature explorer';
  }

  if (destinations?.length >= 4) return '✨ Multi-stop adventure';

  return '✨ Travel journey';
}

type Props = {
  trip: any;
  destinations: any[];
  theme: any;
};

export default function TripHero({ trip, destinations, theme }: Props) {
  const destinationName =
    destinations?.[0]?.name ?? trip.cover_destination ?? 'Next adventure';

  return (
    <View
      style={[
        styles.hero,
        {
          backgroundColor: theme.background,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={[styles.heroBlobOne, { backgroundColor: theme.blobOne }]} />
      <View style={[styles.heroBlobTwo, { backgroundColor: theme.blobTwo }]} />

      <Text style={styles.heroCloudLeft}>☁️</Text>
      <Text style={styles.heroCloudRight}>☁️</Text>

      <View style={[styles.heroHillBack, { backgroundColor: theme.hillBack }]} />
      <View style={[styles.heroHillFront, { backgroundColor: theme.hillFront }]} />

      <View style={[styles.heroPill, { backgroundColor: theme.pillBg }]}>
        <Text style={[styles.heroPillText, { color: theme.text }]} numberOfLines={1}>
          {destinationName}
        </Text>
      </View>

      {theme.image && (
        <Image
          source={theme.image}
          resizeMode="contain"
          style={styles.illustration}
        />
      )}

      <View style={styles.heroTitleBlock}>
        <Text style={styles.heroTitle} numberOfLines={2}>
          {trip.name}
        </Text>

        <Text style={styles.heroSubtitle} numberOfLines={1}>
          {getTripMood(destinations)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 190,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },

  heroBlobOne: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 999,
    top: -64,
    left: -44,
    opacity: 0.78,
  },

  heroBlobTwo: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 999,
    right: -70,
    bottom: -88,
    opacity: 0.72,
  },

  heroCloudLeft: {
    position: 'absolute',
    top: 24,
    left: 34,
    fontSize: 24,
    opacity: 0.72,
  },

  heroCloudRight: {
    position: 'absolute',
    top: 42,
    right: 72,
    fontSize: 20,
    opacity: 0.62,
  },

  heroHillBack: {
    position: 'absolute',
    left: -24,
    right: -40,
    bottom: -38,
    height: 92,
    borderTopLeftRadius: 130,
    borderTopRightRadius: 150,
    transform: [{ rotate: '-2deg' }],
  },

  heroHillFront: {
    position: 'absolute',
    left: 72,
    right: -16,
    bottom: -48,
    height: 96,
    borderTopLeftRadius: 130,
    borderTopRightRadius: 130,
    transform: [{ rotate: '3deg' }],
  },

  illustration: {
    position: 'absolute',
    right: -14,
    bottom: -16,
    width: 340,
    height: 165,
  },

  heroPill: {
    position: 'absolute',
    top: 18,
    left: 18,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 7,
    maxWidth: '58%',
  },

  heroPillText: {
    fontSize: 13,
    fontWeight: '900',
  },

  heroTitleBlock: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },

  heroTitle: {
    fontSize: 27,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },

  heroSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '800',
    color: '#3D2B1F',
    opacity: 0.74,
  },
});
