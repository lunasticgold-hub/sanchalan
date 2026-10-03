import { useState } from 'react';
import { PageShell } from './site';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  return (
    <PageShell title="Contact" subtitle="Questions, feedback, or want Sanchalan for your event? We read everything.">
      {sent ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <div className="text-[16px] font-semibold text-green-900">Message received</div>
          <p className="mt-1 text-[14px] text-green-700">We'll get back to you within a day. Thanks for reaching out.</p>
        </div>
      ) : (
        <form
          className="max-w-lg space-y-4"
          onSubmit={(e) => { e.preventDefault(); setSent(true); }}
        >
          <input
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name" required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none"
          />
          <input
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email" type="email" required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none"
          />
          <textarea
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="What's on your mind?" rows={5} required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none"
          />
          <button className="rounded-md bg-gray-900 px-6 py-2 text-[14px] font-medium text-white hover:bg-gray-800">
            Send message
          </button>
        </form>
      )}
      <div className="mt-8 text-[13px] text-gray-500">
        Prefer email? Write to us at <span className="font-medium text-gray-700">team@sanchalan.app</span>
      </div>
    </PageShell>
  );
}
