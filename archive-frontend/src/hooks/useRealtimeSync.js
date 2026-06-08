// useRealtimeSync.js – Supabase Realtime hook
import { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * events: { [eventName]: handler }
 * Handlers are stored in a ref to avoid re‑creating the channel on every render.
 */
export function useRealtimeSync(events) {
  const channelRef = useRef(null);
  const eventsRef = useRef(events);

  // Keep the latest event handlers in the ref
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    // Initialize Supabase channel (named "realtime")
    const channel = supabase.channel('realtime');
    channelRef.current = channel;

    // Register a generic broadcast listener that forwards to the appropriate handler
    channel.on('broadcast', {}, payload => {
      const { event, data } = payload;
      const handler = eventsRef.current?.[event];
      if (handler) {
        handler(data);
      }
    });

    // Subscribe to the channel once
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ [RealTime] Supabase channel subscribed.');
      }
    });

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        console.log('⚠️ [RealTime] Supabase channel unsubscribed.');
      }
    };
  }, []); // empty deps – subscribe only once

  return null;
}
