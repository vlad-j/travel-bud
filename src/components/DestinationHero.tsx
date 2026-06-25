import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Sparkle, Cloud, Dot } from './TravelDecorations';

const { width } = Dimensions.get('window');

const COUNTRY_LANDMARKS: Record<string, { name: string; color: string; accent: string }> = {
  France: { name: 'Eiffel Tower', color: '#E8F5E9', accent: '#4CAF50' },
  Italy: { name: 'Colosseum', color: '#FFF3E0', accent: '#FF9800' },
  Spain: { name: 'Sagrada Familia', color: '#FCE4EC', accent: '#E91E63' },
  Thailand: { name: 'Wat Arun', color: '#FFF8E1', accent: '#FFC107' },
  Indonesia: { name: 'Borobudur', color: '#E8F5E9', accent: '#4CAF50' },
  Japan: { name: 'Mount Fuji', color: '#E3F2FD', accent: '#2196F3' },
  USA: { name: 'Statue of Liberty', color: '#E3F2FD', accent: '#2196F3' },
  China: { name: 'Great Wall', color: '#FCE4EC', accent: '#E91E63' },
  India: { name: 'Taj Mahal', color: '#F3E5F5', accent: '#9C27B0' },
  Australia: { name: 'Sydney Opera House', color: '#E3F2FD', accent: '#2196F3' },
};

interface DestinationHeroProps {
  country?: string;
  tripName?: string;
  currentDay?: number;
  totalDays?: number;
  location?: string;
  temperature?: number;
}

export default function DestinationHero({
  country = 'Indonesia',
  tripName,
  currentDay,
  totalDays,
  location,
  temperature,
}: DestinationHeroProps) {
  const landmark = COUNTRY_LANDMARKS[country] ?? { name: 'Globe', color: '#F5F5F5', accent: '#9E9E9E' };

  return (
    <View style={[styles.container, { backgroundColor: landmark.color }]}>
      {/* Decorative elements */}
      <Cloud size={28} style={{ top: 12, left: 20 }} />
      <Cloud size={20} style={{ top: 24, right: 40 }} />
      <Sparkle color={landmark.accent} size={14} style={{ top: 16, right: 16 }} />
      <Sparkle color={landmark.accent} size={10} style={{ bottom: 20, left: 24 }} />
      <Dot color={`${landmark.accent}44`} size={6} style={{ top: 40, left: 60 }} />
      <Dot color={`${landmark.accent}44`} size={4} style={{ bottom: 30, right: 60 }} />

      {/* Landmark placeholder illustration */}
      <View style={styles.illustrationArea}>
        <View style={[styles.landmarkPlaceholder, { borderColor: landmark.accent }]}>
          <Text style={[styles.landmarkLabel, { color: landmark.accent }]}>
            {landmark.name}
          </Text>
        </View>
      </View>

      {/* Trip info */}
      <View style={styles.infoArea}>
        {tripName && <Text style={styles.tripName}>{tripName}</Text>}
        {currentDay !== undefined && totalDays !== undefined && (
          <View style={styles.dayRow}>
            <View style={[styles.dayDot, { backgroundColor: landmark.accent }]} />
            <Text style={styles.dayText}>Day {currentDay} of {totalDays}</Text>
          </View>
        )}
        {(location || temperature !== undefined) && (
          <View style={styles.locationRow}>
            {location && (
              <>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{location}</Text>
              </>
            )}
            {temperature !== undefined && (
              <View style={styles.weatherChip}>
                <Text style={{ fontSize: 16 }}>☀️</Text>
                <Text style={styles.tempText}>{temperature}°C</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  illustrationArea: {
    alignItems: 'center',
    marginBottom: 12,
  },
  landmarkPlaceholder: {
    width: width * 0.35,
    height: width * 0.25,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  landmarkLabel: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    opacity: 0.7,
  },
  infoArea: {
    paddingRight: 8,
  },
  tripName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 28,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  locationIcon: {
    fontSize: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tempText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
