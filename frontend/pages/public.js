import { dom } from '../dom.js';

export function renderPublicHome() {
  return dom.create('div', { class: 'container' }, [
    dom.create('h1', { text: 'Welcome to Wolf Society' }),
    dom.create('p', { text: 'The ultimate esports organization.' }),
  ]);
}
export function renderAbout() { return dom.create('div', { class: 'container' }, [dom.create('h1', { text: 'About Us' })]); }
export function renderTeams() { return dom.create('div', { class: 'container' }, [dom.create('h1', { text: 'Teams' })]); }
export function renderContact() { return dom.create('div', { class: 'container' }, [dom.create('h1', { text: 'Contact' })]); }
