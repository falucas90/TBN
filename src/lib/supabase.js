import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Fail loud in real production builds: shipping without Supabase credentials
// would silently fall back to the auth-bypassed mock mode, leaving the app
// open. This guard only trips when import.meta.env.PROD is true (a production
// `vite build`); dev and Vitest (MODE 'test', PROD false) keep mock mode.
if (import.meta.env.PROD && !supabaseConfigured) {
  const missing = [
    !supabaseUrl && 'VITE_SUPABASE_URL',
    !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY',
  ].filter(Boolean).join(', ');
  throw new Error(
    `Supabase não está configurado: variáveis de ambiente em falta (${missing}). ` +
    'Defina-as antes de fazer deploy em produção — o modo mock (sem autenticação) ' +
    'está desativado em produção por segurança.'
  );
}

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
