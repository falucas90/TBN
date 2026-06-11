import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify the caller's JWT and check they are an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Client-facing Supabase instance (to verify caller's session)
    const supabasePublic = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: callerError } = await supabasePublic.auth.getUser();
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const callerRole = caller.app_metadata?.role;
    if (callerRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acesso negado — apenas administradores' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin Supabase instance with service_role key for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { action, userId, role, status, email, page: rawPage, perPage: rawPerPage } = await req.json();

    if (action === 'invite') {
      const cleanEmail = typeof email === 'string' ? email.trim() : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return new Response(JSON.stringify({ error: 'Email inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(cleanEmail, {
        data: { role: 'dealer' },
      });
      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (error.status === 422 || msg.includes('already been registered') || msg.includes('already registered') || msg.includes('email_exists')) {
          return new Response(JSON.stringify({ error: 'Este email já tem conta.' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        throw error;
      }
      await supabaseAdmin.from('audit_logs').insert({
        admin_id: caller.id,
        target_id: data.user?.id ?? null,
        action: 'invite',
        old_value: null,
        new_value: cleanEmail,
      });
      return new Response(JSON.stringify({ user: data.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      return new Response(JSON.stringify(body), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

      const [totalSearchesRes, activeSearchesRes, totalAlertsRes, alerts7dRes] = await Promise.all([
        supabaseAdmin.from('searches').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('searches').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabaseAdmin.from('alerts').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('alerts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      ]);
      const firstError =
        totalSearchesRes.error || activeSearchesRes.error || totalAlertsRes.error || alerts7dRes.error;
      if (firstError) throw firstError;

      return new Response(
        JSON.stringify({
          totalUsers,
          activeSearches: activeSearchesRes.count ?? 0,
          totalSearches: totalSearchesRes.count ?? 0,
          alerts7d: alerts7dRes.count ?? 0,
          totalAlerts: totalAlertsRes.count ?? 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update-role') {
      if (!userId || !role) {
        return new Response(JSON.stringify({ error: 'userId e role são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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
      return new Response(JSON.stringify({ user: data.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update-status') {
      if (!userId || status === undefined) {
        return new Response(JSON.stringify({ error: 'userId e status são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Self-lockout guard: an admin must not deactivate their own account.
      if (userId === caller.id && status !== 'active') {
        return new Response(
          JSON.stringify({ error: 'Não pode desativar a sua própria conta.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
      return new Response(JSON.stringify({ user: data.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação desconhecida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
