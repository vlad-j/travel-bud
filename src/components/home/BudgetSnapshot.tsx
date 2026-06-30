import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import BudgetDonut from '../BudgetDonut';

type Props = {
  currency: string;
  total: number;
  spent: number;
  today: number;
  percent: number;
  onPress: () => void;
};

function BudgetRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />

      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

export default function BudgetSnapshot({
  currency,
  total,
  spent,
  today,
  percent,
  onPress,
}: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Budget</Text>
          <Text style={styles.subtitle}>
            Keep an eye on your spending
          </Text>
        </View>

        <TouchableOpacity onPress={onPress}>
          <Text style={styles.details}>Details</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <BudgetDonut
          percentage={percent}
          size={108}
          strokeWidth={13}
        />

        <View style={styles.rows}>
          <BudgetRow
            label="Total budget"
            value={`${currency} ${total.toLocaleString()}`}
            color="#1A1A1A"
          />

          <BudgetRow
            label="Spent"
            value={`${currency} ${spent.toLocaleString()}`}
            color="#4CAF50"
          />

          <BudgetRow
            label="Today"
            value={`${currency} ${today.toLocaleString()}`}
            color="#FF9800"
          />
        </View>

        <Text style={styles.emoji}>💳</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginBottom: 22,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
    color: '#8A817A',
    fontWeight: '600',
  },

  details: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4CAF50',
  },

  card: {
    backgroundColor: '#FFFCFA',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3EFEA',

    padding: 18,

    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 2,

    position: 'relative',
  },

  rows: {
    flex: 1,
    marginLeft: 18,
  },

  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 10,
  },

  label: {
    fontSize: 11,
    color: '#8A817A',
    fontWeight: '600',
  },

  value: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },

  emoji: {
    position: 'absolute',
    top: 14,
    right: 18,
    fontSize: 24,
  },
});