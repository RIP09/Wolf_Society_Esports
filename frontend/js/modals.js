import { dom } from './dom.js';

export const Modal = {
  open({ title, content }) {
    const overlay = dom.create('div', { class: 'modal-overlay' });
    const modal = dom.create('div', { class: 'modal' });
    const header = dom.create('div', { class: 'modal-header' });
    const titleEl = dom.create('h2', { text: title || 'Modal' });
    const closeBtn = dom.create('button', { class: 'modal-close', text: '✕' });
    dom.on(closeBtn, 'click', () => this.close(overlay));
    dom.on(overlay, 'click', (e) => {
      if (e.target === overlay) this.close(overlay);
    });
    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    modal.appendChild(header);
    modal.appendChild(content);
    overlay.appendChild(modal);
    dom.append(document.body, overlay);
    return overlay;
  },

  close(overlay) {
    dom.remove(overlay);
  },

  confirm(message, onConfirm) {
    const content = dom.create('div');
    dom.append(content, dom.create('p', { text: message }));
    const btnGroup = dom.create('div', { class: 'flex gap-1 mt-2' });
    const confirmBtn = dom.create('button', { class: 'btn btn-danger', text: 'Confirm' });
    const cancelBtn = dom.create('button', { class: 'btn btn-outline', text: 'Cancel' });
    dom.on(confirmBtn, 'click', () => {
      this.close(overlay);
      onConfirm();
    });
    dom.on(cancelBtn, 'click', () => this.close(overlay));
    btnGroup.appendChild(confirmBtn);
    btnGroup.appendChild(cancelBtn);
    content.appendChild(btnGroup);
    const overlay = this.open({ title: 'Confirm', content });
    return overlay;
  }
};
