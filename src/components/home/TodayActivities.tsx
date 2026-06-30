import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

const ACTIVITY_ICONS: Record<string, { icon: any; bg: string }> = {
  food: {
    icon: require('../../../assets/icons/activity_food.png'),
    bg: '#FFF3E0',
  },
  transport: {
    icon: require('../../../assets/icons/activity_transport.png'),
    bg: '#E3F2FD',
  },
  accommodation: {
    icon: require('../../../assets/icons/activity_accommodation.png'),
    bg: '#FCE4EC',
  },
  activity: {
    icon: require('../../../assets/icons/activity_activity.png'),
    bg: '#E8F5E9',
  },
  flight: {
    icon: require('../../../assets/icons/activity_flight.png'),
    bg: '#EDE7F6',
  },
  hotel_checkin: {
    icon: require('../../../assets/icons/activity_accommodation.png'),
    bg: '#F3E5F5',
  },
  hotel_checkout: {
    icon: require('../../../assets/icons/activity_accommodation.png'),
    bg: '#FFF8E1',
  },
  default: {
    icon: require('../../../assets/icons/activity_activity.png'),
    bg: '#F5F5F5',
  },
};

const STATUS_BG_ACTIVITY: Record<string, string> = {
  DONE: '#F1F8E9',
  NOW: '#FFF8E1',
  UPCOMING: '#F3E8FF',
};

const STATUS_BADGE_COLOR: Record<string, { bg: string; text: string }> = {
  DONE: { bg: '#4CAF50', text: '#fff' },
  NOW: { bg: '#FF9800', text: '#fff' },
  UPCOMING: { bg: '#7C3AED', text: '#fff' },
};

type Props = {
  activities: any[];
  loading: boolean;
  onOpenItinerary: () => void;
};

function getActivityStatus(
  time: string,
  status: string,
): 'DONE' | 'NOW' | 'UPCOMING' {
  if (status === 'completed') return 'DONE';
  if (status === 'in_progress') return 'NOW';

  const now = new Date();
  const [h, m] = time.split(':').map(Number);
  const activityMinutes = h * 60 + m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (activityMinutes < nowMinutes - 30) return 'DONE';
  if (Math.abs(activityMinutes - nowMinutes) <= 30) return 'NOW';

  return 'UPCOMING';
}

export default function TodayActivities({
  activities,
  loading,
  onOpenItinerary,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Today's activities</Text>
          <Text style={styles.subtitle}>
            {activities.length > 0
              ? `${activities.length} planned for today`
              : 'Your day is wide open'}
          </Text>
        </View>

        <TouchableOpacity onPress={onOpenItinerary} activeOpacity={0.75}>
          <Text style={styles.action}>See all</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#4CAF50" style={styles.loader} />
      ) : activities.length === 0 ? (
        <TouchableOpacity
          style={styles.emptyCard}
          onPress={onOpenItinerary}
          activeOpacity={0.82}
        >
          <Text style={styles.emptyEmoji}>🌤️</Text>
          <Text style={styles.emptyTitle}>No activities planned today</Text>
          <Text style={styles.emptyText}>Tap to add something to your itinerary</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.timeline}>
          {activities.map((activity, index) => {
            const status = getActivityStatus(
              activity.time?.slice(0, 5) ?? '00:00',
              activity.status ?? 'upcoming',
            );

            const iconData =
              ACTIVITY_ICONS[activity.category?.toLowerCase() ?? 'default'] ??
              ACTIVITY_ICONS.default;

            const badgeStyle = STATUS_BADGE_COLOR[status];
            const cardBg = STATUS_BG_ACTIVITY[status] ?? '#fff';

            return (
              <View key={activity.id} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineDot} />
                  {index !== activities.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>

                <View style={[styles.activityCard, { backgroundColor: cardBg }]}>
                  <View
                    style={[
                      styles.activityIconWrap,
                      { backgroundColor: iconData.bg },
                    ]}
                  >
                    <Image
                      source={iconData.icon}
                      resizeMode="contain"
                      style={styles.activityIcon}
                    />
                  </View>

                  <View style={styles.activityContent}>
                    <Text style={styles.activityTime}>
                      {activity.time?.slice(0, 5) ?? '--:--'}
                    </Text>

                    <Text style={styles.activityTitle} numberOfLines={1}>
                      {activity.title}
                    </Text>

                    {activity.location ? (
                      <Text style={styles.activityLocation} numberOfLines={1}>
                        📍 {activity.location}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.activityBadge,
                      { backgroundColor: badgeStyle.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.activityBadgeText,
                        { color: badgeStyle.text },
                      ]}
                    >
                      {status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#8A817A',
  },

  action: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 2,
  },

  loader: {
    padding: 22,
  },

  emptyCard: {
    backgroundColor: '#FFFCFA',
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3EFEA',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  emptyEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },

  emptyText: {
    marginTop: 4,
    fontSize: 12,
    color: '#8A817A',
    fontWeight: '600',
  },

  timeline: {
    gap: 0,
  },

  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  timelineRail: {
    width: 22,
    alignItems: 'center',
    paddingTop: 24,
  },

  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },

  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 5,
    backgroundColor: '#E2E8E1',
    borderRadius: 2,
  },

  activityCard: {
    flex: 1,
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    shadowColor: '#000',
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  activityIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  activityIcon: {
    width: 42,
    height: 42,
  },

  activityContent: {
    flex: 1,
  },

  activityTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A817A',
    marginBottom: 2,
  },

  activityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },

  activityLocation: {
    fontSize: 11,
    color: '#8A817A',
    marginTop: 3,
    fontWeight: '600',
  },

  activityBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  activityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});