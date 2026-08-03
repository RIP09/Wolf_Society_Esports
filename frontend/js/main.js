// main.js
import { supabase, subscribeToTable, getLiveMatches, getLatestNews } from './supabase-client.js';
import { getSession, isStaff, signOut } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  // ---- Navbar active link ----
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPath) link.classList.add('active');
  });

  // ---- Auth UI sync ----
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

  // ---- Live ticker ----
  const tickerEl = document.getElementById('liveTicker');
  if (tickerEl) {
    const updateTicker = (matches) => {
      const items = matches.map(m => `
        <span class="ticker-item">
          ${m.status === 'live' ? '<span class="badge-live">live</span>' : ''}
          ${m.home_team.name} vs. ${m.away_team.name}
          <span class="vs">·</span> ${m.home_score}-${m.away_score}
          <span class="vs">·</span> ${m.time_elapsed || '00:00'}
        </span>
      `).join('');
      tickerEl.innerHTML = items + items; // seamless scroll
    };

    try {
      const matches = await getLiveMatches();
      updateTicker(matches);
    } catch (e) { console.warn('Ticker init error', e); }

    subscribeToTable('matches', (newMatch) => {
      if (newMatch.status === 'live') {
        getLiveMatches().then(updateTicker);
      }
    });
  }

  // ---- News feed ----
  const newsGrid = document.getElementById('newsGrid');
  if (newsGrid) {
    try {
      const news = await getLatestNews(3);
      newsGrid.innerHTML = news.map(item => `
        <article class="news-card">
          <div class="card-img">${item.icon || '📰'}</div>
          <div class="card-body">
            <span style="font-size:0.7rem; color:var(--primary); text-transform:uppercase; letter-spacing:0.06em;">${item.category || 'News'}</span>
            <h3>${item.title}</h3>
            <p>${item.excerpt}</p>
            <a href="news.html" style="color:var(--primary); font-weight:600; font-size:0.85rem;">Read more →</a>
          </div>
        </article>
      `).join('');
    } catch (e) { console.warn('News load error', e); }
  }

  // ---- 3D tilt on hero card ----
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

  // ---- Scroll reveal ----
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => observer.observe(el));

  // ---- Protected pages redirect ----
  if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('/admin/')) {
    if (!session) {
      window.location.href = 'signup.html';
    } else {
      const staff = await isStaff();
      if (!staff) window.location.href = 'index.html';
    }
  }
});
