// Shared recipient resolution for Crivo notification functions.
//
// Alerts are company-scoped (migration 008): the whole team works one alert
// queue, so notifications go to every active member of the company, not just
// the search creator. profiles.notif_channel is a channel preference
// ('WhatsApp' | 'Email' | 'SMS'), not an opt-out — and email is the only
// implemented channel, so all members receive email until WhatsApp/SMS
// delivery exists. When those land, route per member on notif_channel here.

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface Recipient {
  userId: string;
  email: string;
}

// All active members of a company, resolved to their auth email.
// Returns [] when the company is missing or suspended (suspension silences
// notifications, mirroring current_company_id() cutting off app access).
// Members whose email cannot be resolved are skipped, never fatal.
export async function getCompanyRecipients(
  supabaseAdmin: SupabaseClient,
  companyId: string
): Promise<Recipient[]> {
  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .select('id, status')
    .eq('id', companyId)
    .maybeSingle();
  if (companyError) throw companyError;
  if (!company || company.status !== 'active') return [];

  const { data: members, error: membersError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('company_id', companyId);
  if (membersError) throw membersError;

  const recipients: Recipient[] = [];
  for (const member of members ?? []) {
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(member.id);
    if (userError) {
      console.error(
        `[recipients] falha ao resolver o email do membro ${member.id}:`,
        userError
      );
      continue;
    }
    const email = userData?.user?.email;
    if (email) recipients.push({ userId: member.id, email });
  }
  return recipients;
}
