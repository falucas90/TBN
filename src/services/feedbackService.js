import { supabase, supabaseConfigured } from '../lib/supabase';

export async function submitFeedback({ category, message }) {
  if (!supabaseConfigured) {
    // Mock mode: no-op so the UI works without Supabase.
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('feedback').insert({
    user_id: user?.id ?? null,
    email: user?.email ?? null,
    category,
    message,
    page: window.location.pathname,
    user_agent: navigator.userAgent,
  });

  if (error) throw error;
}
