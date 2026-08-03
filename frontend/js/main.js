// frontend/js/main.js
import { supabase, subscribeToTable, getLiveMatches, getLatestNews } from './supabase-client.js';
import { getSession, isStaff, signOut, getCurrentProfile } from './auth.js';

// ============================================================
// REGISTER GSAP PLUGINS
// ============================================================
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', async () => {
    // ============================================================
    // 1. NAVBAR TOGGLE
    // ============================================================
    const toggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (toggle && navLinks) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.classList.toggle('open');
            this.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('open');
                toggle.classList.remove('active');
            });
        });
    }

    // ============================================================
    // 2. NAVBAR SCROLL EFFECT
    // ============================================================
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // ============================================================
    // 3. ACTIVE LINK
    // ============================================================
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (href === 'index.html' && currentPath === '')) {
            link.classList.add('active');
        }
    });

    // ============================================================
    // 4. RIPPLE EFFECT
    // ============================================================
    document.querySelectorAll('.btn-ripple').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.cssText =
                `position:absolute; left:${x}px; top:${y}px; width:20px; height:20px; border-radius:50%; background:rgba(255,255,255,0.3); transform:scale(0); animation:rippleAnim 0.6s linear; pointer-events:none;`;
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // ============================================================
    // 5. AUTH UI SYNC
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
    // 6. 3D TILT ON HERO CARD
    // ============================================================
    const heroCard = document.getElementById('heroCard');
    if (heroCard) {
        document.addEventListener('mousemove', (e) => {
            const rect = heroCard.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            heroCard.style.transform =
                `rotateY(${x * 10}deg) rotateX(${y * -10}deg) translateZ(10px)`;
        });
        document.addEventListener('mouseleave', () => {
            heroCard.style.transform = 'rotateY(0deg) rotateX(0deg) translateZ(0px)';
        });
    }

    // ============================================================
    // 7. CINEMATIC HERO TITLE
    // ============================================================
    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle) {
        const letters = heroTitle.textContent.split('');
        heroTitle.innerHTML = letters.map(l =>
            `<span style="display:inline-block; opacity:0; transform:translateY(30px) rotateX(40deg);">${l === ' ' ? '&nbsp;' : l}</span>`
        ).join('');

        gsap.to(heroTitle.querySelectorAll('span'), {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.6,
            stagger: 0.04,
            ease: 'power3.out',
            delay: 0.3,
        });
    }

    // ============================================================
    // 8. HERO SUBTITLE
    // ============================================================
    const heroSub = document.getElementById('heroSub');
    if (heroSub) {
        gsap.from(heroSub, {
            opacity: 0,
            y: 30,
            duration: 1,
            delay: 0.8,
            ease: 'power3.out',
        });
    }

    // ============================================================
    // 9. LIVE TICKER (real‑time)
    // ============================================================
    const tickerEl = document.getElementById('liveTicker');
    if (tickerEl) {
        const updateTicker = (matches) => {
            if (!matches || matches.length === 0) {
                tickerEl.innerHTML =
                    `<span class="ticker-item">No live matches</span><span class="ticker-item">No live matches</span>`;
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
            tickerEl.innerHTML = items + items;
        };

        try {
            const matches = await getLiveMatches();
            updateTicker(matches);
        } catch (e) {
            console.warn('Ticker init error:', e);
            tickerEl.innerHTML =
                `<span class="ticker-item">⚡ Loading...</span><span class="ticker-item">⚡ Loading...</span>`;
        }

        subscribeToTable('matches', (newMatch) => {
            if (newMatch.status === 'live') {
                getLiveMatches().then(updateTicker).catch(console.warn);
            }
        });
    }

    // ============================================================
    // 10. NEWS GRID
    // ============================================================
    const newsGrid = document.getElementById('newsGrid');
    if (newsGrid) {
        try {
            const news = await getLatestNews(3);
            if (!news || news.length === 0) {
                newsGrid.innerHTML =
                    `<div class="news-card" style="grid-column:1/-1;text-align:center;padding:2rem;"><p style="color:var(--text-secondary);">No news yet. Check back soon!</p></div>`;
            } else {
                newsGrid.innerHTML = news.map(item => `
                    <article class="news-card">
                        <div class="card-img">${item.icon || '📰'}</div>
                        <div class="card-body">
                            <span style="font-size:0.7rem;color:var(--primary);text-transform:uppercase;letter-spacing:0.06em;">${item.category || 'News'}</span>
                            <h3>${item.title}</h3>
                            <p>${item.excerpt || ''}</p>
                            <a href="news.html" class="btn btn-outline btn-sm" style="margin-top:0.5rem;">Read more →</a>
                        </div>
                    </article>
                `).join('');
            }
        } catch (e) {
            console.warn('News load error:', e);
            newsGrid.innerHTML =
                `<div class="news-card" style="grid-column:1/-1;text-align:center;padding:2rem;"><p style="color:var(--text-secondary);">Could not load news.</p></div>`;
        }
    }

    // ============================================================
    // 11. GSAP SCROLL‑TRIGGERED ANIMATIONS
    // ============================================================

    // Stats
    document.querySelectorAll('.stat-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            y: 40,
            duration: 0.8,
            delay: i * 0.1,
            ease: 'power3.out',
        });
    });

    // News cards
    document.querySelectorAll('.news-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: card,
                start: 'top 88%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            y: 50,
            duration: 0.7,
            delay: i * 0.12,
            ease: 'power3.out',
        });
    });

    // 3D Gallery
    document.querySelectorAll('.gallery-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 90%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            scale: 0.7,
            rotationY: 20,
            duration: 0.8,
            delay: i * 0.08,
            ease: 'back.out(1.7)',
        });
    });

    // Sponsors
    document.querySelectorAll('.sponsor-item').forEach((item, i) => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 92%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            y: 30,
            duration: 0.6,
            delay: i * 0.06,
            ease: 'power2.out',
        });
    });

    // Parallax layers
    const parallaxBg = document.querySelector('.parallax-layer-bg');
    const parallaxMid = document.querySelector('.parallax-layer-mid');
    const parallaxSection = document.querySelector('.parallax-section');

    if (parallaxSection) {
        gsap.to(parallaxBg, {
            scrollTrigger: {
                trigger: parallaxSection,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
            },
            y: 80,
            scale: 1.1,
            ease: 'none',
        });

        gsap.to(parallaxMid, {
            scrollTrigger: {
                trigger: parallaxSection,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1,
            },
            y: -60,
            rotation: 10,
            ease: 'none',
        });
    }

    // Match ticker
    const ticker = document.querySelector('.match-ticker');
    if (ticker) {
        gsap.from(ticker, {
            scrollTrigger: {
                trigger: ticker,
                start: 'top 90%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            scale: 0.95,
            duration: 0.8,
            ease: 'power2.out',
        });
    }

    // CTA section
    const ctaSection = document.querySelector('.section:last-of-type');
    if (ctaSection) {
        gsap.from(ctaSection, {
            scrollTrigger: {
                trigger: ctaSection,
                start: 'top 85%',
                toggleActions: 'play none none none',
            },
            opacity: 0,
            y: 40,
            duration: 1,
            ease: 'power3.out',
        });
    }

    // ============================================================
    // 12. MODAL CONTROLS
    // ============================================================
    document.querySelectorAll('[data-modal-open]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.modalOpen);
            if (target) target.classList.add('active');
        });
    });

    document.querySelectorAll('.modal-overlay .close-btn, .modal-overlay').forEach(el => {
        el.addEventListener('click', function(e) {
            if (e.target === this || this.classList.contains('close-btn')) {
                this.closest('.modal-overlay').classList.remove('active');
            }
        });
    });

    // ============================================================
    // 13. PROTECTED PAGES
    // ============================================================
    if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('/admin/')) {
        if (!session) {
            window.location.href = '../signup.html';
        } else {
            const staff = await isStaff();
            if (!staff) window.location.href = '../index.html';
        }
    }

    console.log('🐺 Wolf Society Esports — Next‑Gen Experience');
    console.log('✨ GSAP + ScrollTrigger + Lottie + 3D interactions');
});
