/**
 * main.js – Shared JavaScript for all pages
 * Handles navigation toggle, Supabase auth check, and common utilities
 */

// ============================================================
// Supabase Configuration
// ============================================================
const SUPABASE_URL = 'https://tdfkebgapncswtvbtaqy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZmtlYmdhcG5jc3d0dmJ0YXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTg3MzUsImV4cCI6MjA5NjMzNDczNX0.Aj-GtD5sPCtuHWmZ5ZClSStwa3-b6ENtXr0uYaV-UzQ';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// Navigation Toggle (Mobile)
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
        toggle.addEventListener('click', function() {
            navLinks.classList.toggle('open');
        });
    }

    // Highlight current page in nav
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        }
    });
});

// ============================================================
// Auth Check (for admin pages)
// ============================================================
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!session) {
        // Redirect to login if on admin page
        const path = window.location.pathname;
        if (path.includes('admin') || path.includes('dashboard')) {
            window.location.href = 'login.html';
        }
        return null;
    }
    return session;
}

// ============================================================
// Logout
// ============================================================
async function logoutUser() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

// ============================================================
// Fetch Table Helper
// ============================================================
async function fetchTable(table, orderBy = 'id') {
    const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending: true });
    if (error) console.error(`Error fetching ${table}:`, error);
    return data || [];
}

// ============================================================
// Run auth check on admin pages
// ============================================================
if (window.location.pathname.includes('admin') || window.location.pathname.includes('dashboard')) {
    checkAuth();
}
