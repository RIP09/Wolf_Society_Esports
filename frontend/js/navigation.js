import { dom } from './dom.js';
import { Auth } from './auth.js';

const auth = new Auth();

export function renderNav() {
  const nav = dom.id('main-nav');
  dom.empty(nav);
  const brand = dom.create('a', { class: 'brand', href: '/', text: '🐺 Wolf' });
  brand.innerHTML = '🐺 <span>Society</span>';
  const links = dom.create('div', { class: 'nav-links' });

  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/teams', label: 'Teams' },
    { href: '/contact', label: 'Contact' },
  ];

  const user = auth.user;
  const role = user?.role || 'public';

  publicLinks.forEach(link => {
    const a = dom.create('a', { href: link.href, text: link.label, 'data-route': true });
    links.appendChild(a);
  });

  if (role === 'player') {
    links.appendChild(dom.create('a', { href: '/player/dashboard', text: 'Dashboard', 'data-route': true }));
    links.appendChild(dom.create('a', { href: '/player/profile', text: 'Profile', 'data-route': true }));
  } else if (role === 'management') {
    links.appendChild(dom.create('a', { href: '/management/dashboard', text: 'Manage', 'data-route': true }));
  }

  if (auth.isLoggedIn()) {
    const logoutBtn = dom.create('button', { class: 'btn btn-outline', text: 'Logout' });
    dom.on(logoutBtn, 'click', () => {
      auth.logout();
      window.location.href = '/';
    });
    links.appendChild(logoutBtn);
  } else {
    links.appendChild(dom.create('a', { href: '/login', text: 'Login', 'data-route': true }));
  }

  nav.appendChild(brand);
  nav.appendChild(links);
}

export function renderFooter() {
  const footer = dom.id('main-footer');
  dom.empty(footer);
  footer.textContent = '© 2026 Wolf Society Esports. All rights reserved.';
}
