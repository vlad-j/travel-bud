import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Activity } from '../data/sampleData';
import CartoonIcon from './CartoonIcon';
import StatusBadge from './StatusBadge';

interface Props {
  activity: Activity;
  showConnector?: boolean;
}

export default function ActivityCard({ activity, showConnector }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.timeCol}>
        <Text style={styles.time}>{activity.time}</Text>
        {showConnector && <View style={styles.connector} />}
      </View>
      <CartoonIcon emoji={activity.icon} bg={activity.iconBg} size={44} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{activity.title}</Text>
        {activity.subtitle ? (
          <Text style={styles.subtitle}>{activity.subtitle}</Text>
        ) : null}
      </View>
      <StatusBadge status={activity.status} small />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  timeCol: {
    width: 42,
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  connector: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
});
