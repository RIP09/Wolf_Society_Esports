import { dom } from './dom.js';
import { api } from './api.js';
import { Modal } from './modals.js';
import { Notification } from './notifications.js';
import { createTable, updateTable } from './tables.js';

export function renderManagementDashboard({ auth, api }) {
  const container = dom.create('div', { class: 'dashboard' });

  // Stats cards
  const stats = dom.create('div', { class: 'stats-grid' });
  stats.appendChild(createStatCard('Players', 0));
  stats.appendChild(createStatCard('Matches', 0));
  stats.appendChild(createStatCard('Teams', 0));
  stats.appendChild(createStatCard('Announcements', 0));

  // Main content area with tabs
  const tabs = ['Players', 'Matches', 'Teams', 'Announcements', 'Tools', 'Settings'];
  const tabContainer = dom.create('div', { class: 'tabs' });
  tabs.forEach(name => {
    const btn = dom.create('button', { class: 'tab-btn', text: name });
    dom.on(btn, 'click', () => switchTab(name.toLowerCase()));
    tabContainer.appendChild(btn);
  });

  const content = dom.create('div', { class: 'tab-content' });

  // Switch tab handler
  async function switchTab(tab) {
    dom.empty(content);
    switch (tab) {
      case 'players': await renderPlayers(content); break;
      case 'matches': await renderMatches(content); break;
      case 'teams': await renderTeams(content); break;
      case 'announcements': await renderAnnouncements(content); break;
      case 'tools': await renderTools(content); break;
      case 'settings': renderSettings(content); break;
      default: content.textContent = 'Tab content';
    }
  }

  // ---------------------- PLAYERS CRUD ----------------------
  async function renderPlayers(container) {
    const data = await api.get('players', { sort: '-created', expand: 'team' });
    const items = data.items || [];

    // Add new player button
    const addBtn = dom.create('button', { class: 'btn-primary', text: '+ Add Player' });
    dom.on(addBtn, 'click', () => showPlayerModal());

    const table = createTable({
      columns: ['Display Name', 'Game', 'Role', 'Team', 'Status', 'Actions'],
      rows: items.map(p => [
        p.display_name,
        p.game || '-',
        p.role || '-',
        p.expand?.team?.name || 'None',
        p.status || 'inactive',
        `<button class="btn-edit" data-id="${p.id}">Edit</button> <button class="btn-delete" data-id="${p.id}">Delete</button>`
      ]),
      onEdit: (row, id) => showPlayerModal(id),
      onDelete: async (id) => {
        if (confirm('Delete this player?')) {
          await api.delete('players', id);
          Notification.success('Player deleted');
          await renderPlayers(container);
        }
      }
    });

    dom.append(container, addBtn, table);
  }

  async function showPlayerModal(id = null) {
    const isEdit = !!id;
    const player = isEdit ? await api.getById('players', id) : { display_name: '', game: 'Valorant', role: 'IGL', team: '', status: 'active' };

    const form = dom.create('form', { class: 'crud-form' });
    // Fields
    const fields = [
      { name: 'display_name', label: 'Display Name', type: 'text', value: player.display_name },
      { name: 'game', label: 'Game', type: 'select', options: ['Valorant', 'CS2', 'LoL', 'Apex', 'Fortnite', 'Other'], value: player.game },
      { name: 'role', label: 'Role', type: 'select', options: ['IGL', 'Entry', 'Support', 'AWPer', 'Flex'], value: player.role },
      { name: 'team', label: 'Team ID (optional)', type: 'text', value: player.team || '' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'trial'], value: player.status },
    ];
    fields.forEach(f => {
      const label = dom.create('label', { text: f.label });
      let input;
      if (f.type === 'select') {
        input = dom.create('select', { name: f.name });
        f.options.forEach(opt => {
          const option = dom.create('option', { value: opt, text: opt });
          if (opt === f.value) option.selected = true;
          input.appendChild(option);
        });
      } else {
        input = dom.create('input', { type: f.type, name: f.name, value: f.value || '' });
      }
      form.appendChild(label);
      form.appendChild(input);
    });

    const submitBtn = dom.create('button', { type: 'submit', text: isEdit ? 'Update' : 'Create' });
    form.appendChild(submitBtn);

    dom.on(form, 'submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      if (isEdit) {
        await api.update('players', id, data);
        Notification.success('Player updated');
      } else {
        await api.create('players', data);
        Notification.success('Player created');
      }
      Modal.close();
      // Refresh the list (we can re-render the whole tab)
      // Since we are inside a function, we need to re-fetch the tab content.
      // For simplicity, we'll just re-run the renderPlayers logic.
      const container = dom.closest(form, '.tab-content');
      await renderPlayers(container);
    });

    Modal.open({ title: isEdit ? 'Edit Player' : 'Add Player', content: form });
  }

  // Similar render functions for Matches, Teams, Announcements, Tools
  // (omitted for brevity – they follow the same pattern)

  // Helper to create stat cards
  function createStatCard(label, value) {
    const card = dom.create('div', { class: 'stat-card' });
    dom.append(card,
      dom.create('span', { class: 'stat-value', text: value }),
      dom.create('span', { class: 'stat-label', text: label })
    );
    return card;
  }

  // Build the layout
  dom.append(container, stats, tabContainer, content);
  // Load default tab
  await switchTab('players');
  return container;
}
