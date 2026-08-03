import { supabase } from './supabase-client.js';
import { getCurrentUser, logout } from './auth.js';

// ---- Data fetching ----
export async function getActivePlayers() {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('is_active', true)
    .order('ign');
  if (error) console.error(error);
  return data || [];
}

export async function getLatestNews(limit = 6) {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) console.error(error);
  return data || [];
}

export async function getMatches(status = null) {
  let query = supabase
    .from('matches')
    .select('*, tournament: tournament_id(name), mvp: mvp_id(ign)');
  if (status) query = query.eq('status', status);
  const { data, error } = await query.order('scheduled_at', { ascending: true });
  if (error) console.error(error);
  return data || [];
}

export async function getSponsors() {
  const { data, error } = await supabase.from('sponsors').select('*').order('display_order');
  if (error) console.error(error);
  return data || [];
}

export async function getMerchandise() {
  const { data, error } = await supabase.from('merchandise').select('*').eq('is_available', true);
  if (error) console.error(error);
  return data || [];
}

// ---- Navigation updater ----
export async function updateNav() {
  const user = await getCurrentUser();
  const nav = document.querySelector('nav .nav-links');
  if (!nav) return;

  let html = `
    <a href="/" class="nav-link">Home</a>
    <a href="./about.html" class="nav-link">About</a>
    <a href="./team.html" class="nav-link">Team</a>
    <a href="./matches.html" class="nav-link">Matches</a>
    <a href="./news.html" class="nav-link">News</a>
    <a href="./gallery.html" class="nav-link">Gallery</a>
    <a href="./shop.html" class="nav-link">Shop</a>
    <a href="./contact.html" class="nav-link">Contact</a>
  `;

  if (user) {
    const role = user.profile?.role;
    if (['management', 'admin', 'super_admin'].includes(role)) {
      html += `<a href="/frontend/admin/dashboard.html" class="nav-link">Admin</a>`;
    }
    html += `<a href="./dashboard.html" class="nav-link">Dashboard</a>`;
    html += `<a href="#" id="logout-link" class="nav-link text-red-400">Logout</a>`;
    nav.innerHTML = html;
    document.getElementById('logout-link')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await logout();
      window.location.href = '/';
    });
  } else {
    html += `<a href="./signup.html" class="nav-link">Sign Up</a>`;
    html += `<a href="./dashboard.html" class="nav-link">Login</a>`;
    nav.innerHTML = html;
  }

  // Mobile menu
  const mobileNav = document.querySelector('#mobile-menu');
  if (mobileNav) {
    mobileNav.innerHTML = nav.innerHTML.replace(/nav-link/g, 'nav-link-mobile');
    const logoutMobile = mobileNav.querySelector('#logout-link');
    if (logoutMobile) {
      logoutMobile.addEventListener('click', async (e) => {
        e.preventDefault();
        await logout();
        window.location.href = '/';
      });
    }
  }
}

// ---- Page‑specific initialisers ----
// This script runs on every page and will call the appropriate functions
// based on the page's content.

// We'll use a pattern where each page defines its own logic, but we centralise
// common actions like loading header/footer, particles, etc.
// For simplicity, we're already calling updateNav() from each page's own <script>.
// But we can also auto‑run based on page URL – but we'll keep explicit.
