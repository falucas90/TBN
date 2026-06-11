import { sendEmail, escapeHtml } from '../_shared/email.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Feedback notifier.
// Designed to be called by a Supabase Database Webhook on INSERT into
// public.feedback. Emails the admin inbox (FEEDBACK_EMAIL) so new feedback
// can be triaged in /admin/feedback. Auth is a shared secret header
// (x-webhook-secret), so deploy with --no-verify-jwt.

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Problema',
  sugestao: 'Sugestão',
  outro: 'Outro',
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
    const feedback = payload.record;

    const adminEmail = Deno.env.get('FEEDBACK_EMAIL');
    if (!adminEmail) {
      return jsonResponse({ sent: false, reason: 'FEEDBACK_EMAIL not configured' });
    }

    const category = CATEGORY_LABELS[feedback.category] ?? feedback.category;
    const subject = `Crivo · novo feedback (${category})`;
    const html = `
      <h2>Novo feedback de utilizador</h2>
      <p style="white-space:pre-wrap;border-left:3px solid #10b981;padding-left:12px;">${escapeHtml(feedback.message ?? '')}</p>
      <ul>
        <li>Categoria: ${escapeHtml(category)}</li>
        <li>Utilizador: ${escapeHtml(feedback.email ?? 'anónimo')}</li>
        <li>Página: ${escapeHtml(feedback.page ?? '—')}</li>
        <li>Recebido: ${escapeHtml(feedback.created_at ?? '—')}</li>
      </ul>
      <p>Triagem: aprove ou rejeite em <strong>Admin → Feedback</strong> na app.</p>
      <p style="color:#888;font-size:12px;">id: ${escapeHtml(feedback.id ?? '—')}</p>
    `;

    const result = await sendEmail(adminEmail, subject, html);
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
});
