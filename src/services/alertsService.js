import { supabase, supabaseConfigured } from '../lib/supabase';
import { mapAlert } from '../lib/mappers';
import { mockAlerts } from '../data/mock-data';

export async function getAlerts({ limit = 50, offset = 0 } = {}) {
  if (!supabaseConfigured) return [...mockAlerts];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('alerts')
    .select('*, searches!inner(user_id)')
    .eq('searches.user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data.map(mapAlert);
}

export async function getAlertCountSince(isoDate) {
  if (!supabaseConfigured) {
    return mockAlerts.filter(a => !a.createdAt || a.createdAt >= isoDate).length;
  }
  // alerts has its own user_id column with owner-select RLS, so no join is needed
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
  if (!supabaseConfigured) return mockAlerts.filter(a => a.searchId === searchId);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // Verify ownership via join — only returns results if the search belongs to this user
  const { data, error } = await supabase
    .from('alerts')
    .select('*, searches!inner(user_id)')
    .eq('search_id', searchId)
    .eq('searches.user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapAlert);
}
