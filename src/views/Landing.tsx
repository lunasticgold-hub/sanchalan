// Sanchalan landing — refined SaaS marketing site.

import Logo from '../components/Logo';

function DashboardMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-[0_24px_80px_-24px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <div className="ml-3 flex items-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] text-gray-400 ring-1 ring-gray-200">
          <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" rx="2" stroke="currentColor" fill="none"/></svg>
          sanchalan.app/app
        </div>
      </div>
      <div className="flex text-left">
        <div className="hidden w-44 shrink-0 border-r border-gray-100 bg-gray-50/50 p-3 sm:block">
          <div className="mb-3 flex items-center gap-2 px-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-900">
              <div className="h-2 w-2 rounded-full border border-white" />
            </div>
            <div className="h-2 w-20 rounded bg-gray-300" />
          </div>
          {['Overview', 'Changes', 'Inbox', 'Risks', 'Impact'].map((x, i) => (
            <div key={x} className={`mb-1 rounded-lg px-2.5 py-2 text-[11.5px] font-medium ${i === 1 ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500'}`}>{x}</div>
          ))}
          <div className="mt-4 rounded-lg bg-amber-50 p-2.5 ring-1 ring-amber-100">
            <div className="text-[10px] font-semibold text-amber-800">1 P0 risk open</div>
            <div className="mt-0.5 text-[10px] text-amber-600">Capacity overflow</div>
          </div>
        </div>
        <div className="flex-1 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[15px] font-bold text-gray-900">Move Keynote to Auditorium</div>
              <div className="mt-1 text-[12px] text-gray-500">Blast radius computed · 8 records affected</div>
            </div>
            <div className="rounded-md bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">P0</div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {[['2', 'sessions'], ['4', 'tasks'], ['3', 'volunteers']].map(([n, l]) => (
              <div key={l} className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
                <div className="text-[20px] font-bold tabular-nums text-gray-900">{n}</div>
                <div className="text-[10.5px] text-gray-500">{l}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <div className="text-[11px] font-semibold text-amber-900">Capacity risk</div>
            <div className="mt-0.5 text-[11px] leading-relaxed text-amber-700">Auditorium holds 300 · 200 expected + 80 waitlist = 280. Tight but feasible.</div>
          </div>
          <div className="mt-3 space-y-1.5">
            {['Keynote session → Auditorium', 'Reassign 3 volunteers', 'Draft attendee announcement'].map((t) => (
              <div key={t} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
                <span className="text-[12px] font-medium text-gray-700">{t}</span>
                <span className="text-[10px] font-semibold text-green-700">Ready</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <div className="rounded-lg bg-gray-900 px-4 py-2 text-[12px] font-semibold text-white shadow-sm">Approve & apply</div>
            <div className="rounded-lg border border-gray-200 px-4 py-2 text-[12px] font-medium text-gray-500">Discard</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const I = {
  blast: (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="3.2" stroke="currentColor" strokeWidth="1.7"/><circle cx="11" cy="11" r="7.5" stroke="currentColor" strokeWidth="1.1" strokeDasharray="2.5 2.5"/></svg>),
  risk: (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 2.5L19 17.5H3L11 2.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><line x1="11" y1="8" x2="11" y2="12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="11" cy="14.5" r="1.1" fill="currentColor"/></svg>),
  check: (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8.5" stroke="currentColor" strokeWidth="1.7"/><path d="M7.5 11l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  sim: (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 11a7 7 0 0112-5M18 11a7 7 0 01-12 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M16 3v4h-4M6 19v-4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  live: (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="2.5" fill="currentColor"/><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.4"/><circle cx="11" cy="11" r="9.5" stroke="currentColor" strokeWidth="0.9" opacity="0.35"/></svg>),
  doc: (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="5" y="2.5" width="12" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><line x1="8" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="8" y1="11.5" x2="14" y2="11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="8" y1="15" x2="12" y2="15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>),
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased selection:bg-gray-900 selection:text-white">
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-gray-100/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <a href="/" className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="text-[16.5px] font-bold tracking-tight">Sanchalan</span>
          </a>
          <div className="hidden items-center gap-8 md:flex">
            {[
              ['Features', '/features'],
              ['Pricing', '/pricing'],
              ['About', '/about'],
              ['FAQ', '/faq'],
            ].map(([l, h]) => (
              <a key={h} href={h} className="text-[13.5px] font-medium text-gray-500 transition-colors hover:text-gray-900">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            <a href="/app" className="rounded-lg px-4 py-2 text-[13.5px] font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">Sign in</a>
            <a href="/app" className="rounded-lg bg-gray-900 px-4.5 py-2 text-[13.5px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-all hover:bg-gray-800 hover:shadow-md">Get started</a>
          </div>
        </div>
      </nav>

      <section className="px-6 pb-24 pt-40">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <a href="/changelog" className="group inline-flex items-center gap-2.5 rounded-full border border-gray-200 bg-white py-1.5 pl-2 pr-4 text-[12.5px] font-medium text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:shadow">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">NEW</span>
              Per-event workspaces & one-click undo
              <span className="text-gray-400 transition-transform group-hover:translate-x-0.5">→</span>
            </a>
            <h1 className="mt-8 text-[46px] font-bold leading-[1.04] tracking-[-0.02em] md:text-[68px]">
              Notion stores the event.
              <br />
              <span className="text-gray-400">Sanchalan runs it.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-[17.5px] leading-[1.65] text-gray-500">
              The operational layer for events on Notion. Describe a change in plain English —
              see the blast radius, catch the risks, and apply it with your approval. Nothing else moves.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="/app" className="w-full rounded-xl bg-gray-900 px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)] transition-all hover:bg-gray-800 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)] sm:w-auto">
                Start free
              </a>
              <a href="/features" className="w-full rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-[15px] font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow sm:w-auto">
                Explore features
              </a>
            </div>
            <p className="mt-5 text-[12.5px] text-gray-400">Free during beta · No credit card · Your data stays in Notion</p>
          </div>
          <div className="mx-auto mt-16 max-w-4xl">
            <DashboardMock />
            <p className="mt-4 text-center text-[12px] text-gray-400">A real change proposal — blast radius, P0 risk, and approval gate</p>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-gray-50/70 px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              ['11', 'Notion databases connected'],
              ['200+', 'attendees managed live'],
              ['5', 'seconds to blast radius'],
              ['0', 'unapproved writes, ever'],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="text-[32px] font-bold tabular-nums tracking-tight">{n}</div>
                <div className="mt-1 text-[12.5px] text-gray-500">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-28">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-gray-400">01 — Features</div>
            <h2 className="mt-3 max-w-lg text-[34px] font-bold leading-[1.15] tracking-tight">Built for the chaos<br />of event day.</h2>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-gray-500">Notion holds your plan. Sanchalan handles everything that tries to break it.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            { icon: I.blast, title: 'Blast radius analysis', body: '"Move all sessions to Hall B" — instantly see every affected session, task, volunteer, and announcement. No missed knock-on effects.' },
            { icon: I.risk, title: 'Risk detection', body: 'Capacity overflows, double-booked volunteers, speaker conflicts. P0–P3 severity, caught while still preventable.' },
            { icon: I.check, title: 'Human approval gate', body: 'Nothing writes to Notion without you. Analyze → review → approve → execute → audit. Every time.' },
            { icon: I.sim, title: 'What-if simulation', body: '"What if the main hall floods?" Simulate against live data without touching a record. Discard or convert to a real change.' },
            { icon: I.live, title: 'Live operations', body: "Event-day command view: what's happening now, what's next, who's checked in, where the gaps are." },
            { icon: I.doc, title: 'Impact reports', body: 'Auto-generated debriefs: what changed, what broke, what worked. Your retrospective writes itself.' },
          ].map((f) => (
            <div key={f.title} className="group rounded-2xl border border-gray-150 bg-white p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.12)]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors duration-200 group-hover:bg-gray-900 group-hover:text-white">
                {f.icon}
              </div>
              <div className="mt-5 text-[16px] font-semibold tracking-tight">{f.title}</div>
              <p className="mt-2 text-[13.5px] leading-[1.65] text-gray-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-100 bg-gray-50/70 px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-gray-400">02 — How it works</div>
            <h2 className="mt-3 text-[34px] font-bold tracking-tight">Three steps. No training.</h2>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { n: '01', t: 'Connect Notion', b: 'Link your workspace. Sanchalan reads venues, sessions, volunteers, tasks — all 11 databases — through the official API.' },
              { n: '02', t: 'Describe the change', b: 'Type it in plain English. Sanchalan computes the blast radius and surfaces every risk in seconds.' },
              { n: '03', t: 'Approve & execute', b: 'Review each write, acknowledge the risks, hit approve. Notion updates. Audit trail created. Done.' },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-gray-200 bg-white p-7">
                <div className="text-[13px] font-bold tabular-nums text-gray-300">{s.n}</div>
                <div className="mt-3 text-[17px] font-semibold tracking-tight">{s.t}</div>
                <p className="mt-2 text-[13.5px] leading-[1.65] text-gray-500">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-28 text-center">
        <svg className="mx-auto text-gray-300" width="36" height="36" viewBox="0 0 36 36" fill="currentColor"><path d="M8 10c-3 1-5 4-5 8v8h9v-9H7c0-3 1-5 3-6l-2-1zm16 0c-3 1-5 4-5 8v8h9v-9h-5c0-3 1-5 3-6l-2-1z"/></svg>
        <div className="mt-6 text-[23px] font-medium leading-[1.55] tracking-[-0.01em] text-gray-800">
          We moved 200 attendees to a new venue at 9pm the night before. Sanchalan caught the capacity
          overflow, reassigned the volunteers, and drafted the announcement — before I'd finished my coffee.
        </div>
        <div className="mt-7">
          <div className="text-[14px] font-semibold">Event Coordinator</div>
          <div className="mt-0.5 text-[13px] text-gray-500">BBSR Founders Meetup</div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-28">
        <div className="relative overflow-hidden rounded-3xl bg-gray-900 px-8 py-20 text-center">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
          <div className="relative">
            <h2 className="mx-auto max-w-xl text-[34px] font-bold leading-[1.15] tracking-tight text-white">Stop running your event on hope and spreadsheets.</h2>
            <p className="mx-auto mt-4 max-w-md text-[15.5px] leading-relaxed text-gray-400">Connect Notion. Describe the change. Approve with confidence.</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="/app" className="rounded-xl bg-white px-8 py-3.5 text-[15px] font-semibold text-gray-900 transition-all hover:bg-gray-100">Get started free</a>
              <a href="/pricing" className="rounded-xl border border-gray-700 px-8 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-gray-800">View pricing</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 px-6 pb-10 pt-14">
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
                  <a key={href} href={href} className="block text-[13.5px] text-gray-500 transition-colors hover:text-gray-900">{l}</a>
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
