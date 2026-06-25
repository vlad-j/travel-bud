import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  secondaryColor?: string;
}

export default function BudgetDonut({
  percentage,
  size = 120,
  strokeWidth = 14,
  color = '#4CAF50',
  secondaryColor = '#FF9800',
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const greenPercent = Math.min(percentage, 100);
  const greenDash = (greenPercent / 100) * circumference;
  const orangeDash = circumference - greenDash;
  const orangePercent = Math.min(100 - greenPercent, 15);
  const orangeDashLen = (orangePercent / 100) * circumference;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F0F0F0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${greenDash} ${circumference - greenDash}`}
          strokeLinecap="round"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={secondaryColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${orangeDashLen} ${circumference - orangeDashLen}`}
          strokeDashoffset={-greenDash}
          strokeLinecap="round"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.percent}>{percentage}%</Text>
        <Text style={styles.label}>of budget{'\n'}used</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  label: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 15,
  },
});
