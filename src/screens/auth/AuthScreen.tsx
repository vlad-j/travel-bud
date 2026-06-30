import React, { useState, useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import AuthLayout from '../../components/auth/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

type AuthState = 'login' | 'register' | 'forgotPassword';

const HEADLINES: Record<AuthState, { headline: string; subtitle: string }> = {
  login: { headline: 'Welcome back', subtitle: 'Your journeys are waiting.' },
  register: { headline: 'Create your account', subtitle: 'Start planning your next adventure.' },
  forgotPassword: { headline: 'Forgot password?', subtitle: "We'll send you a reset link." },
};

// Note: navigation prop is accepted for compatibility with existing
// navigation stack registration, but internal auth state is now
// handled locally via animated transitions rather than screen navigation.
export default function AuthScreen({ navigation }: any) {
  const [authState, setAuthState] = useState<AuthState>('login');
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  function transitionTo(next: AuthState) {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.timing(translateY, { toValue: 8, duration: 140, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
    ]).start(() => {
      setAuthState(next);
      translateY.setValue(-8);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      ]).start();
    });
  }

  const { headline, subtitle } = HEADLINES[authState];

  return (
    <AuthLayout headline={headline} subtitle={subtitle}>
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        {authState === 'login' && (
          <LoginForm
            onGoToRegister={() => transitionTo('register')}
            onGoToForgotPassword={() => transitionTo('forgotPassword')}
          />
        )}
        {authState === 'register' && (
          <RegisterForm onGoToLogin={() => transitionTo('login')} />
        )}
        {authState === 'forgotPassword' && (
          <ForgotPasswordForm onGoToLogin={() => transitionTo('login')} />
        )}
      </Animated.View>
    </AuthLayout>
  );
}
