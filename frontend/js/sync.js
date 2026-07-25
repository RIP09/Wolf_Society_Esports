import { api } from './api.js';

export class Sync {
  constructor() {
    this.subscriptions = {};
  }

  subscribe(collection, callback, interval = 3000) {
    if (this.subscriptions[collection]) {
      clearInterval(this.subscriptions[collection]);
    }
    const id = setInterval(async () => {
      try {
        const data = await api.get(collection, { sort: '-created', perPage: 100 });
        callback(data);
      } catch (e) {
        // silent fail
      }
    }, interval);
    this.subscriptions[collection] = id;
    return id;
  }

  unsubscribe(collection) {
    if (this.subscriptions[collection]) {
      clearInterval(this.subscriptions[collection]);
      delete this.subscriptions[collection];
    }
  }
}
