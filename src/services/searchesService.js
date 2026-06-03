import { mockSearches } from '../data/mock-data';

const searches = [...mockSearches];

export function getSearches() {
  return Promise.resolve([...searches]);
}

export function createSearch(data) {
  const newSearch = { ...data, id: Date.now() };
  searches.push(newSearch);
  return Promise.resolve(newSearch);
}

export function updateSearch(id, patch) {
  const index = searches.findIndex(s => s.id === id);
  if (index !== -1) {
    searches[index] = { ...searches[index], ...patch };
  }
  return Promise.resolve(searches[index] ?? null);
}

export function deleteSearch(id) {
  const index = searches.findIndex(s => s.id === id);
  if (index !== -1) {
    searches.splice(index, 1);
  }
  return Promise.resolve();
}
