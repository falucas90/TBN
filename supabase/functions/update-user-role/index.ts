import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// User & team management.
//
// Two privilege levels:
//   Platform admin (app_metadata.role = 'admin') — manages all accounts:
//     invite, list, stats, update-role, update-status
//   Company owner (profiles.company_role = 'owner') — manages own team:
//     invite-member, list-members, update-member-role, remove-member

const PLATFORM_ACTIONS = ['invite', 'list', 'stats', 'update-role', 'update-status'];
const OWNER_ACTIONS = ['invite-member', 'list-members', 'update-member-role', 'remove-member'];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isDuplicateInvite = (error: { status?: number; message?: string }) => {
  const msg = (error.message || '').toLowerCase();
  return error.status === 422 || msg.includes('already been registered') ||
    msg.includes('already registered') || msg.includes('email_exists');
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the caller's JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Não autorizado' }, 401);
    }

    // Client-facing Supabase instance (to verify caller's session)
    const supabasePublic = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: callerError } = await supabasePublic.auth.getUser();
    if (callerError || !caller) {
      return json({ error: 'Sessão inválida' }, 401);
    }

    // Admin Supabase instance with service_role key for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const {
      action, userId, role, status, email, companyName, companyRole,
      page: rawPage, perPage: rawPerPage,
    } = await req.json();

    const callerRole = caller.app_metadata?.role;

    // ——— Authorization ———————————————————————————————————————
    if (PLATFORM_ACTIONS.includes(action) && callerRole !== 'admin') {
      return json({ error: 'Acesso negado — apenas administradores' }, 403);
    }

    let callerCompanyId: string | null = null;
    if (OWNER_ACTIONS.includes(action)) {
      const { data: callerProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('company_id, company_role')
        .eq('id', caller.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!callerProfile?.company_id || callerProfile.company_role !== 'owner') {
        return json({ error: 'Acesso negado — apenas o responsável do stand' }, 403);
      }
      callerCompanyId = callerProfile.company_id;
    }

    // ——— Platform admin actions ——————————————————————————————
    if (action === 'invite') {
      const cleanEmail = typeof email === 'string' ? email.trim() : '';
      if (!EMAIL_RE.test(cleanEmail)) {
        return json({ error: 'Email inválido' }, 400);
      }
      const cleanCompanyName = typeof companyName === 'string' ? companyName.trim() : '';
      // The invite creates the auth user; the AFTER-INSERT trigger
      // creates only a bare profile (no company). Tenancy is assigned
      // below via the service role — never trusted through metadata.
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(cleanEmail, {
        data: { role: 'dealer' },
      });
      if (error) {
        if (isDuplicateInvite(error)) {
          return json({ error: 'Este email já tem conta.' }, 409);
        }
        throw error;
      }

      // Create the new stand and make the invitee its owner. Done with
      // the service role (bypasses RLS and the profiles column grants),
      // so client metadata is never trusted for tenant binding.
      const newUserId = data.user?.id;
      if (!newUserId) throw new Error('Invite did not return a user');
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({ name: cleanCompanyName || cleanEmail.split('@')[0] })
        .select('id')
        .single();
      if (companyError) throw companyError;
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          { id: newUserId, company_id: company.id, company_role: 'owner' },
          { onConflict: 'id' },
        );
      if (profileError) throw profileError;

      await supabaseAdmin.from('audit_logs').insert({
        admin_id: caller.id,
        target_id: newUserId,
        action: 'invite',
        old_value: null,
        new_value: cleanEmail,
      });
      return json({ user: data.user });
    }

    if (action === 'list') {
      const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
      const perPage = Number.isInteger(rawPerPage) && rawPerPage >= 1 && rawPerPage <= 100 ? rawPerPage : 25;
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data.users ?? [];
      // supabase-js v2 exposes `total` on the listUsers response; fall back to
      // a hasMore flag if it is unavailable.
      const total = typeof data.total === 'number' ? data.total : null;
      const body: Record<string, unknown> = { users, page, perPage };
      if (total !== null) {
        body.total = total;
        body.hasMore = page * perPage < total;
      } else {
        body.hasMore = users.length === perPage;
      }
      return json(body);
    }

    if (action === 'stats') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      let totalUsers = 0;
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      if (!usersError && typeof usersData?.total === 'number') {
        totalUsers = usersData.total;
      } else {
        const { count, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        if (profilesError) throw profilesError;
        totalUsers = count ?? 0;
      }

      const [totalSearchesRes, activeSearchesRes, totalAlertsRes, alerts7dRes, companiesRes] = await Promise.all([
        supabaseAdmin.from('searches').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('searches').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabaseAdmin.from('alerts').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('alerts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
        supabaseAdmin.from('companies').select('*', { count: 'exact', head: true }),
      ]);
      const firstError =
        totalSearchesRes.error || activeSearchesRes.error || totalAlertsRes.error ||
        alerts7dRes.error || companiesRes.error;
      if (firstError) throw firstError;

      return json({
        totalUsers,
        totalCompanies: companiesRes.count ?? 0,
        activeSearches: activeSearchesRes.count ?? 0,
        totalSearches: totalSearchesRes.count ?? 0,
        alerts7d: alerts7dRes.count ?? 0,
        totalAlerts: totalAlertsRes.count ?? 0,
      });
    }

    if (action === 'update-role') {
      if (!userId || !role) {
        return json({ error: 'userId e role são obrigatórios' }, 400);
      }
      const { data: target } = await supabaseAdmin.auth.admin.getUserById(userId);
      const oldRole = target?.user?.app_metadata?.role ?? 'dealer';
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { role },
      });
      if (error) throw error;
      await supabaseAdmin.from('audit_logs').insert({
        admin_id: caller.id,
        target_id: userId,
        action: 'role_change',
        old_value: oldRole,
        new_value: role,
      });
      return json({ user: data.user });
    }

    if (action === 'update-status') {
      if (!userId || status === undefined) {
        return json({ error: 'userId e status são obrigatórios' }, 400);
      }
      // Self-lockout guard: an admin must not deactivate their own account.
      if (userId === caller.id && status !== 'active') {
        return json({ error: 'Não pode desativar a sua própria conta.' }, 400);
      }
      const { data: target } = await supabaseAdmin.auth.admin.getUserById(userId);
      const oldStatus = target?.user?.app_metadata?.status ?? 'active';
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { status },
      });
      if (error) throw error;
      await supabaseAdmin.from('audit_logs').insert({
        admin_id: caller.id,
        target_id: userId,
        action: 'status_change',
        old_value: oldStatus,
        new_value: status,
      });
      return json({ user: data.user });
    }

    // ——— Company owner actions ———————————————————————————————

    if (action === 'invite-member') {
      const cleanEmail = typeof email === 'string' ? email.trim() : '';
      if (!EMAIL_RE.test(cleanEmail)) {
        return json({ error: 'Email inválido' }, 400);
      }
      // The invite creates the auth user (bare profile via the
      // trigger); we link them to the owner's company below with the
      // service role — tenancy is never passed through metadata.
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(cleanEmail, {
        data: { role: 'dealer' },
      });
      if (error) {
        if (isDuplicateInvite(error)) {
          return json({ error: 'Este email já tem conta.' }, 409);
        }
        throw error;
      }

      const newMemberId = data.user?.id;
      if (!newMemberId) throw new Error('Invite did not return a user');
      const { error: memberError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          { id: newMemberId, company_id: callerCompanyId, company_role: 'member' },
          { onConflict: 'id' },
        );
      if (memberError) throw memberError;

      await supabaseAdmin.from('audit_logs').insert({
        admin_id: caller.id,
        target_id: newMemberId,
        action: 'member_invite',
        old_value: null,
        new_value: cleanEmail,
      });
      return json({ user: data.user });
    }

    if (action === 'list-members') {
      const { data: members, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, company_role')
        .eq('company_id', callerCompanyId)
        .order('company_role', { ascending: false });
      if (error) throw error;
      const enriched = await Promise.all((members ?? []).map(async (m) => {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(m.id);
        return {
          id: m.id,
          fullName: m.full_name,
          companyRole: m.company_role,
          email: u?.user?.email ?? null,
          status: u?.user?.app_metadata?.status ?? 'active',
          invitedAt: u?.user?.created_at ?? null,
          lastSignInAt: u?.user?.last_sign_in_at ?? null,
        };
      }));
      return json({ members: enriched });
    }

    if (action === 'update-member-role' || action === 'remove-member') {
      if (!userId) {
        return json({ error: 'userId é obrigatório' }, 400);
      }
      if (userId === caller.id) {
        return json({ error: 'Não pode alterar a sua própria conta.' }, 400);
      }
      const { data: targetProfile, error: targetError } = await supabaseAdmin
        .from('profiles')
        .select('company_id, company_role')
        .eq('id', userId)
        .maybeSingle();
      if (targetError) throw targetError;
      if (!targetProfile || targetProfile.company_id !== callerCompanyId) {
        return json({ error: 'Utilizador não pertence ao seu stand.' }, 404);
      }

      if (action === 'update-member-role') {
        if (!['owner', 'member'].includes(companyRole)) {
          return json({ error: 'companyRole inválido' }, 400);
        }
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ company_role: companyRole })
          .eq('id', userId);
        if (error) throw error;
        await supabaseAdmin.from('audit_logs').insert({
          admin_id: caller.id,
          target_id: userId,
          action: 'member_role_change',
          old_value: targetProfile.company_role,
          new_value: companyRole,
        });
        return json({ ok: true });
      }

      // remove-member: detach from the company and deactivate the
      // account — an orphaned login has no business data to see.
      const { error: detachError } = await supabaseAdmin
        .from('profiles')
        .update({ company_id: null, company_role: 'member' })
        .eq('id', userId);
      if (detachError) throw detachError;
      const { error: statusError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { status: 'inactive' },
      });
      if (statusError) throw statusError;
      await supabaseAdmin.from('audit_logs').insert({
        admin_id: caller.id,
        target_id: userId,
        action: 'member_remove',
        old_value: targetProfile.company_role,
        new_value: null,
      });
      return json({ ok: true });
    }

    return json({ error: 'Ação desconhecida' }, 400);
  } catch (err) {
    // Don't leak internal error details to the client.
    console.error(err);
    return json({ error: 'Erro interno do servidor' }, 500);
  }
});
