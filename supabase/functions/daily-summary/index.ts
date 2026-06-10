import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, formatEur, escapeHtml } from '../_shared/email.ts';

// Daily digest of alerts.
// Designed to be invoked on a schedule (pg_cron + pg_net, or an external cron
// hitting the function URL). Auth is a shared secret header (x-webhook-secret),
// so deploy with --no-verify-jwt.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

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
    // Shared-secret guard — the cron caller must send this header
    const secret = Deno.env.get('WEBHOOK_SECRET');
    if (!secret || req.headers.get('x-webhook-secret') !== secret) {
      return jsonResponse({ error: 'Não autorizado' }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Users who own at least one active search with the daily summary enabled
    const { data: searches, error: searchError } = await supabaseAdmin
      .from('searches')
      .select('user_id')
      .eq('status', 'active')
      .eq('daily_summary', true);
    if (searchError) throw searchError;

    const userIds = [...new Set((searches ?? []).map((s) => s.user_id))];

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let processed = 0;
    let sent = 0;
    let skipped = 0;
    const results: Record<string, unknown>[] = [];

    for (const userId of userIds) {
      processed++;
      try {
        const { data: alerts, error: alertsError } = await supabaseAdmin
          .from('alerts')
          .select('car_title, platform, price_original, listing_url, created_at')
          .eq('user_id', userId)
          .gte('created_at', since)
          .order('created_at', { ascending: false });
        if (alertsError) throw alertsError;

        if (!alerts || alerts.length === 0) {
          skipped++;
          continue;
        }

        const { data: userData, error: userError } =
          await supabaseAdmin.auth.admin.getUserById(userId);
        if (userError) throw userError;
        const email = userData?.user?.email;
        if (!email) {
          skipped++;
          continue;
        }

        const subject = `Resumo diário Crivo — ${alerts.length} novos alertas`;
        const items = alerts
          .map((a) => {
            const link = a.listing_url
              ? ` — <a href="${escapeHtml(a.listing_url)}">Ver anúncio</a>`
              : '';
            return `<li><strong>${escapeHtml(a.car_title)}</strong> (${escapeHtml(a.platform ?? '—')}) — ${formatEur(a.price_original)}${link}</li>`;
          })
          .join('\n');
        const html = `
          <h2>Resumo diário Crivo</h2>
          <p>Nas últimas 24 horas registámos <strong>${alerts.length}</strong> novos alertas para as suas pesquisas:</p>
          <ul>
            ${items}
          </ul>
          <p style="color:#888;font-size:12px;">Recebeu este email porque ativou o resumo diário numa pesquisa Crivo.</p>
        `;

        const result = await sendEmail(email, subject, html);
        if (result.sent) {
          sent++;
        } else {
          skipped++;
        }
        results.push({ userId, alerts: alerts.length, ...result });
      } catch (err) {
        // Never let one user's failure crash the batch
        console.error(`[daily-summary] falha para o utilizador ${userId}:`, err);
        skipped++;
        results.push({ userId, sent: false, reason: err.message });
      }
    }

    return jsonResponse({ processed, sent, skipped, results });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
});
