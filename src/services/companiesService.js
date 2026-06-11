import { supabase, supabaseConfigured } from '../lib/supabase';
import { mapCompany } from '../lib/mappers';

const MOCK_COMPANY = {
  id: 'mock-company',
  name: 'Stand Demo',
  nif: '500100200',
  status: 'active',
  defaultTransportCost: 800,
  minMargin: 2000,
};

// RLS scopes companies to the caller's own company, so no id filter
// is needed on read.
export async function getCompany() {
  if (!supabaseConfigured) return { ...MOCK_COMPANY };
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ? mapCompany(data) : null;
}

// Owner-only (enforced by RLS); members get a no-op error from Postgres.
export async function updateCompany(id, patch) {
  if (!supabaseConfigured) {
    Object.assign(MOCK_COMPANY, patch);
    return { ...MOCK_COMPANY };
  }
  const dbPatch = {};
  if (patch.name !== undefined)                 dbPatch.name = patch.name;
  if (patch.nif !== undefined)                  dbPatch.nif = patch.nif;
  if (patch.defaultTransportCost !== undefined) dbPatch.default_transport_cost = patch.defaultTransportCost;
  if (patch.minMargin !== undefined)            dbPatch.min_margin = patch.minMargin;
  const { data, error } = await supabase
    .from('companies')
    .update(dbPatch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapCompany(data);
}
