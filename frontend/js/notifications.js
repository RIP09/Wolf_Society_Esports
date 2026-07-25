import { dom } from './dom.js';

export const Notification = {
  container: null,

  init() {
    if (!this.container) {
      this.container = dom.create('div', { class: 'toast-container' });
      dom.append(document.body, this.container);
    }
  },

  show(message, type = 'info') {
    this.init();
    const toast = dom.create('div', { class: `toast toast-${type}` });
    const icon = dom.create('span', { text: type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ' });
    const text = dom.create('span', { text: message });
    toast.appendChild(icon);
    toast.appendChild(text);
    dom.append(this.container, toast);
    setTimeout(() => {
      dom.remove(toast);
    }, 4000);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error'); },
  info(msg) { this.show(msg, 'info'); }
};
