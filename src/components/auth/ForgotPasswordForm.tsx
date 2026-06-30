import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../../lib/supabase';
import { AuthCard, AuthInput, PrimaryButton, SecondaryActionCard, ErrorBanner } from './AuthComponents';

interface Props {
  onGoToLogin: () => void;
}

export default function ForgotPasswordForm({ onGoToLogin }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ visible: boolean; title: string; message: string; variant: 'error' | 'success' }>({
    visible: false, title: '', message: '', variant: 'error',
  });

  async function handleSend() {
    if (!email.trim()) {
      setBanner({ visible: true, title: 'Enter your email', message: 'Please enter your email address first.', variant: 'error' });
      return;
    }
    setBanner({ visible: false, title: '', message: '', variant: 'error' });
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setBanner({ visible: true, title: "Couldn't send reset link", message: error.message, variant: 'error' });
    } else {
      setBanner({ visible: true, title: 'Email sent 📧', message: 'Check your inbox for a password reset link.', variant: 'success' });
    }
    setLoading(false);
  }

  return (
    <>
      <AuthCard>
        <ErrorBanner visible={banner.visible} title={banner.title} message={banner.message} variant={banner.variant} />

        <AuthInput
          icon="✉️"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={{ height: 8 }} />
        <PrimaryButton label="Send reset link" onPress={handleSend} loading={loading} disabled={!email} />
      </AuthCard>

      <View style={{ height: 12 }} />

      <SecondaryActionCard
        icon="🔑"
        title="Remembered it?"
        subtitle="Go back to log in to your account."
        actionLabel="Back to log in →"
        onPress={onGoToLogin}
      />
    </>
  );
}
