import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the caller's session
    const supabasePublic = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabasePublic.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Sessão inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Resolve the caller's company membership (bypasses RLS via service role).
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('company_id, company_role')
      .eq('id', user.id)
      .single();
    if (profileError) throw profileError;

    const companyId: string | null = profile?.company_id ?? null;

    if (companyId) {
      // Count the OTHER members of this company (excluding the caller).
      const { count: otherMembers, error: countError } = await supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .neq('id', user.id);
      if (countError) throw countError;

      const hasOtherMembers = (otherMembers ?? 0) > 0;

      // An owner cannot abandon a stand that still has other members:
      // that would orphan the company (and its shared deal flow) with
      // nobody able to manage it. Require ownership transfer first.
      if (profile.company_role === 'owner' && hasOtherMembers) {
        return new Response(
          JSON.stringify({
            error: 'Transfira a propriedade do stand para outro membro antes de eliminar a sua conta.',
          }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Deleting the user detaches (set null) — does NOT destroy — the
      // company's shared searches/alerts (see migration 011). The profile
      // row is cascade-deleted with the auth user.
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (deleteError) throw deleteError;

      // If the caller was the LAST member, the company is now empty:
      // remove it to avoid an orphan stand. profiles.company_id is
      // ON DELETE SET NULL, so deleting the user first (above) is safe.
      if (!hasOtherMembers) {
        const { error: companyDeleteError } = await supabaseAdmin
          .from('companies')
          .delete()
          .eq('id', companyId);
        if (companyDeleteError) throw companyDeleteError;
      }
    } else {
      // No company (e.g. platform admin): nothing shared to preserve.
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (deleteError) throw deleteError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('delete-account failed:', err);
    return new Response(
      JSON.stringify({ error: 'Não foi possível eliminar a conta. Tente novamente.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
