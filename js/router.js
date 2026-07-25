import { dom } from './dom.js';
import { Auth } from './auth.js';
import { renderPublicHome, renderAbout, renderTeams, renderContact } from './pages/public.js';
import { renderPlayerDashboard, renderPlayerProfile, renderPlayerMatches, renderPlayerTeam, renderPlayerTools } from './pages/player.js';
import { renderManagementDashboard, renderManagementPlayers, renderManagementMatches, renderManagementTeams, renderManagementTools, renderManagementAnnouncements, renderManagementSettings } from './pages/management.js';
import { renderLogin, renderRegister } from './pages/auth.js';

export class Router {
  constructor() {
    this.routes = [];
    this.currentRoute = null;
    this.auth = new Auth();
    this.initRoutes();
    this.setupNavigation();
  }

  initRoutes() {
    this.addRoute('/', renderPublicHome, 'public');
    this.addRoute('/about', renderAbout, 'public');
    this.addRoute('/teams', renderTeams, 'public');
    this.addRoute('/contact', renderContact, 'public');
    this.addRoute('/login', renderLogin, 'public');
    this.addRoute('/register', renderRegister, 'public');
    // Player routes
    this.addRoute('/player/dashboard', renderPlayerDashboard, 'player');
    this.addRoute('/player/profile', renderPlayerProfile, 'player');
    this.addRoute('/player/matches', renderPlayerMatches, 'player');
    this.addRoute('/player/team', renderPlayerTeam, 'player');
    this.addRoute('/player/tools', renderPlayerTools, 'player');
    // Management routes
    this.addRoute('/management/dashboard', renderManagementDashboard, 'management');
    this.addRoute('/management/players', renderManagementPlayers, 'management');
    this.addRoute('/management/matches', renderManagementMatches, 'management');
    this.addRoute('/management/teams', renderManagementTeams, 'management');
    this.addRoute('/management/tools', renderManagementTools, 'management');
    this.addRoute('/management/announcements', renderManagementAnnouncements, 'management');
    this.addRoute('/management/settings', renderManagementSettings, 'management');
    // 404
    this.addRoute('*', this.renderNotFound.bind(this), 'public');
  }

  addRoute(path, renderFn, role = 'public') {
    this.routes.push({ path, renderFn, role });
  }

  setupNavigation() {
    // Listen to hash changes (or use history API)
    window.addEventListener('popstate', () => this.handleRoute());
    // Intercept link clicks with data-route
    dom.on(document, 'click', '[data-route]', (e) => {
      e.preventDefault();
      const path = e.target.dataset.route;
      this.navigate(path);
    });
  }

  navigate(path) {
    history.pushState(null, '', path);
    this.handleRoute();
  }

  handleRoute() {
    const path = window.location.pathname;
    const route = this.routes.find(r => r.path === path) || this.routes.find(r => r.path === '*');
    if (!route) return this.renderNotFound();

    // Check role
    const user = this.auth.user;
    const role = user?.role || 'public';
    const required = route.role;
    if (required === 'player' && role !== 'player' && role !== 'management') {
      this.navigate('/login');
      return;
    }
    if (required === 'management' && role !== 'management') {
      this.navigate('/login');
      return;
    }

    this.currentRoute = route;
    const app = dom.id('app');
    dom.empty(app);
    dom.append(app, route.renderFn({ auth: this.auth, api: window.api }));
  }

  renderNotFound() {
    return dom.create('div', { text: '404 – Page not found' });
  }

  init() {
    this.handleRoute();
    // Listen for auth changes
    this.auth.onChange(() => {
      this.handleRoute();
      // Also update nav
      this.updateNav();
    });
    this.updateNav();
  }

  updateNav() {
    // Render nav based on auth state
    // Navigation component will handle this
  }
}
