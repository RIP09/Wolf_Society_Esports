import { api } from './api.js';
import { dom } from './dom.js';

export class Auth {
  constructor() {
    this.user = api.auth.getUser();
    this.token = api.auth.getToken();
    this.listeners = [];
  }

  isLoggedIn() { return !!this.token; }
  getRole() { return this.user?.role || 'public'; }

  async login(email, password) {
    const data = await api.auth.login(email, password);
    this.user = data.record;
    this.token = data.token;
    this.notify();
    return data;
  }

  logout() {
    api.auth.logout();
    this.user = null;
    this.token = null;
    this.notify();
  }

  // Register for auth state changes
  onChange(cb) { this.listeners.push(cb); }

  notify() {
    this.listeners.forEach(cb => cb(this.user, this.token));
  }
}
