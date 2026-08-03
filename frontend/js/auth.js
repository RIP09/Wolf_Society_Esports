import { supabase } from './supabase-client.js';

// Sign up (with email, password, and additional profile data)
export async function signUp(email, password, username, fullName) {
  // Step 1: Sign up user
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  // Step 2: Insert profile (role defaults to 'public')
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

// Get current user and profile
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

// Check if user has a specific role (or higher)
export async function hasRole(requiredRole) {
  const user = await getCurrentUser();
  if (!user) return false;
  const roleHierarchy = { public: 0, user: 1, management: 2, admin: 3, super_admin: 4 };
  const userLevel = roleHierarchy[user.profile?.role] ?? 0;
  const requiredLevel = roleHierarchy[requiredRole] ?? 0;
  return userLevel >= requiredLevel;
}

// Special: check if user is the super admin (WolfSociety)
export async function isSuperAdmin() {
  const user = await getCurrentUser();
  return user?.profile?.role === 'super_admin';
}
