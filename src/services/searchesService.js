import { supabase, supabaseConfigured } from '../lib/supabase';
import { mapSearch } from '../lib/mappers';
import { mockSearches } from '../data/mock-data';

// In-memory store for dev/mock mode
const mockStore = [...mockSearches];

export async function getSearches() {
  if (!supabaseConfigured) return [...mockStore];
  const { data, error } = await supabase
    .from('searches')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapSearch);
}

export async function getSearchById(id) {
  if (!supabaseConfigured) {
    return mockStore.find(s => String(s.id) === String(id)) ?? null;
  }
  const { data, error } = await supabase
    .from('searches')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return mapSearch(data);
}

export async function createSearch(payload) {
  if (!supabaseConfigured) {
    const row = { ...payload, id: Date.now() };
    mockStore.push(row);
    return row;
  }
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('searches')
    .insert({
      user_id: user.id,
      title: payload.title,
      status: payload.status,
      criteria: payload.criteria,
      sources: payload.sources,
      min_margin: payload.minMargin,
      alert_threshold: payload.alertThreshold,
      alert_channels: payload.alertChannels,
      daily_summary: payload.dailySummary,
      matches_today: payload.matchesToday ?? 0,
      avg_margin: payload.avgMargin ?? payload.minMargin,
    })
    .select()
    .single();
  if (error) throw error;
  return mapSearch(data);
}

export async function updateSearch(id, payload) {
  if (!supabaseConfigured) {
    const idx = mockStore.findIndex(s => String(s.id) === String(id));
    if (idx !== -1) mockStore[idx] = { ...mockStore[idx], ...payload };
    return mockStore[idx] ?? null;
  }
  const patch = {};
  if (payload.title !== undefined)          patch.title = payload.title;
  if (payload.status !== undefined)         patch.status = payload.status;
  if (payload.criteria !== undefined)       patch.criteria = payload.criteria;
  if (payload.sources !== undefined)        patch.sources = payload.sources;
  if (payload.minMargin !== undefined)      patch.min_margin = payload.minMargin;
  if (payload.alertThreshold !== undefined) patch.alert_threshold = payload.alertThreshold;
  if (payload.alertChannels !== undefined)  patch.alert_channels = payload.alertChannels;
  if (payload.dailySummary !== undefined)   patch.daily_summary = payload.dailySummary;
  if (payload.matchesToday !== undefined)   patch.matches_today = payload.matchesToday;
  if (payload.avgMargin !== undefined)      patch.avg_margin = payload.avgMargin;
  const { data, error } = await supabase
    .from('searches')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapSearch(data);
}

export async function deleteSearch(id) {
  if (!supabaseConfigured) {
    const idx = mockStore.findIndex(s => String(s.id) === String(id));
    if (idx !== -1) mockStore.splice(idx, 1);
    return;
  }
  const { error } = await supabase.from('searches').delete().eq('id', id);
  if (error) throw error;
}
