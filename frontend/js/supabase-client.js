// frontend/js/supabase-client.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

// Use environment variables (for Vercel/Netlify) or fallback to hardcoded
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://tdfkebgapncswtvbtaqy.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZmtlYmdhcG5jc3d0dmJ0YXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTg3MzUsImV4cCI6MjA5NjMzNDczNX0.Aj-GtD5sPCtuHWmZ5ZClSStwa3-b6ENtXr0uYaV-UzQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Realtime subscription helper
export function subscribeToTable(table, onInsert, onUpdate, onDelete) {
  const channel = supabase
    .channel(`table-${table}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, (payload) => {
      if (onInsert) onInsert(payload.new);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table }, (payload) => {
      if (onUpdate) onUpdate(payload.new);
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table }, (payload) => {
      if (onDelete) onDelete(payload.old);
    })
    .subscribe();
  return channel;
}

// Fetch live matches
export async function getLiveMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select('*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
    .eq('status', 'live')
    .order('start_time', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Fetch latest news
export async function getLatestNews(limit = 3) {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}
