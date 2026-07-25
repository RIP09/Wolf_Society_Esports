import { dom } from './dom.js';
import { Notification } from './notifications.js';

export function createTable({ columns, rows, onEdit, onDelete }) {
  const container = dom.create('div', { class: 'table-container' });
  const table = dom.create('table');
  const thead = dom.create('thead');
  const trHead = dom.create('tr');
  columns.forEach(col => {
    trHead.appendChild(dom.create('th', { text: col }));
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = dom.create('tbody');
  rows.forEach((rowData, idx) => {
    const tr = dom.create('tr', { 'data-id': rowData.id || idx });
    rowData.forEach(cell => {
      const td = dom.create('td');
      // If cell contains HTML, set innerHTML
      if (typeof cell === 'string' && cell.includes('<button')) {
        td.innerHTML = cell;
      } else {
        td.textContent = cell;
      }
      tr.appendChild(td);
    });
    // Attach event listeners for edit/delete buttons
    const editBtn = tr.querySelector('.btn-edit');
    const delBtn = tr.querySelector('.btn-delete');
    if (editBtn) dom.on(editBtn, 'click', () => onEdit?.(tr.dataset.id));
    if (delBtn) dom.on(delBtn, 'click', () => onDelete?.(tr.dataset.id));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
  return container;
}

export function updateTable(table, newRows) {
  const tbody = table.querySelector('tbody');
  dom.empty(tbody);
  // Rebuild rows (same logic as above)
  // ...
}
