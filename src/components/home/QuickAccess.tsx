import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const QUICK_PILLS = [
  {
    label: 'Packing',
    icon: require('../../../assets/icons/packing.png'),
    screen: 'Packing' as const,
    bg: '#F7FCF7',
    border: '#E2F0E4',
  },
  {
    label: 'Documents',
    icon: require('../../../assets/icons/documents.png'),
    screen: 'Documents' as const,
    bg: '#FFF9EF',
    border: '#F3E4C4',
  },
  {
    label: 'Stays',
    icon: require('../../../assets/icons/accom.png'),
    screen: 'Accommodation' as const,
    bg: '#FAF5FF',
    border: '#E8D9F7',
  },
  {
    label: 'Transport',
    icon: require('../../../assets/icons/transportation.png'),
    screen: 'Transport' as const,
    bg: '#F4FAFF',
    border: '#D8EAF8',
  },
  {
    label: 'Memories',
    icon: require('../../../assets/icons/memories.png'),
    screen: 'MemoriesRecap' as const,
    bg: '#FFF7F1',
    border: '#F2DDCE',
  },
  {
    label: 'Settings',
    icon: require('../../../assets/icons/tripSettings.png'),
    screen: 'TripSettings' as const,
    bg: '#F8F8F8',
    border: '#E5E5E5',
  },
];

type Props = {
  tripId: string | null;
  onNavigate: (screen: string, params?: any) => void;
};

export default function QuickAccess({ tripId, onNavigate }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.grid}>
        {QUICK_PILLS.map((pill) => (
          <TouchableOpacity
            key={pill.label}
            style={[
              styles.tile,
              {
                backgroundColor: pill.bg,
                borderColor: pill.border,
              },
            ]}
            onPress={() => onNavigate(pill.screen, { tripId })}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrap}>
              <Image
                source={pill.icon}
                resizeMode="contain"
                style={styles.icon}
              />
            </View>

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
    backgroundColor: '#FFFCFA',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: '#F3EFEA',
    shadowColor: '#000',
    shadowOpacity: 0.045,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },

  tile: {
    width: '31.5%',
    height: 92,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingBottom: 4,
    overflow: 'hidden',
  },

  iconWrap: {
    width: 74,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -2,
  },

  icon: {
    width: 74,
    height: 74,
  },

  label: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '600',
    color: '#303030',
    textAlign: 'center',
  },
});