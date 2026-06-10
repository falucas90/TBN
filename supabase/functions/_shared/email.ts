// Shared email helper for Crivo edge functions.
// Sends via the Resend HTTP API. If RESEND_API_KEY is not configured the
// composed email is logged instead, so functions stay safely deployable
// without keys.

export interface SendEmailResult {
  sent: boolean;
  reason?: string;
  id?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('ALERT_FROM_EMAIL') ?? 'alertas@crivo.pt';

  if (!apiKey) {
    console.log('[email] RESEND_API_KEY not configured — would send:', {
      from,
      to,
      subject,
      html,
    });
    return { sent: false, reason: 'RESEND_API_KEY not configured' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[email] Resend error ${res.status}: ${body}`);
    return { sent: false, reason: `Resend error ${res.status}` };
  }

  const data = await res.json();
  return { sent: true, id: data.id };
}

export function formatEur(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `€${value.toLocaleString('pt-PT')}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
