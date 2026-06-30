import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import {
  AuthCard, AuthInput, PrimaryButton, SocialLoginButton,
  SecondaryActionCard, ErrorBanner,
} from '../../components/auth/AuthComponents';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogin() {
    setErrorVisible(false);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMessage(error.message);
      setErrorVisible(true);
    }
    setLoading(false);
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address first.');
      setErrorVisible(true);
      return;
    }
    setErrorVisible(false);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setErrorMessage(error.message);
      setErrorVisible(true);
    } else {
      setErrorMessage('');
      setErrorVisible(false);
      // Lightweight inline confirmation instead of a blocking Alert
      setErrorMessage('Check your inbox for a password reset link.');
      setErrorVisible(true);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Travel Buddy</Text>
          <Text style={styles.welcome}>Welcome back</Text>
          <Text style={styles.subtitle}>Your journeys are waiting.</Text>
        </View>

        {/* Hero illustration — generic, decorative only */}
        <View style={styles.heroWrap}>
          <Text style={styles.heroSun}>☀️</Text>
          <View style={styles.heroScene}>
            <Text style={styles.heroPalmLeft}>🌴</Text>
            <Text style={styles.heroMountain}>🏔️</Text>
            <Text style={styles.heroPlane}>✈️</Text>
            <Text style={styles.heroSuitcase}>🧳</Text>
            <Text style={styles.heroPalmRight}>🌴</Text>
          </View>
          <View style={styles.heroGround} />
        </View>

        {/* Login Card */}
        <AuthCard>
          <ErrorBanner
            visible={errorVisible}
            title={errorMessage.includes('reset link') ? 'Email sent 📧' : "Couldn't sign in"}
            message={errorMessage || 'Please check your email or password.'}
          />

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

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotLink}>Forgot password?</Text>
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
            <SocialLoginButton
              icon={<Text style={{ fontSize: 16 }}>🇬</Text>}
              label="Google"
              disabled
            />
            <SocialLoginButton
              icon={<Text style={{ fontSize: 16 }}>📘</Text>}
              label="Facebook"
              disabled
            />
          </View>
        </AuthCard>

        <View style={{ height: 12 }} />

        <SecondaryActionCard
          icon="👤"
          title="New here?"
          subtitle="Create your account and start planning."
          actionLabel="Create account →"
          onPress={() => navigation.navigate('Register')}
        />

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#FFF8F0' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 16, flexGrow: 1, justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  welcome: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginTop: 10 },
  subtitle: { fontSize: 12, color: '#8A817A', marginTop: 2, fontWeight: '600' },

  heroWrap: { height: 90, marginBottom: 14, position: 'relative', justifyContent: 'flex-end' },
  heroSun: { position: 'absolute', top: 0, left: '38%', fontSize: 18, opacity: 0.85 },
  heroScene: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 14 },
  heroPalmLeft: { fontSize: 26, marginBottom: 2 },
  heroMountain: { fontSize: 34 },
  heroPlane: { fontSize: 20, marginBottom: 28, marginLeft: -8 },
  heroSuitcase: { fontSize: 24, marginBottom: 0 },
  heroPalmRight: { fontSize: 26, marginBottom: 2 },
  heroGround: { height: 10, backgroundColor: '#C8E6C9', borderRadius: 6, marginTop: 6, opacity: 0.6 },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#D8D0C6', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checkboxMark: { fontSize: 12, color: '#fff', fontWeight: '900' },
  rememberText: { fontSize: 13, fontWeight: '600', color: '#1A1A1A' },
  forgotLink: { fontSize: 13, fontWeight: '700', color: '#4CAF50' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#F0EBE5' },
  dividerText: { fontSize: 12, color: '#B0A89E', fontWeight: '600' },

  socialRow: { flexDirection: 'row', gap: 10 },
});
