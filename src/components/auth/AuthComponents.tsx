import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, TextInputProps, ActivityIndicator } from 'react-native';
export function AuthCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

interface AuthInputProps extends TextInputProps {
  icon: string;
  rightElement?: React.ReactNode;
}

export function AuthInput({ icon, rightElement, ...props }: AuthInputProps) {
  return (
    <View style={styles.inputWrap}>
      <View style={styles.inputIconWrap}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <TextInput style={styles.inputField} placeholderTextColor="#B0A89E" {...props} />
      {rightElement}
    </View>
  );
}

export function PrimaryButton({ label, onPress, loading, disabled }: {
  label: string; onPress: () => void; loading?: boolean; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.primaryBtnText}>{label}</Text>}
    </TouchableOpacity>
  );
}

export function SocialLoginButton({ icon, label, onPress, disabled }: {
  icon: React.ReactNode; label: string; onPress?: () => void; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.socialBtn, disabled && styles.socialBtnDisabled]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.8}
    >
      {icon}
      <Text style={[styles.socialBtnText, disabled && { color: '#C8BFB5' }]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryActionCard({ icon, title, subtitle, actionLabel, onPress }: {
  icon: string; title: string; subtitle: string; actionLabel: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.secondaryCard} onPress={onPress} activeOpacity={0.85}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.secondaryTitle}>{title}</Text>
        <Text style={styles.secondarySubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.secondaryAction}>{actionLabel}</Text>
    </TouchableOpacity>
  );
}

export function ErrorBanner({ title, message, visible, variant = 'error' }: {
  title: string; message: string; visible: boolean; variant?: 'error' | 'success';
}) {
  if (!visible) return null;
  const isSuccess = variant === 'success';
  return (
    <View style={[styles.banner, isSuccess ? styles.bannerSuccess : styles.bannerError]}>
      <Text style={{ fontSize: 18 }}>{isSuccess ? '📧' : '⚠️'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.bannerTitle, { color: isSuccess ? '#2E7D32' : '#C62828' }]}>{title}</Text>
        <Text style={[styles.bannerMessage, { color: isSuccess ? '#388E3C' : '#D32F2F' }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 18,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8F4EF', borderRadius: 16, borderWidth: 1, borderColor: '#F0EBE5',
    paddingHorizontal: 14, paddingVertical: 2, marginBottom: 10,
  },
  inputIconWrap: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  inputField: { flex: 1, fontSize: 15, color: '#1A1A1A', paddingVertical: 12 },

  primaryBtn: {
    backgroundColor: '#4CAF50', borderRadius: 16, paddingVertical: 15, alignItems: 'center',
    shadowColor: '#4CAF50', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  primaryBtnDisabled: { backgroundColor: '#C8E6C9', shadowOpacity: 0 },
  primaryBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },

  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 10,
    borderWidth: 1, borderColor: '#F0EBE5',
  },
  socialBtnDisabled: { opacity: 0.5 },
  socialBtnText: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },

  secondaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#E8F5E9', borderRadius: 20, padding: 16,
  },
  secondaryTitle: { fontSize: 14, fontWeight: '800', color: '#1A1A1A' },
  secondarySubtitle: { fontSize: 12, color: '#5C8A60', marginTop: 2, fontWeight: '600' },
  secondaryAction: { fontSize: 13, fontWeight: '800', color: '#2E7D32' },

  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1,
  },
  bannerError: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
  bannerSuccess: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
  bannerTitle: { fontSize: 13, fontWeight: '800' },
  bannerMessage: { fontSize: 12, marginTop: 2, fontWeight: '500' },
});
