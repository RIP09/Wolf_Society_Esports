import { dom } from './dom.js';
import { api } from './api.js';
import { Notification } from './notifications.js';

export async function renderPlayerDashboard({ auth, api }) {
  const user = auth.user;
  // Fetch player profile (assuming player record linked to user)
  const players = await api.get('players', { filter: `user_id="${user.id}"` });
  const player = players.items?.[0] || null;

  const container = dom.create('div', { class: 'player-dashboard' });

  if (!player) {
    dom.append(container, dom.create('p', { text: 'Player profile not found. Please contact management.' }));
    return container;
  }

  // Fetch matches for this player
  const matches = await api.get('matches', { filter: `team="${player.team || ''}"`, sort: '-date' });

  const stats = dom.create('div', { class: 'stats-grid' });
  stats.appendChild(createStat('Matches Played', matches.items?.length || 0));
  stats.appendChild(createStat('Win Rate', '75%')); // Placeholder – compute from match results
  stats.appendChild(createStat('K/D', '1.2')); // Placeholder

  const matchList = dom.create('ul', { class: 'match-list' });
  (matches.items || []).slice(0, 5).forEach(m => {
    const li = dom.create('li', { text: `${m.opponent} – ${m.result} (${m.score || ''})` });
    matchList.appendChild(li);
  });

  dom.append(container, dom.create('h2', { text: `Welcome, ${player.display_name || user.name}` }), stats, dom.create('h3', { text: 'Recent Matches' }), matchList);

  function createStat(label, value) {
    const div = dom.create('div', { class: 'stat-card' });
    dom.append(div, dom.create('span', { class: 'stat-value', text: value }), dom.create('span', { class: 'stat-label', text: label }));
    return div;
  }

  return container;
}
