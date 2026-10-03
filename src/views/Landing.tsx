// Sanchalan landing — Notion/Linear-inspired restraint.
// Whitespace, typography, real product. No AI-startup theatre.

import Logo from '../components/Logo';
import { NavLink } from '../lib/nav';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { useEffect, useState } from 'react';

function useLoggedIn() {
  const [loggedIn, setLoggedIn] = useState(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) ?? '';
        if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.access_token && (!parsed.expires_at || parsed.expires_at * 1000 > Date.now())) return true;
          }
        }
      }
    } catch {}
    return false;
  });
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => setLoggedIn(Boolean(data.session?.user)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(Boolean(s?.user)));
    return () => sub.subscription.unsubscribe();
  }, []);
  return loggedIn;
}

const WORKFLOW = [
  { n: '01', t: 'Connect Notion', d: 'Link your workspace. Sanchalan reads your venues, sessions, volunteers, tasks — everything — through the official API. Your data never leaves Notion.' },
  { n: '02', t: 'Describe the change', d: 'Type it in plain English. “Move the keynote to the Auditorium.” Sanchalan traces every affected record and surfaces the risks.' },
  { n: '03', t: 'Review and approve', d: 'See the full impact before anything moves. Approve what\'s safe, discard what isn\'t. Every write is recorded and reversible.' },
];

const AREAS = [
  { t: 'Schedule', d: 'Sessions, times, venues, and conflicts — in one timeline.' },
  { t: 'People', d: 'Attendees, speakers, volunteers, and sponsors with check-in status.' },
  { t: 'Tasks', d: 'Everything that needs doing, who owns it, and what\'s overdue.' },
  { t: 'Issues', d: 'Operational problems tracked as records, not chat messages.' },
  { t: 'Decisions', d: 'Every change request, its impact, and who approved it.' },
  { t: 'Communication', d: 'Announcements drafted and ready for WhatsApp or email.' },
];

export default function Landing() {
  const loggedIn = useLoggedIn();
  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#191919] antialiased">
      {/* Nav */}
      <nav className="border-b border-[#E8E8E6]">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-3.5">
          <NavLink to="/" className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-[15px] font-semibold tracking-tight">Sanchalan</span>
          </NavLink>
          <div className="hidden items-center gap-7 md:flex">
            {[['Features', '/features'], ['Pricing', '/pricing'], ['About', '/about'], ['FAQ', '/faq']].map(([l, h]) => (
              <NavLink key={h} to={h} className="text-[13.5px] text-[#6B6B6B] transition-quiet hover:text-[#191919]">{l}</NavLink>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {loggedIn ? (
              <NavLink to="/app" className="rounded-[6px] bg-[#191919] px-3.5 py-1.5 text-[13.5px] font-medium text-white transition-quiet hover:bg-[#2e2e2e]">Open app →</NavLink>
            ) : (
              <>
                <NavLink to="/app" className="rounded-[6px] px-3.5 py-1.5 text-[13.5px] text-[#6B6B6B] transition-quiet hover:text-[#191919]">Sign in</NavLink>
                <NavLink to="/app" className="rounded-[6px] bg-[#191919] px-3.5 py-1.5 text-[13.5px] font-medium text-white transition-quiet hover:bg-[#2e2e2e]">Get started</NavLink>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-[1100px] px-6 pb-16 pt-20 md:pt-28">
        <div className="max-w-[640px]">
          <h1 className="text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[52px]">
            Run your entire event from one workspace.
          </h1>
          <p className="mt-5 max-w-[520px] text-[17px] leading-relaxed text-[#6B6B6B]">
            Schedules, attendees, sessions, tasks, issues, and decisions — connected in one place, synced with Notion.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <NavLink to="/app" className="rounded-[6px] bg-[#191919] px-5 py-2.5 text-[14px] font-medium text-white transition-quiet hover:bg-[#2e2e2e]">
              {loggedIn ? 'Open your app →' : 'Create an event'}
            </NavLink>
            <NavLink to="/features" className="rounded-[6px] border border-[#E8E8E6] bg-white px-5 py-2.5 text-[14px] font-medium text-[#191919] transition-quiet hover:border-[#D9D9D6]">
              See how it works
            </NavLink>
          </div>
        </div>
      </section>

      {/* Product areas */}
      <section className="mx-auto max-w-[1100px] px-6 py-16">
        <h2 className="text-[24px] font-semibold tracking-tight">Everything the event needs, in one place</h2>
        <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
          {AREAS.map((a) => (
            <div key={a.t} className="border-t border-[#E8E8E6] pt-4">
              <div className="text-[15px] font-medium text-[#191919]">{a.t}</div>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[#6B6B6B]">{a.d}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-[#E8E8E6]" />

      {/* How it works */}
      <section className="mx-auto max-w-[1100px] px-6 py-16">
        <h2 className="text-[24px] font-semibold tracking-tight">How it works</h2>
        <div className="mt-8 space-y-0">
          {WORKFLOW.map((s) => (
            <div key={s.n} className="flex gap-6 border-t border-[#E8E8E6] py-6 first:border-t-0 first:pt-0">
              <div className="w-10 shrink-0 text-[13px] font-medium tabular-nums text-[#9B9B9B]">{s.n}</div>
              <div>
                <div className="text-[16px] font-medium text-[#191919]">{s.t}</div>
                <p className="mt-1 max-w-[560px] text-[14px] leading-relaxed text-[#6B6B6B]">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-[#E8E8E6]" />

      {/* Principle */}
      <section className="mx-auto max-w-[1100px] px-6 py-16">
        <div className="max-w-[640px]">
          <h2 className="text-[24px] font-semibold tracking-tight">Notion stores the event.<br />Sanchalan runs it.</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[#6B6B6B]">
            Your plan lives in Notion. Sanchalan is the operational layer on top — it computes what a change breaks, surfaces the risks, and applies updates with your approval. Nothing changes without you.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#E8E8E6]">
        <div className="mx-auto max-w-[1100px] px-6 py-20 text-center">
          <h2 className="text-[28px] font-semibold tracking-tight">Start running your event.</h2>
          <p className="mx-auto mt-3 max-w-[440px] text-[15px] text-[#6B6B6B]">Free during beta. Your data stays in Notion.</p>
          <NavLink to="/app" className="mt-7 inline-block rounded-[6px] bg-[#191919] px-6 py-3 text-[14px] font-medium text-white transition-quiet hover:bg-[#2e2e2e]">
            {loggedIn ? 'Open your app →' : 'Create an event'}
          </NavLink>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E8E6] px-6 py-10">
        <div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <Logo size={20} />
              <span className="text-[14px] font-semibold">Sanchalan</span>
            </div>
            <p className="mt-3 max-w-[280px] text-[13px] leading-relaxed text-[#6B6B6B]">
              The event operating workspace. Built for Kaun Banega Codepati 2026.
            </p>
          </div>
          {[
            ['Product', [['Features', '/features'], ['Pricing', '/pricing'], ['Changelog', '/changelog']]],
            ['Company', [['About', '/about'], ['Contact', '/contact'], ['FAQ', '/faq']]],
          ].map(([h, links]) => (
            <div key={h as string}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9B9B9B]">{h}</div>
              <div className="mt-3 space-y-2">
                {(links as [string, string][]).map(([l, href]) => (
                  <NavLink key={href} to={href} className="block text-[13.5px] text-[#6B6B6B] transition-quiet hover:text-[#191919]">{l}</NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
