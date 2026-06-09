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
