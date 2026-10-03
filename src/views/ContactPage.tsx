import { useState } from 'react';
import { SiteNav, SiteFooter } from './site';
import Logo from '../components/Logo';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', topic: 'General', message: '' });
  const input = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 transition-all";

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <Logo size={30} />
              <span className="text-[16px] font-bold tracking-tight">Sanchalan</span>
            </div>
            <h1 className="mt-8 text-[38px] font-bold leading-[1.1] tracking-tight">Let's talk about<br />your event.</h1>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-gray-500">
              Questions, feedback, partnerships, or want Sanchalan running your next conference —
              we read everything and reply within a day.
            </p>
            <div className="mt-10 space-y-5">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Email</div>
                <div className="mt-1 text-[15px] font-medium">team@sanchalan.app</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Built for</div>
                <div className="mt-1 text-[15px] font-medium">Kaun Banega Codepati 2026</div>
                <div className="text-[13px] text-gray-500">KBC-NOTION-03 · Team larpers</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Team</div>
                <div className="mt-1 text-[14px] text-gray-600">Abhigyan Rai · Aditya Kumar · Akshit Sinha</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-8">
              {sent ? (
                <div className="py-16 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className="mt-5 text-[20px] font-bold tracking-tight">Message sent</div>
                  <p className="mx-auto mt-2 max-w-sm text-[14px] text-gray-500">Thanks for reaching out — we'll get back to you within a day.</p>
                  <button onClick={() => setSent(false)} className="mt-6 text-[13.5px] font-medium text-gray-600 underline underline-offset-4 hover:text-gray-900">Send another</button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required className={input} />
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" type="email" required className={input} />
                  </div>
                  <select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className={input}>
                    <option>General question</option>
                    <option>Using Sanchalan for my event</option>
                    <option>Partnership</option>
                    <option>Press</option>
                    <option>Something's broken</option>
                  </select>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what's on your mind…" rows={6} required className={input} />
                  <button className="w-full rounded-xl bg-gray-900 py-3.5 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-gray-800 sm:w-auto sm:px-10">
                    Send message
                  </button>
                  <p className="text-[12px] text-gray-400">We reply within one business day. No spam, ever.</p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
