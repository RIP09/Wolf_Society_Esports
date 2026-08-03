// // frontend/js/supabase-client.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/+esm';

// ============================================================
// SUPABASE CONFIG – Replace with your values
// ============================================================
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZmtlYmdhcG5jc3d0dmJ0YXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTg3MzUsImV4cCI6MjA5NjMzNDczNX0.Aj-GtD5sPCtuHWmZ5ZClSStwa3-b6ENtXr0uYaV-UzQ';


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// REALTIME SUBSCRIPTION HELPER
// ============================================================
export function subscribeToTable(table, onInsert, onUpdate, onDelete) {
    const channel = supabase
        .channel(`table-${table}-${Date.now()}`)
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

// ============================================================
// MATCHES
// ============================================================
export async function getLiveMatches() {
    const { data, error } = await supabase
        .from('matches')
        .select('*, home_team:teams!home_team_id(name), away_team:teams!away_team_id(name)')
        .eq('status', 'live')
        .order('start_time', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getAllMatches() {
    const { data, error } = await supabase
        .from('matches')
        .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
        .order('start_time', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createMatch(matchData) {
    const { data, error } = await supabase
        .from('matches')
        .insert(matchData)
        .select();

    if (error) throw error;
    return data;
}

export async function updateMatch(id, updates) {
    const { data, error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) throw error;
    return data;
}

export async function deleteMatch(id) {
    const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

// ============================================================
// NEWS
// ============================================================
export async function getLatestNews(limit = 3) {
    const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

export async function getAllNews() {
    const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function createNews(newsData) {
    const { data, error } = await supabase
        .from('news')
        .insert(newsData)
        .select();

    if (error) throw error;
    return data;
}

export async function updateNews(id, updates) {
    const { data, error } = await supabase
        .from('news')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) throw error;
    return data;
}

export async function deleteNews(id) {
    const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

// ============================================================
// TEAMS
// ============================================================
export async function getTeams() {
    const { data, error } = await supabase
        .from('teams')
        .select('*');

    if (error) throw error;
    return data || [];
}

// ============================================================
// PROFILES
// ============================================================
export async function getProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
}

export async function getAllProfiles() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function updateProfile(id, updates) {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) throw error;
    return data;
}

// ============================================================
// CONTRACTS
// ============================================================
export async function getContracts() {
    const { data, error } = await supabase
        .from('contracts')
        .select('*, profiles(id, full_name, username)');

    if (error) throw error;
    return data || [];
}

export async function upsertContract(contractData) {
    const { data, error } = await supabase
        .from('contracts')
        .upsert(contractData)
        .select();

    if (error) throw error;
    return data;
}

// ============================================================
// SCRIMS (practice matches)
// ============================================================
export async function getScrims() {
    const { data, error } = await supabase
        .from('scrims')
        .select('*, team:teams(*), coach:profiles(id, full_name)')
        .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function createScrim(scrimData) {
    const { data, error } = await supabase
        .from('scrims')
        .insert(scrimData)
        .select();

    if (error) throw error;
    return data;
}

export async function updateScrim(id, updates) {
    const { data, error } = await supabase
        .from('scrims')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) throw error;
    return data;
}

// ============================================================
// STORAGE – file uploads
// ============================================================
export async function uploadFile(bucket, path, file) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

    if (error) throw error;
    return data;
}

export async function getPublicUrl(bucket, path) {
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

    return data.publicUrl;
}

export async function deleteFile(bucket, path) {
    const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

    if (error) throw error;
    return true;
}
