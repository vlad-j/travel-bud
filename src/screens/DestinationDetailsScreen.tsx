import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Sparkle, Cloud, Dot } from '../components/TravelDecorations';
import { getDestinationHero } from '../lib/destinationHero';
import { supabase } from '../lib/supabase';
import { currentTripIdRef } from '../context/TripContext';

const { width } = Dimensions.get('window');

const TABS = ['Overview', 'Activities', 'Photos', 'Journal'];

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status, accent }: { status: string; accent: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    UPCOMING: { bg: `${accent}1A`, text: accent },
    upcoming: { bg: `${accent}1A`, text: accent },
    DONE: { bg: '#E8F5E9', text: '#4CAF50' },
    completed: { bg: '#E8F5E9', text: '#4CAF50' },
    NOW: { bg: '#FFF3E0', text: '#FF9800' },
    in_progress: { bg: '#FFF3E0', text: '#FF9800' },
  };
  const c = colors[status] ?? colors.UPCOMING;
  return (
    <View style={[pillStyles.pill, { backgroundColor: c.bg }]}>
      <Text style={[pillStyles.pillText, { color: c.text }]}>{status.toUpperCase()}</Text>
    </View>
  );
}
const pillStyles = StyleSheet.create({
  pill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});

// ─── Category → emoji mapping (reused from existing app conventions) ──────────
const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍜',
  transport: '🚗',
  accommodation: '🏡',
  activity: '🎯',
  flight: '✈️',
  hotel_checkin: '🏨',
  hotel_checkout: '🧳',
  shopping: '🛍️',
  other: '📍',
};

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

export default function DestinationDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const destinationId = route.params?.destinationId;

  const [activeTab, setActiveTab] = useState('Overview');
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState<any>(null);
  const [trip, setTrip] = useState<any>(null);
  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState<number | null>(null);
  const [usedTripLevelSpent, setUsedTripLevelSpent] = useState(false);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [destinationId]));

  async function loadData() {
    if (!destinationId) { setLoading(false); return; }
    setLoading(true);

    // 1. Load destination
    const { data: destData } = await supabase
      .from('destinations')
      .select('*')
      .eq('id', destinationId)
      .single();

    if (!destData) { setLoading(false); return; }
    setDestination(destData);

    const tripId = destData.trip_id ?? currentTripIdRef.current;

    // 2. Load trip (for currency, start_date fallback)
    const { data: tripData } = await supabase
      .from('trips')
      .select('id, name, currency, start_date, budget')
      .eq('id', tripId)
      .single();
    setTrip(tripData);

    // 3. Accommodations — match by address containing destination name (no destination_id column on accommodations)
    const { data: accomData } = await supabase
      .from('accommodations')
      .select('*')
      .eq('trip_id', tripId);

    const matchedAccoms = (accomData ?? []).filter((a: any) =>
      a.address?.toLowerCase().includes(destData.name?.toLowerCase() ?? '') ||
      a.name?.toLowerCase().includes(destData.name?.toLowerCase() ?? '')
    );
    setAccommodations(matchedAccoms.length > 0 ? matchedAccoms : (accomData ?? []));

    // 4. Activities — destination_id is not reliably populated in this app,
    //    so we match by location text containing destination name as the closest existing source.
    const { data: actsData } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    const destNameLower = destData.name?.toLowerCase() ?? '';
    const matchedActs = (actsData ?? []).filter((a: any) =>
      a.destination_id === destinationId ||
      (a.location && a.location.toLowerCase().includes(destNameLower))
    );

    setAllActivities(matchedActs);

    // Places = activities with category 'activity' or no category set — closest existing source for "places"
    const placesSource = matchedActs.filter((a: any) =>
      ['activity', 'food', 'shopping'].includes(a.category ?? 'activity')
    );
    setPlaces(placesSource);

    // Upcoming = matched activities that are not completed and in the future or today
    const today = getTodayStr();
    const upcoming = matchedActs.filter((a: any) =>
      a.status !== 'completed' && (!a.date || a.date >= today)
    ).slice(0, 8);
    setUpcomingActivities(upcoming);

    // 5. Expenses — try matching by location text on expense notes/title, fallback to trip-level total
    const { data: expData } = await supabase
      .from('expenses')
      .select('amount, title, notes, category')
      .eq('trip_id', tripId);

    const matchedExpenses = (expData ?? []).filter((e: any) =>
      e.title?.toLowerCase().includes(destNameLower) ||
      e.notes?.toLowerCase().includes(destNameLower)
    );

    if (matchedExpenses.length > 0) {
      setTotalSpent(matchedExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0));
      setUsedTripLevelSpent(false);
    } else {
      // Fallback: no destination-level expense data exists, use trip-level total
      const tripTotal = (expData ?? []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      setTotalSpent(tripTotal);
      setUsedTripLevelSpent(true);
    }

    // 6. Journal entries — match by location field containing destination name
    const { data: journalData } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: false });

    const matchedJournal = (journalData ?? []).filter((j: any) =>
      j.location && j.location.toLowerCase().includes(destNameLower)
    );
    setJournalEntries(matchedJournal);

    setLoading(false);
  }

  const destinationName = destination?.name ?? 'Destination';
  const heroTheme = getDestinationHero(destination?.name, destination?.country);
  const accent = (heroTheme as any).color ?? (heroTheme as any).accent ?? '#4CAF50';
  const heroEmoji = (heroTheme as any).emoji ?? '🌍';

  const visitedCount = places.filter((p: any) => p.status === 'completed').length;

  // Photos — derived from journal entries' photos field
  const allPhotos: string[] = journalEntries.flatMap((j: any) =>
    Array.isArray(j.photos) ? j.photos : []
  );

  // Arrival date — derived from destination order/nights chain, fallback to trip start_date
  const arrivalDate = destination?.arrival_date ?? trip?.start_date ?? null;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  if (!destination) {
    return (
      <SafeAreaView style={styles.safe} edges={[]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Destination</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📍</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>Destination not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{destinationName}</Text>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={{ fontSize: 20, color: '#888' }}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ─── Hero — destination postcard ───────────────────────────── */}
        <View style={[styles.heroCard, { backgroundColor: `${accent}14` }]}>
          <View style={[styles.heroHillBack, { backgroundColor: `${accent}26` }]} />
          <View style={[styles.heroHillFront, { backgroundColor: `${accent}33` }]} />
          <Cloud size={22} style={{ position: 'absolute', top: 14, left: 20 }} />
          <Cloud size={16} style={{ position: 'absolute', top: 26, right: 36 }} />
          <Sparkle color={accent} size={12} style={{ position: 'absolute', top: 18, right: 18 }} />
          <Sparkle color={accent} size={9} style={{ position: 'absolute', bottom: 26, left: 26 }} />

          <View style={styles.heroIllustrationWrap}>
            <Text style={styles.heroEmoji}>{heroEmoji}</Text>
          </View>

          <View style={[styles.heroBadge, { backgroundColor: accent }]}>
            <Text style={styles.heroBadgeText}>{destinationName.toUpperCase()}</Text>
          </View>
        </View>

        {/* ─── Stats row ──────────────────────────────────────────────── */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{destination.nights ?? '—'}</Text>
            <Text style={styles.statLabel}>nights</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{allActivities.length}</Text>
            <Text style={styles.statLabel}>activities</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: accent }]}>
              {totalSpent !== null ? `${trip?.currency ?? 'EUR'} ${Math.round(totalSpent)}` : '—'}
            </Text>
            <Text style={styles.statLabel}>{usedTripLevelSpent ? 'trip spent' : 'spent'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDateShort(arrivalDate)}</Text>
            <Text style={styles.statLabel}>arrival</Text>
          </View>
        </View>

        {/* ─── Tabs ───────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContent}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, active && { backgroundColor: accent }]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ─── Overview tab ───────────────────────────────────────────── */}
        {activeTab === 'Overview' && (
          <>
            {/* Accommodation */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🏨 Accommodation</Text>
              </View>
              {accommodations.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🏨</Text>
                  <Text style={styles.emptyTitle}>No accommodation yet</Text>
                  <Text style={styles.emptySubtitle}>Add a place to stay for {destinationName}</Text>
                </View>
              ) : (
                accommodations.map((acc: any) => (
                  <TouchableOpacity
                    key={acc.id}
                    style={styles.accCard}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Accommodation', { tripId: trip?.id })}
                  >
                    <View style={[styles.accIconWrap, { backgroundColor: `${accent}1A` }]}>
                      <Text style={{ fontSize: 26 }}>🏨</Text>
                    </View>
                    <View style={styles.accInfo}>
                      <Text style={styles.accName}>{acc.name}</Text>
                      <Text style={styles.accNights}>
                        {acc.check_in && acc.check_out
                          ? `${formatDateShort(acc.check_in.split('T')[0])} – ${formatDateShort(acc.check_out.split('T')[0])}`
                          : 'Dates not set'}
                      </Text>
                    </View>
                    <StatusPill status="upcoming" accent={accent} />
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Places */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>✨ Places</Text>
                {places.length > 0 && (
                  <Text style={[styles.sectionCounter, { color: accent }]}>{visitedCount}/{places.length} visited</Text>
                )}
              </View>
              {places.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📍</Text>
                  <Text style={styles.emptyTitle}>No places yet</Text>
                  <Text style={styles.emptySubtitle}>Add activities for {destinationName} to see them here</Text>
                </View>
              ) : (
                places.map((place: any) => {
                  const done = place.status === 'completed';
                  return (
                    <TouchableOpacity key={place.id} style={styles.placeCard} activeOpacity={0.8}>
                      <View style={[styles.placeIconWrap, done && { backgroundColor: `${accent}1A` }]}>
                        <Text style={{ fontSize: 24, opacity: done ? 1 : 0.5 }}>
                          {CATEGORY_EMOJI[place.category ?? 'activity'] ?? '📍'}
                        </Text>
                      </View>
                      <View style={styles.placeInfo}>
                        <Text style={[styles.placeName, !done && styles.placeNameMuted]}>{place.title}</Text>
                        <Text style={styles.placeSubtitle}>{place.location ?? destinationName}</Text>
                      </View>
                      <View style={[styles.placeCheck, done && { backgroundColor: accent, borderColor: accent }]}>
                        {done && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Upcoming */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🗓️ Upcoming</Text>
              </View>
              {upcomingActivities.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🗓️</Text>
                  <Text style={styles.emptyTitle}>Nothing upcoming</Text>
                  <Text style={styles.emptySubtitle}>All caught up for {destinationName}</Text>
                </View>
              ) : (
                <View style={styles.timelineCard}>
                  {upcomingActivities.map((act: any, index: number) => (
                    <View key={act.id} style={styles.timelineRow}>
                      <View style={styles.timelineLeftCol}>
                        <Text style={styles.timelineTime}>{act.time?.slice(0, 5) ?? '—'}</Text>
                        {index < upcomingActivities.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={[styles.timelineIconWrap, { backgroundColor: `${accent}1A` }]}>
                        <Text style={{ fontSize: 20 }}>{CATEGORY_EMOJI[act.category ?? 'activity'] ?? '📍'}</Text>
                      </View>
                      <View style={styles.timelineInfo}>
                        <Text style={styles.timelineTitle} numberOfLines={1}>{act.title}</Text>
                        {act.location ? <Text style={styles.timelineLocation}>📍 {act.location}</Text> : null}
                      </View>
                      <StatusPill status={act.status ?? 'upcoming'} accent={accent} />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* ─── Activities tab ─────────────────────────────────────────── */}
        {activeTab === 'Activities' && (
          <View style={styles.section}>
            {allActivities.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🎯</Text>
                <Text style={styles.emptyTitle}>No activities yet</Text>
                <Text style={styles.emptySubtitle}>Add activities for {destinationName}</Text>
              </View>
            ) : (
              <View style={styles.timelineCard}>
                {allActivities.map((act: any, index: number) => (
                  <View key={act.id} style={styles.timelineRow}>
                    <View style={styles.timelineLeftCol}>
                      <Text style={styles.timelineTime}>{act.time?.slice(0, 5) ?? '—'}</Text>
                      {index < allActivities.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={[styles.timelineIconWrap, { backgroundColor: `${accent}1A` }]}>
                      <Text style={{ fontSize: 20 }}>{CATEGORY_EMOJI[act.category ?? 'activity'] ?? '📍'}</Text>
                    </View>
                    <View style={styles.timelineInfo}>
                      <Text style={styles.timelineTitle} numberOfLines={1}>{act.title}</Text>
                      {act.location ? <Text style={styles.timelineLocation}>📍 {act.location}</Text> : null}
                    </View>
                    <StatusPill status={act.status ?? 'upcoming'} accent={accent} />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ─── Photos tab ─────────────────────────────────────────────── */}
        {activeTab === 'Photos' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>📸 Memories</Text>
              {allPhotos.length > 0 && <Text style={styles.sectionCounter}>{allPhotos.length} photos</Text>}
            </View>
            {allPhotos.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📷</Text>
                <Text style={styles.emptyTitle}>No photos yet</Text>
                <Text style={styles.emptySubtitle}>Photos from your journal will appear here</Text>
              </View>
            ) : (
              <View style={styles.photoGrid}>
                {allPhotos.map((uri, index) => (
                  <TouchableOpacity key={index} style={styles.photoThumb} activeOpacity={0.85}>
                    <Image source={{ uri }} style={styles.photoImg} resizeMode="cover" />
                    {index === 0 && (
                      <View style={styles.featuredBadge}>
                        <Text style={styles.featuredText}>⭐ Featured</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ─── Journal tab ────────────────────────────────────────────── */}
        {activeTab === 'Journal' && (
          <View style={styles.section}>
            {journalEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📖</Text>
                <Text style={styles.emptyTitle}>No journal entries yet</Text>
                <Text style={styles.emptySubtitle}>Write about your time in {destinationName}</Text>
              </View>
            ) : (
              journalEntries.map((entry: any) => {
                const photos = Array.isArray(entry.photos) ? entry.photos : [];
                return (
                  <View key={entry.id} style={styles.journalCard}>
                    {photos[0] ? (
                      <Image source={{ uri: photos[0] }} style={styles.journalPhoto} resizeMode="cover" />
                    ) : null}
                    <View style={styles.journalContent}>
                      <View style={styles.journalHeader}>
                        <View style={styles.journalMoodRow}>
                          {entry.mood ? <Text style={{ fontSize: 20 }}>{moodEmoji(entry.mood)}</Text> : null}
                          <Text style={styles.journalLocation}>{entry.location}</Text>
                        </View>
                        <Text style={styles.journalTime}>
                          {entry.date ? new Date(entry.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                      </View>
                      <Text style={styles.journalNote} numberOfLines={3}>{entry.content ?? entry.title ?? ''}</Text>
                      {photos.length > 0 ? (
                        <Text style={styles.journalPhotosCount}>📷 {photos.length} photos</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
            <TouchableOpacity
              style={[styles.addButton, { borderColor: accent }]}
              onPress={() => navigation.navigate('JournalMain')}
            >
              <Text style={[styles.addIcon, { color: accent }]}>＋</Text>
              <Text style={[styles.addText, { color: accent }]}>Add journal entry</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.footerDecor}>
          <Dot color="#DDD" size={5} style={{ position: 'relative' }} />
          <Dot color="#DDD" size={4} style={{ position: 'relative', marginLeft: 8 }} />
          <Sparkle color={accent} size={10} style={{ position: 'relative', marginLeft: 6 }} />
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function moodEmoji(mood: string): string {
  const map: Record<string, string> = {
    amazing: '😍', good: '😊', normal: '😐', bad: '😞',
  };
  return map[mood] ?? '';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F0' },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFF8F0',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  title: { fontSize: 19, fontWeight: '800', color: '#1A1A1A' },
  moreBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  heroCard: {
    marginHorizontal: 16, marginBottom: 16, height: 200, borderRadius: 28,
    overflow: 'hidden', position: 'relative', justifyContent: 'flex-end',
  },
  heroHillBack: { position: 'absolute', bottom: -20, left: -30, width: 200, height: 120, borderRadius: 100 },
  heroHillFront: { position: 'absolute', bottom: -30, right: -20, width: 220, height: 130, borderRadius: 110 },
  heroIllustrationWrap: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  heroEmoji: { fontSize: 84 },
  heroBadge: { position: 'absolute', bottom: 16, left: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 7, transform: [{ rotate: '-4deg' }] },
  heroBadgeText: { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 1 },

  statsCard: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#fff', borderRadius: 22, paddingVertical: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 3, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: '#F0F0F0' },

  tabScroll: { maxHeight: 52, marginBottom: 16 },
  tabContent: { paddingHorizontal: 16, gap: 10, flexDirection: 'row' },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 18, backgroundColor: '#fff' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#888' },
  tabTextActive: { color: '#fff' },

  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  sectionCounter: { fontSize: 13, fontWeight: '700', color: '#888' },

  accCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff',
    borderRadius: 20, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  accIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  accInfo: { flex: 1 },
  accName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  accNights: { fontSize: 12, color: '#888', marginTop: 3 },

  placeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff',
    borderRadius: 18, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  placeIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  placeNameMuted: { color: '#999' },
  placeSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  placeCheck: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#E0E0E0',
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { fontSize: 13, color: '#fff', fontWeight: '800' },

  timelineCard: {
    backgroundColor: '#fff', borderRadius: 22, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 1,
  },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
  timelineLeftCol: { width: 44, alignItems: 'center' },
  timelineTime: { fontSize: 12, fontWeight: '700', color: '#666' },
  timelineLine: { width: 2, flex: 1, minHeight: 24, backgroundColor: '#F0F0F0', marginTop: 6 },
  timelineIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  timelineInfo: { flex: 1, paddingTop: 2 },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  timelineLocation: { fontSize: 11, color: '#888', marginTop: 3 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumb: { width: (width - 42) / 2, height: 140, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  featuredBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  featuredText: { fontSize: 11, fontWeight: '700', color: '#1A1A1A' },

  journalCard: {
    backgroundColor: '#fff', borderRadius: 22, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  journalPhoto: { width: '100%', height: 170 },
  journalContent: { padding: 16 },
  journalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  journalMoodRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  journalLocation: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  journalTime: { fontSize: 12, color: '#888' },
  journalNote: { fontSize: 14, color: '#444', lineHeight: 21, marginBottom: 8 },
  journalPhotosCount: { fontSize: 12, color: '#888', fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  emptySubtitle: { fontSize: 13, color: '#888', textAlign: 'center' },

  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, backgroundColor: '#fff', borderRadius: 18,
    borderWidth: 1.5, borderStyle: 'dashed',
  },
  addIcon: { fontSize: 20, fontWeight: '700' },
  addText: { fontSize: 15, fontWeight: '700' },

  footerDecor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
});
