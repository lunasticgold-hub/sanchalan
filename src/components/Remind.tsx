// Reminder composer: nudge a coordinator/volunteer via WhatsApp or Email.
// WhatsApp opens a direct chat (wa.me) with the message pre-filled — one tap to send.
// Email goes through /api/notify (needs RESEND_API_KEY on the server).

import { useState } from 'react';

function waLink(phone: string, text: string) {
  const digits = (phone ?? '').replace(/\D/g, '');
  const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}

export default function Remind({
  toName,
  phone,
  defaultMessage,
  eventName,
}: {
  toName: string;
  phone?: string;
  defaultMessage: string;
  eventName: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');

  const sendEmail = async () => {
    if (!email.trim() || !message.trim()) return;
    setSending(true);
    setResult('');
    try {
      const r = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'email',
          to: email.trim(),
          subject: `Reminder: ${eventName}`,
          body: message.trim(),
        }),
      });
      const data = await r.json().catch(() => ({}));
      setResult(r.ok ? '✓ Email sent' : `⚠ ${data.error ?? 'Send failed'}`);
    } catch {
      setResult('⚠ Send failed — check your connection');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); setMessage(defaultMessage); setResult(''); }}
        className="rounded-md px-2.5 py-1 text-[12.5px] font-medium text-[#6B6B6B] ring-1 ring-inset ring-[#E8E8E6] transition-quiet hover:bg-[#F5F5F3] hover:text-[#191919]"
      >
        Remind
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative w-full max-w-md rounded-lg bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold text-[#191919]">Remind {toName}</div>
              <button onClick={() => setOpen(false)} className="rounded px-2 py-1 text-[13px] text-[#6B6B6B] hover:bg-[#EFEFEA]">✕</button>
            </div>
            <p className="mt-1 text-[12.5px] text-[#9B9B9B]">
              {phone ? `WhatsApp: +${phone.replace(/\D/g, '')}` : 'No phone number on file — WhatsApp will open a share sheet.'}
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-md border border-[#D9D9D6] px-3 py-2 text-[13.5px] focus:border-gray-900 focus:outline-none"
            />
            <div className="mt-3 flex gap-2">
              <a
                href={waLink(phone ?? '', message)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 rounded-md bg-[#1FA855] px-4 py-2 text-center text-[13.5px] font-medium text-white transition-quiet hover:bg-[#1a8f47]"
              >
                Send via WhatsApp
              </a>
            </div>
            <div className="mt-4 border-t border-[#F0EFEC] pt-3">
              <div className="text-[12.5px] font-medium text-[#6B6B6B]">Or send by email</div>
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coordinator@email.com"
                  className="flex-1 rounded-md border border-[#D9D9D6] px-3 py-2 text-[13.5px] focus:border-gray-900 focus:outline-none"
                />
                <button
                  onClick={sendEmail}
                  disabled={sending || !email.trim() || !message.trim()}
                  className="rounded-md bg-[#191919] px-4 py-2 text-[13.5px] font-medium text-white disabled:opacity-40"
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
              {result && <p className="mt-2 text-[12.5px] text-[#6B6B6B]">{result}</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
