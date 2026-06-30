import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { getDestinationHero } from '../../lib/destinationHero';

type TripCarouselProps = {
  trips: any[];
  currentTripIndex: number;
  cardWidth: number;
  flatListRef: React.RefObject<FlatList>;
  onTripChange: (index: number) => void;
  onOpenTrip: (tripId: string) => void;
  onCreateTrip: () => void;
  onJoinTrip: () => void;
};

function getDayNumber(startDate: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(1, diff + 1);
}

function getTotalDays(startDate: string, endDate: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);

  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function getDaysUntilStart(startDate: string): number {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const start = new Date(sy, sm - 1, sd);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diff = Math.ceil(
    (start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  return Math.max(diff, 0);
}

function getCurrentDestinationIndex(destinations: any[], currentDay: number): number {
  if (!destinations || destinations.length === 0) return 0;

  let dayCounter = 0;

  for (let i = 0; i < destinations.length; i += 1) {
    const nights = destinations[i]?.nights ?? 1;
    dayCounter += nights;

    if (currentDay <= dayCounter) {
      return i;
    }
  }

  return destinations.length - 1;
}

function getTripMood(destinations: any[]): string {
  const names = destinations
    ?.map((d) => `${d?.name ?? ''} ${d?.country ?? ''}`.toLowerCase())
    .join(' ') ?? '';

  if (names.includes('phi phi') || names.includes('phuket') || names.includes('krabi') || names.includes('bali') || names.includes('island')) {
    return '🏝 Island journey';
  }

  if (names.includes('bangkok') || names.includes('chiang mai') || names.includes('kyoto') || names.includes('rome') || names.includes('athens')) {
    return '🏯 Culture adventure';
  }

  if (names.includes('bromo') || names.includes('khao sok') || names.includes('alps') || names.includes('fuji') || names.includes('mount')) {
    return '🥾 Nature explorer';
  }

  if (destinations?.length >= 4) {
    return '✨ Multi-stop adventure';
  }

  return '✨ Travel journey';
}

function getDestinationSummary(destinations: any[]): string {
  if (!destinations || destinations.length === 0) return 'No destinations yet';

  const visible = destinations.slice(0, 3).map((d) => d.name).filter(Boolean);
  const remaining = destinations.length - visible.length;

  if (remaining > 0) {
    return `${visible.join(' • ')} +${remaining}`;
  }

  return visible.join(' • ');
}

function TripRouteMiniMap({
  count,
  currentIndex,
  color,
}: {
  count: number;
  currentIndex: number;
  color: string;
}) {
  const visibleCount = Math.min(Math.max(count, 1), 5);

  const points = [
    { x: 14, y: 18 },
    { x: 48, y: 18 },
    { x: 72, y: 42 },
    { x: 106, y: 42 },
    { x: 130, y: 20 },
  ].slice(0, visibleCount);

  const path = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `L ${point.x} ${point.y}`;
    })
    .join(' ');

  return (
    <View style={styles.routeMapWrap}>
      <Svg width={144} height={62} viewBox="0 0 144 62">
        {points.length > 1 && (
          <Path
            d={path}
            stroke={color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.35}
            fill="none"
          />
        )}

        {points.map((point, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          return (
            <Circle
              key={`${point.x}-${point.y}`}
              cx={point.x}
              cy={point.y}
              r={isCurrent ? 8 : 6}
              fill={isFuture ? '#FFFCFA' : color}
              stroke={color}
              strokeWidth={isCurrent ? 4 : 3}
              opacity={isPast || isCurrent ? 1 : 0.75}
            />
          );
        })}
      </Svg>

      {count > 5 && (
        <View style={styles.moreBadge}>
          <Text style={styles.moreBadgeText}>+{count - 5}</Text>
        </View>
      )}
    </View>
  );
}

export default function TripCarousel({
  trips,
  currentTripIndex,
  cardWidth,
  flatListRef,
  onTripChange,
  onOpenTrip,
  onCreateTrip,
  onJoinTrip,
}: TripCarouselProps) {
  if (trips.length === 0) {
    return (
      <View style={styles.emptyCarousel}>
        <TouchableOpacity
          style={styles.emptyCard}
          onPress={onCreateTrip}
          activeOpacity={0.88}
        >
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>✈️</Text>
          </View>

          <View style={styles.emptyTextWrap}>
            <Text style={styles.emptyTitle}>Create a trip</Text>
            <Text style={styles.emptySubtitle}>Plan your next adventure</Text>
          </View>

          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emptyCard}
          onPress={onJoinTrip}
          activeOpacity={0.88}
        >
          <View style={[styles.emptyIcon, styles.joinIcon]}>
            <Text style={styles.emptyIconText}>🔗</Text>
          </View>

          <View style={styles.emptyTextWrap}>
            <Text style={styles.emptyTitle}>Join a trip</Text>
            <Text style={styles.emptySubtitle}>Enter an invite code</Text>
          </View>

          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View style={styles.carouselShell}>
        <FlatList
          ref={flatListRef}
          data={trips}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          snapToInterval={cardWidth}
          decelerationRate="fast"
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / cardWidth,
            );
            onTripChange(index);
          }}
          renderItem={({ item }) => {
            const active = item.computedStatus === 'active';
            const destinations = item.destinations ?? [];
            const firstDestination = destinations[0] ?? null;

            const heroTheme = getDestinationHero(
              firstDestination?.name,
              firstDestination?.country,
            );

            const dayNum = getDayNumber(item.start_date);
            const totalDays = getTotalDays(item.start_date, item.end_date);
            const daysUntilStart = getDaysUntilStart(item.start_date);
            const safeDay = Math.min(dayNum, totalDays);
            const daysLeft = Math.max(totalDays - safeDay, 0);
            const progress = totalDays > 0 ? Math.min(safeDay / totalDays, 1) : 0;
            const progressPercent = Math.round(progress * 100);

            const currentDestinationIndex = getCurrentDestinationIndex(
              destinations,
              safeDay,
            );

            const mood = getTripMood(destinations);
            const destinationSummary = getDestinationSummary(destinations);

            return (
              <TouchableOpacity
                style={[
                  styles.tripCard,
                  {
                    width: cardWidth,
                    backgroundColor: heroTheme.hillBack,
                    borderColor: heroTheme.border,
                  },
                ]}
                onPress={() => onOpenTrip(item.id)}
                activeOpacity={0.9}
              >
                <View style={styles.tripCardContent}>
                  <View style={styles.topRow}>
  <View style={styles.mainInfo}>
    <Text style={styles.tripName} numberOfLines={1}>
      {item.name}
    </Text>

    <Text style={styles.tripMood} numberOfLines={1}>
      {mood}
    </Text>
  </View>

  <View style={styles.mapSlot}>
    <TripRouteMiniMap
      count={destinations.length}
      currentIndex={currentDestinationIndex}
      color={heroTheme.text}
    />
  </View>
</View>

                  <View style={styles.progressBlock}>
                    <View style={styles.progressHeader}>
 <Text style={styles.dayText}>
  {active ? `Day ${safeDay} of ${totalDays}` : `Departs in ${daysUntilStart} days`}
</Text>

<Text style={styles.daysLeftText}>
  {active ? `${daysLeft} days left` : `${totalDays} days total`}
</Text>
                    </View>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progressPercent}%`,
                            backgroundColor: heroTheme.text,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.destinationBlock}>
                    <View style={styles.destinationTopRow}>
                      <Text style={styles.destinationCount}>
                        📍 {destinations.length || 0} destinations
                      </Text>

                      <Text style={styles.viewText}>
                        View →
                      </Text>
                    </View>

                    <Text style={styles.destinationText} numberOfLines={1}>
                      {destinationSummary}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {trips.length > 1 && (
        <View style={styles.paginationRow}>
          {trips.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentTripIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  emptyCarousel: {
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 12,
    gap: 8,
  },

  emptyCard: {
    minHeight: 72,
    backgroundColor: '#FFFCFA',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#F4ECE4',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  joinIcon: {
    backgroundColor: '#E3F2FD',
  },

  emptyIconText: {
    fontSize: 23,
  },

  emptyTextWrap: {
    flex: 1,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },

  emptySubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#777',
    marginTop: 2,
  },

  carouselShell: {
    height: 220,
    marginTop: -24,
  },

  listContent: {
    paddingHorizontal: 16,
  },

  tripCard: {
    height: 210,
    borderRadius: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: 'hidden',
  },

  tripCardContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
    justifyContent: 'space-between',
  },

topRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 10,
},

mainInfo: {
  flex: 1,
  maxWidth: '58%',
},

  tripName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -0.4,
  },

  tripMood: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '800',
    color: '#3D2B1F',
    opacity: 0.78,
  },

 mapSlot: {
  width: 124,
  alignItems: 'flex-end',
},

routeMapWrap: {
  width: 124,
  height: 58,
  position: 'relative',
  marginTop: -2,
},

  moreBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFCFA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },

  moreBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1A1A1A',
  },

  progressBlock: {
    marginTop: 8,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dayText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1A1A1A',
  },

  daysLeftText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3D2B1F',
    opacity: 0.72,
  },

progressTrack: {
  height: 8,
  borderRadius: 999,
  backgroundColor: 'rgba(255,255,255,0.55)',
  overflow: 'hidden',
  marginTop: 8,
},

  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  destinationBlock: {
    marginTop: 8,
  },

  destinationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  destinationCount: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1A1A1A',
    opacity: 0.78,
  },

  viewText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1A1A1A',
    opacity: 0.68,
  },

  destinationText: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: '700',
    color: '#3D2B1F',
    opacity: 0.78,
  },

  chevron: {
    fontSize: 27,
    color: '#B8AEA5',
    fontWeight: '300',
    marginTop: -1,
  },

  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 4,
    gap: 6,
  },

  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4CDC6',
  },

  paginationDotActive: {
    width: 18,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
});