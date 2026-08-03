import { supabase } from './supabase-client.js';

// Sign up
export async function signUp(email, password, username, fullName) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  // Insert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{ id: data.user.id, username, full_name: fullName, role: 'public' }]);
  if (profileError) throw profileError;
  return data;
}

// Login
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Logout
export async function logout() {
  await supabase.auth.signOut();
}

// Get current user + profile
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return { ...user, profile };
}

// Role check (hierarchy: public < user < management < admin < super_admin)
export async function hasRole(requiredRole) {
  const user = await getCurrentUser();
  if (!user) return false;
  const hierarchy = { public: 0, user: 1, management: 2, admin: 3, super_admin: 4 };
  const userLevel = hierarchy[user.profile?.role] ?? 0;
  return userLevel >= hierarchy[requiredRole];
}

export async function isSuperAdmin() {
  const user = await getCurrentUser();
  return user?.profile?.role === 'super_admin';
}
