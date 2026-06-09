import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { action, userId, role, status } = await req.json();

    if (action === 'list') {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      return new Response(JSON.stringify({ users: data.users }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      const { data: target } = await supabaseAdmin.auth.admin.getUserById(userId);
      const oldStatus = target?.user?.user_metadata?.status ?? 'active';
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { status },
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
