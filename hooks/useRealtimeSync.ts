// ─── useRealtimeSync ──────────────────────────────────────────────────────────
// Lightweight real-time sync hook.
// Subscribes only to the tables each screen needs.
// Triggers existing refresh function on changes.
// Cleans up on unmount. Debounces rapid events.

import { useEffect, useRef } from 'react';
import { supabase } from '../src/lib/supabase';

type RealtimeTable =
  | 'activities'
  | 'expenses'
  | 'journal_entries'
  | 'transport'
  | 'accommodations';

interface UseRealtimeSyncOptions {
  tripId: string | null;
  tables: RealtimeTable[];
  onChange: () => void;
  debounceMs?: number;
  enabled?: boolean;
}

export function useRealtimeSync({
  tripId,
  tables,
  onChange,
  debounceMs = 500,
  enabled = true,
}: UseRealtimeSyncOptions): void {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!tripId || !enabled || tables.length === 0) return;

    function triggerRefresh() {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        onChangeRef.current();
      }, debounceMs);
    }

    const channelName = `realtime-${tripId}-${tables.join('-')}`;

    let channel = supabase.channel(channelName);

    for (const table of tables) {
      channel = channel.on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table,
          filter: `trip_id=eq.${tripId}`,
        },
        () => {
          triggerRefresh();
        }
      );
    }

    channel.subscribe((status: string) => {
      if (status === 'CHANNEL_ERROR') {
        console.warn(`[RealtimeSync] Channel error for ${channelName}`);
      }
    });

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [tripId, tables.join(','), enabled, debounceMs]);
}
