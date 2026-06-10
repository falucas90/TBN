import { supabase } from '../lib/supabase';

export async function loginWithCredentials(email, password) {
  if (!supabase) return;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function logoutUser() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signupUser(email, password, metadata) {
  if (!supabase) return;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) throw error;
  return data.user;
}

export async function sendPasswordResetEmail(email) {
  if (!supabase) return;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  if (!supabase) return;
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function resendVerificationEmail(email) {
  if (!supabase) return;
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

export async function updateUserProfile(profileData) {
  if (!supabase) return;
  const { error } = await supabase.auth.updateUser({ data: profileData });
  if (error) throw error;
}

export async function listUsers() {
  if (!supabase) return [];
  const { data, error } = await supabase.functions.invoke('update-user-role', {
    body: { action: 'list' },
  });
  if (error) throw error;
  return data.users ?? [];
}

export async function updateUserRole(userId, role) {
  if (!supabase) return;
  const { data, error } = await supabase.functions.invoke('update-user-role', {
    body: { action: 'update-role', userId, role },
  });
  if (error) throw error;
  return data.user;
}

export async function updateUserStatus(userId, status) {
  if (!supabase) return;
  const { data, error } = await supabase.functions.invoke('update-user-role', {
    body: { action: 'update-status', userId, status },
  });
  if (error) throw error;
  return data.user;
}

export async function deleteAccount() {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw error;
  await supabase.auth.signOut();
}

export async function exportUserData() {
  if (!supabase) {
    return { searches: [], alerts: [], profile: null };
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [{ data: searches }, { data: alerts }, { data: profile }] = await Promise.all([
    supabase.from('searches').select('*').eq('user_id', user.id),
    supabase.from('alerts').select('*').eq('user_id', user.id),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user: { id: user.id, email: user.email, createdAt: user.created_at },
    profile: profile ?? null,
    searches: searches ?? [],
    alerts: alerts ?? [],
  };
}

export async function getAuditLogs() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}
