import { supabase } from '../lib/supabase';

// Company-owner team management, backed by the update-user-role edge
// function (which verifies the caller is the owner of the company).

const MOCK_MEMBERS = [
  { id: 'mock', email: 'dev@local', fullName: 'Dev Local', companyRole: 'owner', status: 'active' },
  { id: 'mock-2', email: 'colega@stand.pt', fullName: 'Colega Demo', companyRole: 'member', status: 'active' },
];

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke('update-user-role', { body });
  if (error) {
    // FunctionsHttpError hides the response body behind `context`; surface
    // the PT message returned by the edge function.
    let message = error.message;
    try {
      const parsed = await error.context?.json?.();
      if (parsed?.error) message = parsed.error;
    } catch { /* keep generic message */ }
    throw new Error(message);
  }
  return data;
}

export async function listMembers() {
  if (!supabase) return [...MOCK_MEMBERS];
  const data = await invoke({ action: 'list-members' });
  return data.members ?? [];
}

export async function inviteMember(email) {
  if (!supabase) {
    MOCK_MEMBERS.push({ id: `mock-${MOCK_MEMBERS.length + 1}`, email, fullName: null, companyRole: 'member', status: 'active' });
    return;
  }
  const data = await invoke({ action: 'invite-member', email });
  return data.user;
}

export async function updateMemberRole(userId, companyRole) {
  if (!supabase) {
    const m = MOCK_MEMBERS.find(m => m.id === userId);
    if (m) m.companyRole = companyRole;
    return;
  }
  await invoke({ action: 'update-member-role', userId, companyRole });
}

export async function removeMember(userId) {
  if (!supabase) {
    const idx = MOCK_MEMBERS.findIndex(m => m.id === userId);
    if (idx !== -1) MOCK_MEMBERS.splice(idx, 1);
    return;
  }
  await invoke({ action: 'remove-member', userId });
}
