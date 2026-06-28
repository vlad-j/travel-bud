import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useCurrentTrip } from '../context/TripContext';
import { useStatusBarHeight } from '../../hooks/useStatusBarHeight';

export default function JoinTripScreen() {
  const navigation = useNavigation<any>();
  const { setCurrentTripId } = useCurrentTrip();
  const statusBarHeight = useStatusBarHeight();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      Alert.alert('Invalid code', 'Please enter a valid invite code.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('join_trip_by_code', {
        invite_code_input: trimmed,
      });

      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }

      if (data?.error) {
        Alert.alert('Could not join', data.error);
        setLoading(false);
        return;
      }

      const tripId = data?.trip_id;
      const tripName = data?.trip_name;
      const alreadyMember = data?.already_member;

      if (!tripId) {
        Alert.alert('Error', 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      // Update trip context
      setCurrentTripId(tripId);

      Alert.alert(
        alreadyMember ? '✅ Already a member' : '🎉 Trip joined!',
        alreadyMember
          ? `You are already a member of "${tripName}".`
          : `Welcome to "${tripName}"! The trip has been added to your account.`,
        [
          {
            text: 'Open Trip',
            onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong.');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: statusBarHeight + 12 }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join a Trip</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Text style={styles.iconEmoji}>🔗</Text>
          </View>

          <Text style={styles.title}>Enter invite code</Text>
          <Text style={styles.subtitle}>
            Ask your travel companion to share their invite code from Trip Settings.
          </Text>

          {/* Code input */}
          <View style={styles.codeWrap}>
            <TextInput
              ref={inputRef}
              style={styles.codeInput}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              placeholder="ABC123"
              placeholderTextColor="#C0C0C0"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleJoin}
              autoFocus
            />
          </View>

          <Text style={styles.hint}>Codes are 6 characters, e.g. ABC123</Text>

          {/* Join button */}
          <TouchableOpacity
            style={[styles.joinBtn, (loading || code.trim().length < 4) && styles.joinBtnDisabled]}
            onPress={handleJoin}
            disabled={loading || code.trim().length < 4}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.joinBtnText}>Join Trip</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 28, color: '#1A1A1A', fontWeight: '300' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 32, paddingTop: 48 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: { fontSize: 36 },
  title: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  codeWrap: { width: '100%', marginBottom: 8 },
  codeInput: {
    width: '100%', textAlign: 'center',
    fontSize: 32, fontWeight: '900', color: '#1A1A1A',
    backgroundColor: '#F5F5F5', borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 20,
    borderWidth: 2, borderColor: '#E0E0E0',
    letterSpacing: 8,
  },
  hint: { fontSize: 12, color: '#BBB', marginBottom: 32 },
  joinBtn: {
    width: '100%', backgroundColor: '#4CAF50',
    borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginBottom: 12,
  },
  joinBtnDisabled: { backgroundColor: '#C8E6C9' },
  joinBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { paddingVertical: 12 },
  cancelText: { fontSize: 15, color: '#888', fontWeight: '500' },
});
