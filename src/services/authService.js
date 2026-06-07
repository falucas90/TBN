import { supabase } from '../lib/supabase';

export async function loginWithCredentials(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/searches' },
  });
  if (error) throw error;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signupUser(email, password, metadata) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) throw error;
  return data.user;
}

export async function sendPasswordResetEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function resendVerificationEmail(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

export async function updateUserProfile(profileData) {
  const { error } = await supabase.auth.updateUser({ data: profileData });
  if (error) throw error;
}

// Stub — replaced with Edge Function call in Phase 3
export function getUsers() {
  return Promise.resolve([]);
}
