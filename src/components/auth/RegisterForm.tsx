import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import {
  AuthCard, AuthInput, PrimaryButton, SocialLoginButton,
  SecondaryActionCard, ErrorBanner,
} from './AuthComponents';

interface Props {
  onGoToLogin: () => void;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function RegisterForm({ onGoToLogin }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ visible: boolean; title: string; message: string; variant: 'error' | 'success' }>({
    visible: false, title: '', message: '', variant: 'error',
  });

async function handleRegister() {
  setBanner({ visible: false, title: '', message: '', variant: 'error' });
  if (!isValidEmail(email)) {
    setBanner({ visible: true, title: 'Invalid email', message: 'Please enter a valid email address.', variant: 'error' });
    return;
  }
  setLoading(true);
  }

  return (
    <>
      <AuthCard>
        <ErrorBanner visible={banner.visible} title={banner.title} message={banner.message} variant={banner.variant} />

        <AuthInput icon="👤" placeholder="Full name" value={name} onChangeText={setName} />

        <AuthInput
          icon="✉️"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <AuthInput
          icon="🔒"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          rightElement={
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 8 }}>
              <Text style={{ fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          }
        />

        <View style={{ height: 8 }} />
        <PrimaryButton
          label="Create account"
          onPress={handleRegister}
          loading={loading}
          disabled={!name || !email || !password}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <SocialLoginButton icon={<Text style={{ fontSize: 16 }}>🇬</Text>} label="Google" disabled />
          <SocialLoginButton icon={<Text style={{ fontSize: 16 }}>🍎</Text>} label="Apple" disabled />
        </View>
      </AuthCard>

      <View style={{ height: 12 }} />

      <SecondaryActionCard
        icon="👤"
        title="Already have an account?"
        subtitle="Welcome back, log in to continue."
        actionLabel="Log in →"
        onPress={onGoToLogin}
      />
    </>
  );
}

const styles = StyleSheet.create({
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#F0EBE5' },
  dividerText: { fontSize: 12, color: '#B0A89E', fontWeight: '600' },
  socialRow: { flexDirection: 'row', gap: 10 },
});
