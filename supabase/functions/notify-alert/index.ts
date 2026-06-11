import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, formatEur, escapeHtml } from '../_shared/email.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Instant alert notifier.
// Designed to be called by a Supabase Database Webhook on INSERT into
// public.alerts. Auth is a shared secret header (x-webhook-secret), so deploy
// with --no-verify-jwt.

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Shared-secret guard — the Database Webhook must send this header
    const secret = Deno.env.get('WEBHOOK_SECRET');
    if (!secret || req.headers.get('x-webhook-secret') !== secret) {
      return jsonResponse({ error: 'Não autorizado' }, 401);
    }

    // Database Webhook payload: { type: 'INSERT', table, record, ... }
    const payload = await req.json();
    if (payload?.type !== 'INSERT' || !payload?.record) {
      return jsonResponse({ error: 'Payload inválido — esperado INSERT com record' }, 400);
    }
    const alert = payload.record;

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Load the related search and check the alert channels
    if (!alert.search_id) {
      return jsonResponse({ sent: false, reason: 'Alerta sem pesquisa associada' });
    }
    const { data: search, error: searchError } = await supabaseAdmin
      .from('searches')
      .select('id, title, status, alert_channels')
      .eq('id', alert.search_id)
      .maybeSingle();
    if (searchError) throw searchError;
    if (!search) {
      return jsonResponse({ sent: false, reason: 'Pesquisa não encontrada' });
    }
    if (search.status !== 'active') {
      return jsonResponse({ sent: false, reason: 'Pesquisa não está ativa' });
    }
    if (search.alert_channels?.email !== true) {
      return jsonResponse({ sent: false, reason: 'Canal de email desativado para esta pesquisa' });
    }

    // Resolve the user's email
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(alert.user_id);
    if (userError) throw userError;
    const email = userData?.user?.email;
    if (!email) {
      return jsonResponse({ sent: false, reason: 'Utilizador sem email' });
    }

    // Compose the Portuguese email
    const subject = `Novo alerta Crivo: ${alert.car_title}`;
    const html = `
      <h2>Novo alerta da pesquisa «${escapeHtml(search.title)}»</h2>
      <p><strong>${escapeHtml(alert.car_title)}</strong></p>
      <ul>
        <li>Plataforma: ${escapeHtml(alert.platform ?? '—')}</li>
        <li>Preço anunciado: ${formatEur(alert.price_original)}</li>
        <li>Transporte estimado: ${formatEur(alert.transport_est)}</li>
        <li>Preço de mercado: ${formatEur(alert.market_price)}</li>
      </ul>
      ${alert.listing_url ? `<p><a href="${escapeHtml(alert.listing_url)}">Ver anúncio</a></p>` : ''}
      <p style="color:#888;font-size:12px;">Recebeu este email porque ativou alertas por email nesta pesquisa Crivo.</p>
    `;

    const result = await sendEmail(email, subject, html);

    // TODO(whatsapp): send via WhatsApp when search.alert_channels.whatsapp is
    // true. Requires WhatsApp Business API credentials (Meta Cloud API or a
    // provider like Twilio) — not implemented yet.

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
});
