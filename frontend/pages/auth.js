import { dom } from '../dom.js';
import { Auth } from '../auth.js';

const auth = new Auth();

export function renderLogin() {
  const container = dom.create('div', { class: 'container' });
  const form = dom.create('form');
  const email = dom.create('input', { type: 'email', name: 'email', placeholder: 'Email', class: 'form-control' });
  const password = dom.create('input', { type: 'password', name: 'password', placeholder: 'Password', class: 'form-control' });
  const submit = dom.create('button', { type: 'submit', class: 'btn btn-primary', text: 'Login' });
  form.appendChild(email);
  form.appendChild(password);
  form.appendChild(submit);
  dom.on(form, 'submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    try {
      await auth.login(data.get('email'), data.get('password'));
      window.location.href = '/';
    } catch (err) {
      alert('Login failed');
    }
  });
  container.appendChild(form);
  return container;
}

export function renderRegister() {
  // Similar, but with name and password confirmation
  // ...
}
