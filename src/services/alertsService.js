import { supabase, supabaseConfigured } from '../lib/supabase';
import { mapAlert } from '../lib/mappers';
import { mockAlerts } from '../data/mock-data';

export async function getAlerts({ limit = 50, offset = 0 } = {}) {
  if (!supabaseConfigured) return [...mockAlerts];
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data.map(mapAlert);
}

export async function getAlertsBySearch(searchId) {
  if (!supabaseConfigured) return mockAlerts.filter(a => a.searchId === searchId);
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('search_id', searchId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapAlert);
}
