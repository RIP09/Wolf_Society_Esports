import { dom } from './dom.js';

const API_BASE = import.meta.env.VITE_PB_URL || 'http://localhost:8090/api';
let token = localStorage.getItem('pb_token');

// API object
export const api = {
  // Auth
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE}/collections/users/auth-with-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email, password })
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      token = data.token;
      localStorage.setItem('pb_token', token);
      localStorage.setItem('pb_user', JSON.stringify(data.record));
      return data;
    },
    logout: () => {
      token = null;
      localStorage.removeItem('pb_token');
      localStorage.removeItem('pb_user');
    },
    getToken: () => token,
    getUser: () => JSON.parse(localStorage.getItem('pb_user') || 'null')
  },

  // GET (list)
  get: async (collection, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const url = `${API_BASE}/collections/${collection}/records?${qs}`;
    const res = await fetch(url, {
      headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  },

  // GET (single)
  getById: async (collection, id, expand = '') => {
    const url = `${API_BASE}/collections/${collection}/records/${id}${expand ? `?expand=${expand}` : ''}`;
    const res = await fetch(url, {
      headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    });
    if (!res.ok) throw new Error('Record not found');
    return res.json();
  },

  // CREATE
  create: async (collection, data) => {
    const res = await fetch(`${API_BASE}/collections/${collection}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Create failed');
    return res.json();
  },

  // UPDATE
  update: async (collection, id, data) => {
    const res = await fetch(`${API_BASE}/collections/${collection}/records/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Update failed');
    return res.json();
  },

  // DELETE
  delete: async (collection, id) => {
    const res = await fetch(`${API_BASE}/collections/${collection}/records/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': token ? `Bearer ${token}` : '' }
    });
    if (!res.ok) throw new Error('Delete failed');
    return true;
  },

  // Realtime subscription (WebSocket via PocketBase JS SDK – but we can implement manually)
  // For simplicity, we'll use PocketBase's JS SDK or the raw EventSource.
  // We'll implement a simple polling fallback if needed.
  subscribe: (collection, callback) => {
    // PocketBase realtime uses SSE; we'll use the SDK in a later version.
    // For now, we'll use setInterval polling (demo)
    const interval = setInterval(async () => {
      try {
        const data = await api.get(collection, { sort: '-created', perPage: 50 });
        callback(data);
      } catch (e) { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }
};
