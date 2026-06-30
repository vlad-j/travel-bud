import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

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
            const dest = item.destinations?.[0] ?? null;
            const dayNum = getDayNumber(item.start_date);
            const totalDays = getTotalDays(item.start_date, item.end_date);

            return (
              <TouchableOpacity
                style={[styles.tripCard, { width: cardWidth }]}
                onPress={() => onOpenTrip(item.id)}
                activeOpacity={0.9}
              >
                <View style={styles.tripCardContent}>
                  <View style={styles.tripHeaderRow}>
                    <View style={styles.tripTextWrap}>
                      <Text style={styles.tripName} numberOfLines={1}>
                        {item.name}
                      </Text>

                      <View style={styles.tripMetaRow}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: active ? '#4CAF50' : '#999' },
                          ]}
                        />

                        <Text
                          style={[
                            styles.tripMeta,
                            { color: active ? '#4CAF50' : '#777' },
                          ]}
                          numberOfLines={1}
                        >
                          {active
                            ? `Day ${dayNum} of ${totalDays}`
                            : item.computedStatus?.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.chevronBubble}>
                      <Text style={styles.chevron}>›</Text>
                    </View>
                  </View>

                  {dest ? (
                    <View style={styles.destinationRow}>
                      <Text style={styles.locationPin}>📍</Text>
                      <Text style={styles.destinationText} numberOfLines={1}>
                        {dest.name}
                        {dest.country ? `, ${dest.country}` : ''}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.bottomAccentRow}>
                    <View style={styles.accentLine} />
                    <Text style={styles.tapHint}>View trip details</Text>
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
    height: 160,
    marginTop: -22,
  },

  listContent: {
    paddingHorizontal: 16,
  },

  tripCard: {
    height: 150,
    backgroundColor: '#FFFCFA',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#F3EFEA',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },

  tripCardContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },

  tripHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  tripTextWrap: {
    flex: 1,
  },

  tripName: {
    fontSize: 23,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },

  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 7,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  tripMeta: {
    fontSize: 14,
    fontWeight: '700',
  },

  chevronBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7F2EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  chevron: {
    fontSize: 27,
    color: '#B8AEA5',
    fontWeight: '300',
    marginTop: -1,
  },

  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },

  locationPin: {
    fontSize: 14,
  },

  destinationText: {
    flex: 1,
    fontSize: 14,
    color: '#5F5A55',
    fontWeight: '600',
  },

  bottomAccentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },

  accentLine: {
    flex: 1,
    height: 5,
    borderRadius: 99,
    backgroundColor: '#EEF8EF',
  },

  tapHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A817A',
  },

  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
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