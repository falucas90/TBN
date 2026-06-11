import { supabase } from '../lib/supabase';

export async function loginWithCredentials(email, password) {
  if (!supabase) return;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function loginWithGoogle() {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/searches' },
  });
  if (error) throw error;
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

export async function listUsers({ page = 1, perPage = 25 } = {}) {
  if (!supabase) {
    return { users: [], page: 1, perPage, total: 0, hasMore: false };
  }
  const { data, error } = await supabase.functions.invoke('update-user-role', {
    body: { action: 'list', page, perPage },
  });
  if (error) throw error;
  const users = data.users ?? [];
  return {
    users,
    page: data.page ?? page,
    perPage: data.perPage ?? perPage,
    total: typeof data.total === 'number' ? data.total : null,
    hasMore: data.hasMore ?? users.length === perPage,
  };
}

export async function getAdminStats() {
  if (!supabase) {
    return { totalUsers: 0, activeSearches: 0, totalSearches: 0, alerts7d: 0, totalAlerts: 0 };
  }
  const { data, error } = await supabase.functions.invoke('update-user-role', {
    body: { action: 'stats' },
  });
  if (error) throw error;
  return {
    totalUsers: data.totalUsers ?? 0,
    activeSearches: data.activeSearches ?? 0,
    totalSearches: data.totalSearches ?? 0,
    alerts7d: data.alerts7d ?? 0,
    totalAlerts: data.totalAlerts ?? 0,
  };
}

export async function inviteUser(email) {
  if (!supabase) return;
  const { data, error } = await supabase.functions.invoke('update-user-role', {
    body: { action: 'invite', email },
  });
  if (error) {
    // FunctionsHttpError hides the response body behind `context`; surface the
    // PT message returned by the edge function (e.g. the 409 "já tem conta").
    let message = error.message;
    try {
      const body = await error.context?.json?.();
      if (body?.error) message = body.error;
    } catch { /* keep generic message */ }
    throw new Error(message);
  }
  return data.user;
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
