import { mockAlerts } from '../data/mock-data';

export function getAlerts() {
  return Promise.resolve([...mockAlerts]);
}
