import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import {
  AuthCard, AuthInput, PrimaryButton, SocialLoginButton,
  SecondaryActionCard, ErrorBanner,
} from './AuthComponents';

interface Props {
  onGoToRegister: () => void;
  onGoToForgotPassword: () => void;
  onLoginSuccess?: () => void;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginForm({ onGoToRegister, onGoToForgotPassword, onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [banner, setBanner] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

async function handleLogin() {
  setBanner({ visible: false, title: '', message: '' });
  if (!isValidEmail(email)) {
    setBanner({ visible: true, title: 'Invalid email', message: 'Please enter a valid email address.' });
    return;
  }
  setLoading(true);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setBanner({ visible: true, title: "Couldn't sign in", message: 'Please check your email or password.' });
  } else {
    onLoginSuccess?.();
  }
  setLoading(false);
}

  return (
    <>
      <AuthCard>
        <ErrorBanner visible={banner.visible} title={banner.title} message={banner.message} />

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

        <View style={styles.rowBetween}>
          <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe(v => !v)} activeOpacity={0.8}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onGoToForgotPassword}>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 8 }} />
        <PrimaryButton label="Log in" onPress={handleLogin} loading={loading} disabled={!email || !password} />

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
        title="New here?"
        subtitle="Create your account and start planning."
        actionLabel="Create account →"
        onPress={onGoToRegister}
      />
    </>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#D8D0C6', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checkboxMark: { fontSize: 12, color: '#fff', fontWeight: '900' },
  rememberText: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  link: { fontSize: 13, fontWeight: '700', color: '#4CAF50' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#F0EBE5' },
  dividerText: { fontSize: 12, color: '#B0A89E', fontWeight: '600' },
  socialRow: { flexDirection: 'row', gap: 10 },
});
