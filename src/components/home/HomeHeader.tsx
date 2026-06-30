import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type Weather = {
  icon: string;
  tempC: number;
  condition: string;
};

type Props = {
  greeting: string;
  weather?: Weather | null;
  tripCount: number;
  statusBarHeight: number;
  heroColor: string;
  onProfile: () => void;
  onNotifications: () => void;
  onTrips: () => void;
};

export default function HomeHeader({
  greeting,
  weather,
  tripCount,
  statusBarHeight,
  heroColor,
  onProfile,
  onNotifications,
  onTrips,
}: Props) {
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: statusBarHeight + 12,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onProfile}
        activeOpacity={0.8}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>👨</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.center}>
        <Text style={styles.greeting}>
          {greeting}
        </Text>

        {weather && (
          <View
            style={[
              styles.weather,
              {
                backgroundColor: heroColor,
              },
            ]}
          >
            <Text style={styles.weatherIcon}>
              {weather.icon}
            </Text>

            <Text style={styles.weatherText}>
              {weather.tempC}° · {weather.condition}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.circle}
          onPress={onNotifications}
          activeOpacity={0.8}
        >
          <Text style={styles.actionEmoji}>
            🔔
          </Text>

          <View style={styles.dot} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.circle}
          onPress={onTrips}
          activeOpacity={0.8}
        >
          <Text style={styles.actionEmoji}>
            🗺️
          </Text>

          {tripCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {tripCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFE5C8',
    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,
    borderColor: '#fff',

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  avatarEmoji: {
    fontSize: 26,
  },

  center: {
    flex: 1,
    alignItems: 'center',
  },

  greeting: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  weather: {
    marginTop: 4,
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  weatherIcon: {
    fontSize: 12,
    marginRight: 5,
  },

  weatherText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3D2B1F',
  },

  actions: {
    flexDirection: 'row',
    gap: 6,
  },

  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,

    backgroundColor: 'rgba(255,255,255,0.78)',

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  actionEmoji: {
    fontSize: 18,
  },

  dot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#F44336',
    borderWidth: 1.5,
    borderColor: '#fff',
  },

  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },

  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});