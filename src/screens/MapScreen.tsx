import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MAP_PLACES } from '../data/sampleData';
import { Sparkle, Cloud, Dot, DottedLine, TravelStamp } from '../components/TravelDecorations';

const { width, height } = Dimensions.get('window');

const TABS = ['Route', 'Places', 'Saved'];

interface RouteStop {
  id: string;
  name: string;
  x: number;
  y: number;
  emoji: string;
  color: string;
  pastelBg: string;
  active?: boolean;
  landmark: string;
}

const ROUTE_STOPS: RouteStop[] = [
  { id: '1', name: 'Jakarta', x: 0.18, y: 0.28, emoji: '🏙️', color: '#4CAF50', pastelBg: '#E8F5E9', landmark: 'Monas' },
  { id: '2', name: 'Yogyakarta', x: 0.38, y: 0.55, emoji: '🛕', color: '#FF9800', pastelBg: '#FFF3E0', active: true, landmark: 'Borobudur' },
  { id: '3', name: 'Bali', x: 0.62, y: 0.52, emoji: '🌴', color: '#4CAF50', pastelBg: '#E8F5E9', landmark: 'Uluwatu' },
  { id: '4', name: 'Lombok', x: 0.8, y: 0.48, emoji: '🏖️', color: '#9C27B0', pastelBg: '#F3E5F5', landmark: 'Gili' },
];

export default function MapScreen() {
  const [activeTab, setActiveTab] = useState('Route');
  const [selectedPlace, setSelectedPlace] = useState(MAP_PLACES[0]);
  const navigation = useNavigation<any>();

  const mapH = height * 0.52;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkle color="#FF9800" size={14} style={{ position: 'relative', marginRight: 4 }} />
          <Text style={styles.title}>Explore</Text>
        </View>
        <TouchableOpacity><Text style={{ fontSize: 22 }}>⚡</Text></TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Travel Route Visualization */}
      <View style={[styles.mapContainer, { height: mapH }]}>
        {/* Ocean background with gradient feel */}
        <View style={styles.ocean} />

        {/* Decorative clouds */}
        <Text style={[styles.mapDecor, { left: '10%', top: '8%', fontSize: 28, opacity: 0.7 }]}>☁️</Text>
        <Text style={[styles.mapDecor, { left: '55%', top: '5%', fontSize: 22, opacity: 0.6 }]}>☁️</Text>
        <Text style={[styles.mapDecor, { left: '78%', top: '12%', fontSize: 24, opacity: 0.5 }]}>☁️</Text>

        {/* Island shapes with pastel colors */}
        <View style={[styles.island, { left: '6%', top: '18%', width: 150, height: 100, borderRadius: 55, backgroundColor: '#C8E6C9' }]} />
        <View style={[styles.island, { left: '26%', top: '42%', width: 200, height: 130, borderRadius: 65, backgroundColor: '#A5D6A7' }]} />
        <View style={[styles.island, { left: '50%', top: '35%', width: 170, height: 120, borderRadius: 60, backgroundColor: '#C8E6C9' }]} />
        <View style={[styles.island, { left: '70%', top: '32%', width: 130, height: 90, borderRadius: 50, backgroundColor: '#A5D6A7' }]} />

        {/* Small decorative islands */}
        <View style={[styles.islandSmall, { left: '45%', top: '22%' }]} />
        <View style={[styles.islandSmall, { left: '85%', top: '25%', width: 30, height: 20 }]} />

        {/* Boats and sea life */}
        <Text style={[styles.mapDecor, { left: '22%', top: '15%' }]}>⛵</Text>
        <Text style={[styles.mapDecor, { left: '47%', top: '18%' }]}>⛵</Text>
        <Text style={[styles.mapDecor, { left: '68%', top: '12%' }]}>🐠</Text>
        <Text style={[styles.mapDecor, { left: '35%', top: '10%' }]}>🌊</Text>

        {/* Dotted route line connecting destinations */}
        <View style={styles.routeLineContainer}>
          {ROUTE_STOPS.slice(0, -1).map((stop, i) => {
            const next = ROUTE_STOPS[i + 1];
            const startX = stop.x * width;
            const startY = stop.y * mapH;
            const endX = next.x * width;
            const endY = next.y * mapH;
            const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);
            const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            return (
              <View
                key={`route-${i}`}
                style={{
                  position: 'absolute',
                  left: startX,
                  top: startY,
                  width: dist,
                  height: 2,
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: '0 0',
                }}
              >
                <View style={styles.dottedRoute} />
              </View>
            );
          })}
        </View>

        {/* Destination pins with landmark placeholders */}
        {ROUTE_STOPS.map((pin) => (
          <TouchableOpacity
            key={pin.id}
            style={[styles.pin, { left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }]}
            onPress={() => {
              const place = MAP_PLACES.find((p) => p.name === pin.name);
              if (place) setSelectedPlace(place);
            }}
          >
            {/* Landmark placeholder */}
            <View style={[styles.landmarkPlaceholder, { borderColor: pin.color, backgroundColor: pin.pastelBg }]}>
              <Text style={[styles.landmarkText, { color: pin.color }]}>{pin.landmark}</Text>
            </View>
            <View style={[styles.pinBubble, { backgroundColor: pin.color, transform: pin.active ? [{ scale: 1.15 }] : [] }]}>
              <Text style={{ fontSize: 18 }}>{pin.emoji}</Text>
            </View>
            <View style={[styles.pinLabel, { backgroundColor: pin.active ? pin.color : '#fff' }]}>
              <Text style={[styles.pinLabelText, { color: pin.active ? '#fff' : '#333' }]}>
                {pin.name}
              </Text>
            </View>
            {pin.active && (
              <View style={styles.activeRing}>
                <View style={[styles.pulseRing, { borderColor: pin.color }]} />
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Travel stamps */}
        <View style={[styles.stampDecor, { left: '12%', top: '65%' }]}>
          <TravelStamp label="JAVA" color="#4CAF50" />
        </View>
        <View style={[styles.stampDecor, { left: '58%', top: '68%' }]}>
          <TravelStamp label="BALI" color="#FF9800" />
        </View>
      </View>

      {/* Place card */}
      <View style={styles.cardContainer}>
        <TouchableOpacity style={styles.placeCard} activeOpacity={0.8} onPress={() => navigation.navigate('DestinationDetails')}>
          <View style={[styles.placeIconBg, { backgroundColor: selectedPlace.name === 'Bali' ? '#E8F5E9' : selectedPlace.name === 'Lombok' ? '#F3E5F5' : '#FFF3E0' }]}>
            <Text style={{ fontSize: 32 }}>
              {selectedPlace.name === 'Jakarta' ? '🏙️' : selectedPlace.name === 'Bali' ? '🌴' : selectedPlace.name === 'Lombok' ? '🏖️' : '🛕'}
            </Text>
          </View>
          <View style={styles.placeInfo}>
            <Text style={styles.placeName}>{selectedPlace.name}</Text>
            <View style={styles.placeDetailRow}>
              <Dot color="#999" size={4} style={{ position: 'relative' }} />
              <Text style={styles.placeDetail}>{selectedPlace.nights} nights</Text>
            </View>
            <View style={styles.placeDetailRow}>
              <Dot color="#999" size={4} style={{ position: 'relative' }} />
              <Text style={styles.placeDetail}>{selectedPlace.activities} activities</Text>
            </View>
            <Text style={styles.placeBudget}>€{selectedPlace.budgetSpent} spent</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  tabActive: { backgroundColor: '#4CAF50' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },

  mapContainer: {
    flex: 1,
    backgroundColor: '#B3E5FC',
    position: 'relative',
    overflow: 'hidden',
  },
  ocean: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#B3E5FC',
  },
  island: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#81C784',
  },
  islandSmall: {
    position: 'absolute',
    width: 40,
    height: 25,
    borderRadius: 15,
    backgroundColor: '#A5D6A7',
    opacity: 0.6,
  },
  mapDecor: {
    position: 'absolute',
    fontSize: 22,
  },
  routeLineContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  dottedRoute: {
    width: '100%',
    height: 2,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#FF9800',
    opacity: 0.7,
  },
  pin: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -28 }, { translateY: -50 }],
  },
  landmarkPlaceholder: {
    width: 56,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  landmarkText: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  pinBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pinLabel: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pinLabelText: { fontSize: 11, fontWeight: '700' },
  activeRing: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    opacity: 0.4,
  },
  stampDecor: {
    position: 'absolute',
    transform: [{ rotate: '-12deg' }],
    opacity: 0.8,
  },

  cardContainer: { padding: 16, backgroundColor: '#F5F5F5' },
  placeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  placeIconBg: {
    width: 60,
    height: 60,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  placeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  placeDetail: { fontSize: 13, color: '#666' },
  placeBudget: { fontSize: 13, fontWeight: '700', color: '#FF9800', marginTop: 4 },
  chevron: { fontSize: 24, color: '#CCC', fontWeight: '300' },
});
