import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, formatEur, escapeHtml } from '../_shared/email.ts';
import { getCompanyRecipients } from '../_shared/recipients.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { timingSafeEqualStr } from '../_shared/auth.ts';

// Daily digest of alerts.
// Designed to be invoked on a schedule (pg_cron + pg_net, or an external cron
// hitting the function URL). Auth is a shared secret header (x-webhook-secret),
// so deploy with --no-verify-jwt.
//
// Alerts are company-scoped: one digest is composed per company with the
// daily summary enabled and sent to every active member of that company
// (see _shared/recipients.ts).

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
    if (!secret || !timingSafeEqualStr(req.headers.get('x-webhook-secret') ?? '', secret)) {
      return jsonResponse({ error: 'Não autorizado' }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Active searches with the daily summary enabled. We need both the
    // company and the search id: a digest only includes alerts from searches
    // that actually opted in (status='active' AND daily_summary=true), so we
    // map each company to its set of enabled search ids and filter on it.
    const { data: searches, error: searchError } = await supabaseAdmin
      .from('searches')
      .select('id, company_id')
      .eq('status', 'active')
      .eq('daily_summary', true);
    if (searchError) throw searchError;

    // company_id -> set of enabled search ids
    const enabledSearchesByCompany = new Map<string, string[]>();
    for (const s of searches ?? []) {
      if (!s.company_id || !s.id) continue;
      const list = enabledSearchesByCompany.get(s.company_id);
      if (list) list.push(s.id);
      else enabledSearchesByCompany.set(s.company_id, [s.id]);
    }

    const companyIds = [...enabledSearchesByCompany.keys()];

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let processed = 0;
    let sent = 0;
    let skipped = 0;
    const results: Record<string, unknown>[] = [];

    for (const companyId of companyIds) {
      processed++;
      try {
        // Only alerts from this company's opted-in searches. Excludes alerts
        // whose search_id is null or points to a paused / non-enabled search.
        const enabledSearchIds = enabledSearchesByCompany.get(companyId) ?? [];
        if (enabledSearchIds.length === 0) {
          skipped++;
          continue;
        }

        const { data: alerts, error: alertsError } = await supabaseAdmin
          .from('alerts')
          .select('car_title, platform, price_original, listing_url, created_at')
          .eq('company_id', companyId)
          .in('search_id', enabledSearchIds)
          .gte('created_at', since)
          .order('created_at', { ascending: false });
        if (alertsError) throw alertsError;

        if (!alerts || alerts.length === 0) {
          skipped++;
          continue;
        }

        const recipients = await getCompanyRecipients(supabaseAdmin, companyId);
        if (recipients.length === 0) {
          skipped++;
          results.push({
            companyId,
            sent: false,
            reason: 'Empresa sem membros ativos com email (ou suspensa)',
          });
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
          <p>Nas últimas 24 horas registámos <strong>${alerts.length}</strong> novos alertas para as pesquisas da sua empresa:</p>
          <ul>
            ${items}
          </ul>
          <p style="color:#888;font-size:12px;">Recebeu este email porque a sua empresa ativou o resumo diário numa pesquisa Crivo.</p>
        `;

        // One digest per member; one failure never blocks the rest of the team.
        let delivered = 0;
        const memberResults: Record<string, unknown>[] = [];
        for (const recipient of recipients) {
          try {
            const result = await sendEmail(recipient.email, subject, html);
            if (result.sent) delivered++;
            memberResults.push({ userId: recipient.userId, ...result });
          } catch (err) {
            console.error(
              `[daily-summary] falha para o membro ${recipient.userId}:`,
              err
            );
            memberResults.push({
              userId: recipient.userId,
              sent: false,
              reason: err.message,
            });
          }
        }
        sent += delivered;
        if (delivered === 0) skipped++;
        results.push({
          companyId,
          alerts: alerts.length,
          recipients: recipients.length,
          delivered,
          results: memberResults,
        });
      } catch (err) {
        // Never let one company's failure crash the batch
        console.error(`[daily-summary] falha para a empresa ${companyId}:`, err);
        skipped++;
        results.push({ companyId, sent: false, reason: err.message });
      }
    }

    return jsonResponse({ processed, sent, skipped, results });
  } catch (err) {
    console.error('[daily-summary] erro não tratado:', err);
    return jsonResponse({ error: 'Erro interno' }, 500);
  }
});
