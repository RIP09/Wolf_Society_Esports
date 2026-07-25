// DOM module – core utilities
export const dom = {
  // Query
  $: (sel, ctx = document) => ctx.querySelector(sel),
  $$: (sel, ctx = document) => [...ctx.querySelectorAll(sel)],
  id: (id) => document.getElementById(id),

  // Create
  create: (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v);
    });
    children.forEach(c => {
      if (typeof c === 'string') el.appendChild(document.createTextNode(c));
      else if (c instanceof HTMLElement) el.appendChild(c);
    });
    return el;
  },

  // Update
  text: (el, val) => { if (val !== undefined) el.textContent = val; return el.textContent; },
  html: (el, val) => { if (val !== undefined) el.innerHTML = val; return el.innerHTML; },
  attr: (el, key, val) => { if (val !== undefined) el.setAttribute(key, val); return el.getAttribute(key); },
  addClass: (el, cls) => el.classList.add(cls),
  removeClass: (el, cls) => el.classList.remove(cls),
  toggleClass: (el, cls) => el.classList.toggle(cls),
  hasClass: (el, cls) => el.classList.contains(cls),

  // Delete/Remove
  remove: (el) => el.remove(),
  empty: (el) => { while (el.firstChild) el.removeChild(el.firstChild); },
  detach: (el) => el.parentNode?.removeChild(el),

  // Insert
  append: (parent, child) => parent.appendChild(child),
  prepend: (parent, child) => parent.prepend(child),
  before: (ref, el) => ref.parentNode.insertBefore(el, ref),
  after: (ref, el) => ref.parentNode.insertBefore(el, ref.nextSibling),
  replace: (old, el) => old.parentNode.replaceChild(el, old),

  // Traversal
  parent: (el) => el.parentNode,
  children: (el) => [...el.children],
  siblings: (el) => [...el.parentNode.children].filter(c => c !== el),
  closest: (el, sel) => el.closest(sel),

  // Events (forward to dom-events)
  on: (el, event, handler) => el.addEventListener(event, handler),
  off: (el, event, handler) => el.removeEventListener(event, handler),
  once: (el, event, handler) => el.addEventListener(event, handler, { once: true }),
  emit: (el, event, detail) => el.dispatchEvent(new CustomEvent(event, { detail })),

  // Utilities
  ready: (cb) => document.addEventListener('DOMContentLoaded', cb),
  isVisible: (el) => !!el.offsetParent,
  offset: (el) => el.getBoundingClientRect(),
};
