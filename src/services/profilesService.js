import { supabase, supabaseConfigured } from '../lib/supabase';
import { mapProfile } from '../lib/mappers';

export async function getProfile() {
  if (!supabaseConfigured) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  if (error) throw error;
  return mapProfile(data);
}

export async function updateProfile(patch) {
  if (!supabaseConfigured) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Business defaults (transport cost, margin) live on the company —
  // see companiesService. Only personal fields are updatable here.
  const dbPatch = {};
  if (patch.fullName !== undefined)     dbPatch.full_name = patch.fullName;
  if (patch.phone !== undefined)        dbPatch.phone = patch.phone;
  if (patch.notifChannel !== undefined) dbPatch.notif_channel = patch.notifChannel;

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...dbPatch });
  if (error) throw error;

  // Keep auth metadata in sync for display name
  if (patch.fullName !== undefined) {
    await supabase.auth.updateUser({ data: { full_name: patch.fullName } });
  }
}
