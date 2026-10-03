// Sanchalan landing — editorial, Supabase-grade.

import { useEffect, useState } from 'react';
import Logo from '../components/Logo';
import { NavLink } from '../lib/nav';
import { supabase, supabaseConfigured } from '../lib/supabase';

/* ---------- Hooks ---------- */
function useLoggedIn() {
  // Synchronous initial check from localStorage (Supabase stores session here).
  // Avoids flashing "Sign in" before the async check completes.
  const [loggedIn, setLoggedIn] = useState(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) ?? '';
        if (k.startsWith('sb-') && k.endsWith('-auth-token')) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            // Check expiry: expires_at is in seconds
            if (parsed?.access_token && (!parsed.expires_at || parsed.expires_at * 1000 > Date.now())) {
              return true;
            }
          }
        }
      }
    } catch {}
    return false;
  });
  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(Boolean(data.session?.user));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(Boolean(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return loggedIn;
}

/* ---------- Hooks ---------- */
function useTypewriter(phrases: string[], speed = 55, pause = 2400) {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let pi = 0, ci = 0, timer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const phrase = phrases[pi];
      if (!done) {
        ci++;
        setText(phrase.slice(0, ci));
        if (ci >= phrase.length) { setDone(true); timer = setTimeout(tick, pause); return; }
        timer = setTimeout(tick, speed + Math.random() * 40);
      } else {
        setDone(false); setText(''); ci = 0; pi = (pi + 1) % phrases.length;
        timer = setTimeout(tick, 700);
      }
    };
    timer = setTimeout(tick, 1400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);
  return { text, done };
}

/* ---------- Product mockup ---------- */
function DashboardMock() {
  const { text, done } = useTypewriter([
    'Move the keynote to the Auditorium…',
    'What if 500 people show up?…',
    'Reassign volunteers for Hall B…',
  ]);
  return (
    <div className="mockup-float overflow-hidden rounded-xl border border-gray-800 bg-[#0d0d0f] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.5)]">
      <div className="relative flex items-center gap-1.5 overflow-hidden border-b border-gray-800 bg-[#141416] px-4 py-3">
        <div className="sweep-bar absolute inset-y-0 w-1/3 bg-white/[0.04] blur-md" />
        <div className="h-2.5 w-2.5 rounded-full bg-gray-700" />
        <div className="h-2.5 w-2.5 rounded-full bg-gray-700" />
        <div className="h-2.5 w-2.5 rounded-full bg-gray-700" />
        <div className="ml-3 rounded-md bg-[#1e1e21] px-3 py-1 text-[11px] text-gray-500 ring-1 ring-gray-800">sanchalan.app/app</div>
      </div>
      <div className="flex text-left">
        <div className="hidden w-44 shrink-0 border-r border-gray-800/60 bg-[#101012] p-3 sm:block">
          <div className="mb-3 flex items-center gap-2 px-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
              <div className="h-2 w-2 rounded-full border border-gray-900" />
            </div>
            <div className="h-2 w-20 rounded bg-gray-700" />
          </div>
          {['Overview', 'Changes', 'Inbox', 'Risks', 'Impact'].map((x, i) => (
            <div key={x} className={`mb-1 rounded-lg px-2.5 py-2 text-[11.5px] font-medium ${i === 1 ? 'bg-white text-gray-900' : 'text-gray-500'}`}>{x}</div>
          ))}
          <div className="mt-4 rounded-lg bg-amber-500/10 p-2.5 ring-1 ring-amber-500/20">
            <div className="text-[10px] font-semibold text-amber-400">1 P0 risk open</div>
            <div className="mt-0.5 text-[10px] text-amber-500/80">Capacity overflow</div>
          </div>
        </div>
        <div className="flex-1 p-5">
          <div className="mb-4 rounded-lg border border-gray-800 bg-[#141416] px-3.5 py-2.5">
            <span className="text-[12.5px] text-gray-300">{text}</span>
            <span className="typing-caret ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] bg-white" />
          </div>
          <div className={`transition-all duration-700 ${done ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1'}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[15px] font-bold text-white">Move Keynote to Auditorium</div>
                <div className="mt-1 text-[12px] text-gray-500">Blast radius computed · 8 records affected</div>
              </div>
              <div className="p0-pulse rounded-md bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-400 ring-1 ring-amber-500/20">P0</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {[['2', 'sessions'], ['4', 'tasks'], ['3', 'volunteers']].map(([n, l]) => (
                <div key={l} className="rounded-lg border border-gray-800 bg-[#141416] p-3">
                  <div className="text-[20px] font-bold tabular-nums text-white">{n}</div>
                  <div className="text-[10.5px] text-gray-500">{l}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.07] p-3">
              <div className="text-[11px] font-semibold text-amber-300">Capacity risk</div>
              <div className="mt-0.5 text-[11px] leading-relaxed text-amber-200/70">Auditorium holds 300 · 200 expected + 80 waitlist = 280. Tight but feasible.</div>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="rounded-lg bg-white px-4 py-2 text-[12px] font-semibold text-gray-900">Approve & apply</div>
              <div className="rounded-lg border border-gray-700 px-4 py-2 text-[12px] font-medium text-gray-400">Discard</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const loggedIn = useLoggedIn();
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased selection:bg-gray-900 selection:text-white">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-gray-100/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <NavLink to="/" className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="text-[16.5px] font-bold tracking-tight">Sanchalan</span>
          </NavLink>
          <div className="hidden items-center gap-8 md:flex">
            {[['Features', '/features'], ['Pricing', '/pricing'], ['About', '/about'], ['FAQ', '/faq']].map(([l, h]) => (
              <NavLink key={h} to={h} className="text-[13.5px] font-medium text-gray-500 transition-colors hover:text-gray-900">{l}</NavLink>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            {loggedIn ? (
              <NavLink to="/app" className="rounded-lg bg-gray-900 px-4 py-2 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-gray-800">Open app →</NavLink>
            ) : (
              <>
                <NavLink to="/app" className="rounded-lg px-4 py-2 text-[13.5px] font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">Sign in</NavLink>
                <NavLink to="/app" className="rounded-lg bg-gray-900 px-4 py-2 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-gray-800">Get started</NavLink>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero — dark, editorial */}
      <section className="bg-[#0a0a0b] px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <NavLink to="/changelog" className="hero-anim hero-d1 group inline-flex items-center gap-2.5 rounded-full border border-gray-800 bg-[#141416] py-1.5 pl-2 pr-4 text-[12.5px] font-medium text-gray-400 transition-all hover:border-gray-700">
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">NEW</span>
              Per-event workspaces & one-click undo
              <span className="text-gray-600 transition-transform group-hover:translate-x-0.5">→</span>
            </NavLink>
            <h1 className="hero-anim hero-d2 mt-8 text-[48px] font-bold leading-[1.02] tracking-[-0.025em] text-white md:text-[72px]">
              Notion stores the event.<br />
              <span className="text-gray-500">Sanchalan runs it.</span>
            </h1>
            <p className="hero-anim hero-d3 mx-auto mt-7 max-w-xl text-[17.5px] leading-[1.65] text-gray-400">
              The operational layer for events on Notion. Describe a change in plain English —
              see the blast radius, catch the risks, apply it with your approval.
            </p>
            <div className="hero-anim hero-d4 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <NavLink to="/app" className="w-full rounded-xl bg-white px-8 py-3.5 text-[15px] font-semibold text-gray-900 transition-all hover:bg-gray-100 sm:w-auto">
                Start free
              </NavLink>
              <NavLink to="/features" className="w-full rounded-xl border border-gray-800 bg-transparent px-8 py-3.5 text-[15px] font-semibold text-gray-300 transition-all hover:border-gray-700 hover:text-white sm:w-auto">
                Explore features
              </NavLink>
            </div>
            <p className="hero-anim hero-d5 mt-5 text-[12.5px] text-gray-600">Free during beta · No credit card · Your data stays in Notion</p>
          </div>
          <div className="hero-anim hero-d6 mx-auto mt-16 max-w-4xl">
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* How it works — light, spacious */}
      <section className="mx-auto max-w-6xl px-6 py-28">
        <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-gray-400">How it works</div>
        <h2 className="mt-3 max-w-lg text-[36px] font-bold leading-[1.1] tracking-tight">Three steps.<br />No training.</h2>
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 md:grid-cols-3">
          {[
            { n: '01', t: 'Connect Notion', b: 'Link your workspace. Sanchalan reads venues, sessions, volunteers, tasks — all 11 databases — through the official API. Your data never leaves Notion.' },
            { n: '02', t: 'Describe the change', b: 'Type it in plain English. "Move the keynote to the Auditorium." Sanchalan computes the blast radius and surfaces every risk in seconds.' },
            { n: '03', t: 'Approve & execute', b: 'Review each write. Acknowledge the risks. Hit approve. Notion updates, audit trail created. Undo anytime.' },
          ].map((s) => (
            <div key={s.n} className="bg-white p-8">
              <div className="text-[13px] font-bold tabular-nums text-gray-300">{s.n}</div>
              <div className="mt-4 text-[19px] font-semibold tracking-tight">{s.t}</div>
              <p className="mt-2.5 text-[14px] leading-[1.7] text-gray-500">{s.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA — dark */}
      <section className="bg-[#0a0a0b] px-6 py-28 text-center">
        <h2 className="mx-auto max-w-xl text-[38px] font-bold leading-[1.08] tracking-tight text-white">Stop running your event on hope and spreadsheets.</h2>
        <p className="mx-auto mt-5 max-w-md text-[16px] text-gray-400">Connect Notion. Describe the change. Approve with confidence.</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <NavLink to="/app" className="rounded-xl bg-white px-8 py-3.5 text-[15px] font-semibold text-gray-900 transition-all hover:bg-gray-100">{loggedIn ? 'Open your app →' : 'Get started free'}</NavLink>
          <NavLink to="/pricing" className="rounded-xl border border-gray-800 px-8 py-3.5 text-[15px] font-semibold text-gray-300 transition-all hover:border-gray-700 hover:text-white">View pricing</NavLink>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-6 pb-10 pt-14">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 md:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5">
              <Logo size={26} />
              <span className="text-[15px] font-bold tracking-tight">Sanchalan</span>
            </div>
            <p className="mt-4 max-w-[260px] text-[13px] leading-relaxed text-gray-500">The operational layer for events running on Notion. Analyze, approve, execute — with a human in the loop.</p>
          </div>
          {[
            ['Product', [['Features', '/features'], ['Pricing', '/pricing'], ['Changelog', '/changelog'], ['Open app', '/app']]],
            ['Company', [['About', '/about'], ['Contact', '/contact'], ['FAQ', '/faq']]],
            ['Legal', [['Privacy', '/privacy'], ['Terms', '/terms']]],
          ].map(([h, links]) => (
            <div key={h as string}>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">{h}</div>
              <div className="mt-4 space-y-2.5">
                {(links as [string, string][]).map(([l, href]) => (
                  <NavLink key={href} to={href} className="block text-[13.5px] text-gray-500 transition-colors hover:text-gray-900">{l}</NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-6xl border-t border-gray-100 pt-6 text-center text-[12px] text-gray-400">
          Built for Kaun Banega Codepati 2026 (KBC-NOTION-03) · Team larpers
        </div>
      </footer>
    </div>
  );
}
