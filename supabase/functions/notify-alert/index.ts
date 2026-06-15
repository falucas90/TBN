import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, formatEur, escapeHtml } from '../_shared/email.ts';
import { getCompanyRecipients } from '../_shared/recipients.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { timingSafeEqualStr } from '../_shared/auth.ts';

// Instant alert notifier.
// Designed to be called by a Supabase Database Webhook on INSERT into
// public.alerts. Auth is a shared secret header (x-webhook-secret), so deploy
// with --no-verify-jwt.
//
// Alerts are company-scoped: every active member of the alert's company is
// emailed, not just the search creator (see _shared/recipients.ts).

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
    if (!secret || !timingSafeEqualStr(req.headers.get('x-webhook-secret') ?? '', secret)) {
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

    // Idempotency: a Database Webhook can re-invoke this function for the same
    // row. Re-fetch the alert from the DB (never trust the payload for the
    // notified marker) and short-circuit if it was already notified.
    if (!alert.id) {
      return jsonResponse({ error: 'Payload inválido — alerta sem id' }, 400);
    }
    const { data: alertRow, error: alertRowError } = await supabaseAdmin
      .from('alerts')
      .select('id, notified_at')
      .eq('id', alert.id)
      .maybeSingle();
    if (alertRowError) throw alertRowError;
    if (!alertRow) {
      return jsonResponse({ sent: false, reason: 'Alerta não encontrado' });
    }
    if (alertRow.notified_at) {
      return jsonResponse({ sent: false, reason: 'já notificado' });
    }

    // Load the related search and check the alert channels
    if (!alert.search_id) {
      return jsonResponse({ sent: false, reason: 'Alerta sem pesquisa associada' });
    }
    const { data: search, error: searchError } = await supabaseAdmin
      .from('searches')
      .select('id, title, status, alert_channels, company_id')
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

    // Resolve the recipients: all active members of the alert's company.
    // alerts_set_company fills company_id on insert; the search is the
    // fallback for rows that predate the trigger.
    const companyId = alert.company_id ?? search.company_id;
    if (!companyId) {
      return jsonResponse({ sent: false, reason: 'Alerta sem empresa associada' });
    }
    const recipients = await getCompanyRecipients(supabaseAdmin, companyId);
    if (recipients.length === 0) {
      return jsonResponse({
        sent: false,
        reason: 'Empresa sem membros ativos com email (ou suspensa)',
      });
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
      <p style="color:#888;font-size:12px;">Recebeu este email porque a sua empresa tem alertas por email ativos nesta pesquisa Crivo.</p>
    `;

    // One email per member; one failure never blocks the rest of the team.
    let delivered = 0;
    const results: Record<string, unknown>[] = [];
    for (const recipient of recipients) {
      try {
        const result = await sendEmail(recipient.email, subject, html);
        if (result.sent) delivered++;
        results.push({ userId: recipient.userId, ...result });
      } catch (err) {
        console.error(`[notify-alert] falha para o membro ${recipient.userId}:`, err);
        results.push({ userId: recipient.userId, sent: false, reason: err.message });
      }
    }

    // TODO(whatsapp): send via WhatsApp when search.alert_channels.whatsapp is
    // true, routing per member on profiles.notif_channel. Requires WhatsApp
    // Business API credentials (Meta Cloud API or a provider like Twilio) —
    // not implemented yet.

    // Mark as notified so a webhook retry won't re-email the team. Best-effort:
    // a failure here is logged but never turns a successful send into an error.
    if (delivered > 0) {
      const { error: markError } = await supabaseAdmin
        .from('alerts')
        .update({ notified_at: new Date().toISOString() })
        .eq('id', alert.id);
      if (markError) {
        console.error(
          `[notify-alert] falha ao marcar notified_at para o alerta ${alert.id}:`,
          markError
        );
      }
    }

    return jsonResponse({
      sent: delivered > 0,
      recipients: recipients.length,
      delivered,
      results,
    });
  } catch (err) {
    console.error('[notify-alert] erro não tratado:', err);
    return jsonResponse({ error: 'Erro interno' }, 500);
  }
});
