// POST /api/notify  { channel: 'email', to, subject, body } → { ok, id? } | { error }
// Sends approved communications. Currently supports email via Resend.
// Set RESEND_API_KEY in Vercel env vars to activate. WhatsApp Business API
// integration is planned (requires Meta approval).

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { channel, to, subject, body, replyTo } = req.body ?? {};
  if (channel !== 'email') return res.status(400).json({ error: 'Only email is supported currently' });
  if (!to || !subject || !body) return res.status(400).json({ error: 'to, subject and body are required' });
  // From address: set RESEND_FROM to a verified domain address (e.g. 'Sanchalan <updates@avrel.in>').
  // Default is Resend's test address, which works without domain verification
  // but only delivers to the Resend account owner's email.
  const from = process.env.RESEND_FROM || 'Sanchalan <onboarding@resend.dev>';

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return res.status(501).json({
      error: 'Email sending is not configured. Set RESEND_API_KEY to activate, or use the "Send via Email" button to send from your own mail client.',
    });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        text: `${body}\n\n\u2014 Sent automatically by Sanchalan via Resend`,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      const msg = data?.message ?? 'Email provider error';
      const hint = /not verified/i.test(msg)
        ? ' Set RESEND_FROM to onboarding@resend.dev (test mode) or verify your domain at resend.com/domains.'
        : '';
      return res.status(502).json({ error: msg + hint });
    }
    return res.status(200).json({ ok: true, id: data.id });
  } catch (e: any) {
    return res.status(502).json({ error: `Send failed: ${e?.message ?? 'unknown'}` });
  }
}
