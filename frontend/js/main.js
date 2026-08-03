// frontend/js/main.js
import { supabase, subscribeToTable, getLiveMatches, getLatestNews } from './supabase-client.js';
import { getSession, isStaff, signOut } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  // ============================================================
  //  1. NAVBAR TOGGLE (FIXED)
  // ============================================================
  const toggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      navLinks.classList.toggle('open');
      this.classList.toggle('active');
    });
    // Close nav when a link is clicked (mobile)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        navLinks.classList.remove('open');
        toggle.classList.remove('active');
      });
    });
  }

  // ============================================================
  //  2. NAVBAR ACTIVE LINK
  // ============================================================
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPath) link.classList.add('active');
  });

  // ============================================================
  //  3. AUTH UI SYNC
  // ============================================================
  const session = await getSession();
  const signupLink = document.getElementById('navSignup');
  const dashboardLink = document.getElementById('navDashboard');
  const logoutBtn = document.getElementById('navLogout');

  if (session) {
    if (signupLink) signupLink.style.display = 'none';
    if (dashboardLink) {
      const staff = await isStaff();
      dashboardLink.style.display = staff ? 'inline-flex' : 'none';
    }
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-flex';
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await signOut();
        window.location.href = 'index.html';
      });
    }
  } else {
    if (signupLink) signupLink.style.display = 'inline-flex';
    if (dashboardLink) dashboardLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }

  // ============================================================
  //  4. LIVE TICKER (FIXED)
  // ============================================================
  const tickerEl = document.getElementById('liveTicker');
  if (tickerEl) {
    const updateTicker = (matches) => {
      if (!matches || matches.length === 0) {
        tickerEl.innerHTML = `
          <span class="ticker-item">No live matches at the moment</span>
          <span class="ticker-item">No live matches at the moment</span>
        `;
        return;
      }
      const items = matches.map(m => `
        <span class="ticker-item">
          ${m.status === 'live' ? '<span class="badge-live">live</span>' : ''}
          ${m.home_team?.name || 'TBD'} vs. ${m.away_team?.name || 'TBD'}
          <span class="vs">·</span> ${m.home_score ?? 0}-${m.away_score ?? 0}
          <span class="vs">·</span> ${m.time_elapsed || '00:00'}
        </span>
      `).join('');
      // Duplicate for seamless scroll
      tickerEl.innerHTML = items + items;
    };

    try {
      const matches = await getLiveMatches();
      updateTicker(matches);
    } catch (e) {
      console.warn('Ticker init error:', e);
      tickerEl.innerHTML = `
        <span class="ticker-item">⚡ Live matches loading...</span>
        <span class="ticker-item">⚡ Live matches loading...</span>
      `;
    }

    // Subscribe to match updates
    subscribeToTable('matches', (newMatch) => {
      if (newMatch.status === 'live') {
        getLiveMatches().then(updateTicker).catch(console.warn);
      }
    });
  }

  // ============================================================
  //  5. NEWS GRID (FIXED)
  // ============================================================
  const newsGrid = document.getElementById('newsGrid');
  if (newsGrid) {
    try {
      const news = await getLatestNews(3);
      if (!news || news.length === 0) {
        newsGrid.innerHTML = `
          <div class="news-card" style="grid-column: 1 / -1; text-align:center; padding:2rem;">
            <p style="color:var(--text-secondary);">No news yet. Check back soon!</p>
          </div>
        `;
      } else {
        newsGrid.innerHTML = news.map(item => `
          <article class="news-card">
            <div class="card-img">${item.icon || '📰'}</div>
            <div class="card-body">
              <span style="font-size:0.7rem; color:var(--primary); text-transform:uppercase; letter-spacing:0.06em;">${item.category || 'News'}</span>
              <h3>${item.title}</h3>
              <p>${item.excerpt || ''}</p>
              <a href="news.html" style="color:var(--primary); font-weight:600; font-size:0.85rem;">Read more →</a>
            </div>
          </article>
        `).join('');
      }
    } catch (e) {
      console.warn('News load error:', e);
      newsGrid.innerHTML = `
        <div class="news-card" style="grid-column: 1 / -1; text-align:center; padding:2rem;">
          <p style="color:var(--text-secondary);">Could not load news. Please refresh.</p>
        </div>
      `;
    }
  }

  // ============================================================
  //  6. 3D TILT ON HERO CARD
  // ============================================================
  const heroCard = document.querySelector('.hero-3d-card');
  if (heroCard) {
    document.addEventListener('mousemove', (e) => {
      const rect = heroCard.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      heroCard.style.transform = `rotateY(${x*8}deg) rotateX(${y*-8}deg) translateZ(20px)`;
    });
    document.addEventListener('mouseleave', () => {
      heroCard.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0px)';
    });
  }

  // ============================================================
  //  7. SCROLL REVEAL
  // ============================================================
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => observer.observe(el));

  // ============================================================
  //  8. PROTECTED PAGES REDIRECT
  // ============================================================
  if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('/admin/')) {
    if (!session) {
      window.location.href = 'signup.html';
    } else {
      const staff = await isStaff();
      if (!staff) window.location.href = 'index.html';
    }
  }
});
