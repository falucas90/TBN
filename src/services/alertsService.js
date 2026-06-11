import { supabase, supabaseConfigured } from '../lib/supabase';
import { mapAlert } from '../lib/mappers';
import { mockAlerts } from '../data/mock-data';

export async function getAlerts({ limit = 50, offset = 0 } = {}) {
  if (!supabaseConfigured) return [...mockAlerts];
  // RLS scopes alerts to the caller's company (shared team queue)
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data.map(mapAlert);
}

export async function getAlertCountSince(isoDate) {
  if (!supabaseConfigured) {
    return mockAlerts.filter(a => !a.createdAt || a.createdAt >= isoDate).length;
  }
  // RLS scopes the count to the caller's company
  const { count, error } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', isoDate);
  if (error) throw error;
  return count ?? 0;
}

export async function updateAlertStatus(id, userStatus) {
  if (!supabaseConfigured) {
    const alert = mockAlerts.find(a => String(a.id) === String(id));
    if (alert) alert.userStatus = userStatus;
    return;
  }
  const { error } = await supabase
    .from('alerts')
    .update({ user_status: userStatus })
    .eq('id', id);
  if (error) throw error;
}

export async function getAlertsBySearch(searchId) {
  if (!supabaseConfigured) return mockAlerts.filter(a => String(a.searchId) === String(searchId));
  // RLS scopes alerts to the caller's company
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('search_id', searchId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapAlert);
}
