// auth.js
import { supabase } from './supabase-client.js';

export async function signUp(email, password, fullName, role = 'fan') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } }
  });
  if (error) throw error;
  // Insert profile
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      role: role,
      username: email.split('@')[0]
    });
  }
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function isStaff() {
  const session = await getSession();
  if (!session) return false;
  const profile = await getProfile(session.user.id);
  return ['admin', 'manager', 'coach'].includes(profile.role);
}

export async function isAdmin() {
  const session = await getSession();
  if (!session) return false;
  const profile = await getProfile(session.user.id);
  return profile.role === 'admin';
}
