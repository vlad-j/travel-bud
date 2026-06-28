import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { TripProvider } from './src/context/TripContext';

async function syncTripStatuses(userId: string) {
  const { data: memberships } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', userId);

  if (!memberships || memberships.length === 0) return;

  const tripIds = memberships.map((m: any) => m.trip_id);
  const today = new Date().toISOString().split('T')[0];

  await supabase.from('trips').update({ status: 'completed' })
    .in('id', tripIds).lt('end_date', today);

  await supabase.from('trips').update({ status: 'active' })
    .in('id', tripIds).lte('start_date', today).gte('end_date', today);

  await supabase.from('trips').update({ status: 'upcoming' })
    .in('id', tripIds).gt('start_date', today);
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) syncTripStatuses(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { setSession(session); }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style="dark" translucent backgroundColor="transparent" />
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <TripProvider>
        <StatusBar style="dark" translucent backgroundColor="transparent" />
        {session ? <AppNavigator /> : <AuthNavigator />}
      </TripProvider>
    </NavigationContainer>
  );
}

registerRootComponent(App);