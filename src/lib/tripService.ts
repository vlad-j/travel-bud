import { supabase } from './supabase';

export async function getCurrentTrip(userId: string) {
  const { data: memberships } = await supabase
    .from('trip_members')
    .select('trip_id')
    .eq('user_id', userId);

  if (!memberships || memberships.length === 0) return null;

  const tripIds = memberships.map((m) => m.trip_id);

  const { data, error } = await supabase
    .from('trips')
    .select(`*, destinations(id, name, country, nights, order_index)`)
    .in('id', tripIds)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

export async function getTodayActivities(tripId: string) {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('trip_id', tripId)
    .eq('date', today)
    .order('time', { ascending: true });

  if (error) return [];
  return data;
}

export async function getTripDayNumber(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

export function calculateTripStatus(startDate: string, endDate: string): 'active' | 'upcoming' | 'completed' {
  const todayStr = new Date().toISOString().split('T')[0];
  
  if (endDate < todayStr) return 'completed';
  if (startDate <= todayStr) return 'active';
  return 'upcoming';
}