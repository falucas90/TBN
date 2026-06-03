import { mockUsers } from '../data/mock-data';

export function loginWithCredentials(email, password) {
  const user = mockUsers.find(u => u.email === email && u.password === password);
  return Promise.resolve(user ?? null);
}

export function getUsers() {
  return Promise.resolve([...mockUsers]);
}
