import { supabase } from './supabase-client.js';
import { getCurrentUser, logout } from './auth.js';

// Inject header and footer (using fetch to include external HTML – but we'll embed static for simplicity)
// Instead, we'll have a function to load common HTML via innerHTML.

export async function loadHeaderFooter() {
  // For simplicity, we'll include the header/footer directly in each HTML file.
  // But we can use a central function if needed.
}

// Fetch data functions (same as before)
export async function getActivePlayers() { ... }
export async function getLatestNews(limit) { ... }
export async function getMatches(status) { ... }
export async function getSponsors() { ... }
export async function getMerchandise() { ... }

// Update navigation based on login status
export async function updateNav() {
  const user = await getCurrentUser();
  const nav = document.querySelector('nav .nav-links');
  if (!nav) return;
  if (user) {
    // Show dashboard link, etc.
    // Also show admin link if admin/super_admin
    const role = user.profile?.role;
    let adminLink = '';
    if (['admin', 'super_admin', 'management'].includes(role)) {
      adminLink = `<a href="./admin/dashboard.html" class="nav-link">Admin</a>`;
    }
    nav.innerHTML = `
      <a href="/" class="nav-link">Home</a>
      <a href="./about.html" class="nav-link">About</a>
      <a href="./team.html" class="nav-link">Team</a>
      <a href="./matches.html" class="nav-link">Matches</a>
      <a href="./news.html" class="nav-link">News</a>
      <a href="./gallery.html" class="nav-link">Gallery</a>
      <a href="./shop.html" class="nav-link">Shop</a>
      <a href="./contact.html" class="nav-link">Contact</a>
      ${adminLink}
      <a href="./dashboard.html" class="nav-link">Dashboard</a>
      <a href="#" id="logout-link" class="nav-link text-red-400">Logout</a>
    `;
    document.getElementById('logout-link')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await logout();
      window.location.href = '/';
    });
  } else {
    nav.innerHTML = `
      <a href="/" class="nav-link">Home</a>
      <a href="./about.html" class="nav-link">About</a>
      <a href="./team.html" class="nav-link">Team</a>
      <a href="./matches.html" class="nav-link">Matches</a>
      <a href="./news.html" class="nav-link">News</a>
      <a href="./gallery.html" class="nav-link">Gallery</a>
      <a href="./shop.html" class="nav-link">Shop</a>
      <a href="./contact.html" class="nav-link">Contact</a>
      <a href="./signup.html" class="nav-link">Sign Up</a>
      <a href="./dashboard.html" class="nav-link">Login</a>
    `;
  }
}
