// frontend/js/auth.js
import { supabase } from './supabase-client.js';

// ============================================================
// AUTHENTICATION
// ============================================================

export async function signUp(email, password, fullName, role = 'fan') {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName, role }
            }
        });

        if (error) throw error;

        if (data.user) {
            try {
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    full_name: fullName,
                    role: role,
                    username: email.split('@')[0]
                });
            } catch (profileErr) {
                console.warn('Profile creation failed:', profileErr);
            }
        }

        return data;
    } catch (err) {
        throw err;
    }
}

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

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

export async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
}

export async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html'
    });
    if (error) throw error;
}

export async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    });
    if (error) throw error;
}

// ============================================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================================

export async function getProfile(userId) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.warn('Profile fetch error:', err);
        return null;
    }
}

export async function getCurrentProfile() {
    const user = await getCurrentUser();
    if (!user) return null;
    return await getProfile(user.id);
}

export async function isStaff() {
    const profile = await getCurrentProfile();
    if (!profile) return false;
    return ['admin', 'manager', 'coach'].includes(profile.role);
}

export async function isAdmin() {
    const profile = await getCurrentProfile();
    if (!profile) return false;
    return profile.role === 'admin';
}

export async function isManager() {
    const profile = await getCurrentProfile();
    if (!profile) return false;
    return profile.role === 'manager' || profile.role === 'admin';
}

// ============================================================
// USER MANAGEMENT (admin only)
// ============================================================

export async function getAllUsers() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function updateUserRole(userId, newRole) {
    const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select();

    if (error) throw error;
    return data;
}
