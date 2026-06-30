import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useCurrentTrip } from '../../context/TripContext';
import { getDestinationHero } from '../../lib/destinationHero';

const QUICK_PILLS = [
  {
    label: 'Stays',
    icon: require('../../../assets/icons/accom.png'),
    screen: 'Accommodation' as const,
  },
  {
    label: 'Transport',
    icon: require('../../../assets/icons/transportation.png'),
    screen: 'Transport' as const,
  },
  {
    label: 'Documents',
    icon: require('../../../assets/icons/documents.png'),
    screen: 'Documents' as const,
  },
  {
    label: 'Packing',
    icon: require('../../../assets/icons/packing.png'),
    screen: 'Packing' as const,
  },
  {
    label: 'Memories',
    icon: require('../../../assets/icons/memories.png'),
    screen: 'MemoriesRecap' as const,
  },
  {
    label: 'Settings',
    icon: require('../../../assets/icons/tripSettings.png'),
    screen: 'TripSettings' as const,
  },
];

type Props = {
  tripId: string | null;
  onNavigate: (screen: string, params?: any) => void;
};

export default function QuickAccess({ tripId, onNavigate }: Props) {
  const { currentDestination } = useCurrentTrip();

  const heroTheme = getDestinationHero(
    currentDestination?.name,
    currentDestination?.country,
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: heroTheme.background,
          borderColor: heroTheme.border,
        },
      ]}
    >
      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Circle
          cx="18%"
          cy="12%"
          r="56"
          fill={heroTheme.blobOne}
          opacity={0.42}
        />
        <Circle
          cx="92%"
          cy="82%"
          r="78"
          fill={heroTheme.blobTwo}
          opacity={0.38}
        />
        <Path
          d="M18 142 C74 104, 120 174, 190 132 S298 108, 360 154"
          stroke={heroTheme.accent}
          strokeWidth="18"
          strokeLinecap="round"
          opacity={0.10}
          fill="none"
        />
      </Svg>

      <View style={styles.grid}>
        {QUICK_PILLS.map((pill) => (
          <TouchableOpacity
            key={pill.label}
            style={styles.tile}
            onPress={() => onNavigate(pill.screen, { tripId })}
            activeOpacity={0.78}
          >
            <Image
              source={pill.icon}
              style={styles.icon}
            />

            <Text numberOfLines={1} style={styles.label}>
              {pill.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 14,
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    overflow: 'hidden',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },

  tile: {
    width: '31.5%',
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    width: 76,
    height: 76,
    marginBottom: -8,
  },

  label: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    color: '#303030',
    textAlign: 'center',
  },
});