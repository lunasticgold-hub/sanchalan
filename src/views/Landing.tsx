// Sanchalan SaaS landing — proper marketing site.

import Logo from '../components/Logo';

/* ---------- Product mockup (pure CSS dashboard preview) ---------- */
function DashboardMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
      <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <div className="ml-3 rounded bg-white px-3 py-1 text-[11px] text-gray-400 ring-1 ring-gray-200">sanchalan.app/app</div>
      </div>
      <div className="flex">
        <div className="hidden w-40 shrink-0 border-r border-gray-100 bg-gray-50/60 p-3 sm:block">
          <div className="mb-3 flex items-center gap-1.5 px-1">
            <div className="h-5 w-5 rounded-full bg-gray-900" />
            <div className="h-2 w-16 rounded bg-gray-300" />
          </div>
          {['Overview', 'Changes', 'Inbox', 'Risks', 'Impact'].map((x, i) => (
            <div key={x} className={`mb-1 rounded px-2 py-1.5 text-[11px] font-medium ${i === 1 ? 'bg-gray-900 text-white' : 'text-gray-500'}`}>{x}</div>
          ))}
        </div>
        <div className="flex-1 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="h-3 w-40 rounded bg-gray-800" />
              <div className="mt-1.5 h-2 w-64 rounded bg-gray-200" />
            </div>
            <div className="rounded bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">1 P0 risk</div>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {[['8', 'changes'], ['4', 'tasks'], ['3', 'volunteers']].map(([n, l]) => (
              <div key={l} className="rounded-lg border border-gray-100 bg-gray-50/60 p-2.5">
                <div className="text-[18px] font-bold text-gray-900">{n}</div>
                <div className="text-[10px] text-gray-500">{l} affected</div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {[
              ['Move Keynote → Auditorium', 'amber'],
              ['Reassign 3 volunteers', 'blue'],
              ['Notify 200 attendees', 'gray'],
            ].map(([t, c]) => (
              <div key={t} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
                <div className="h-2 w-44 rounded bg-gray-200" />
                <div className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${c === 'amber' ? 'bg-amber-100 text-amber-800' : c === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                  {t}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <div className="rounded-md bg-gray-900 px-3 py-1.5 text-[11px] font-medium text-white">Approve & apply</div>
            <div className="rounded-md border border-gray-200 px-3 py-1.5 text-[11px] font-medium text-gray-500">Discard</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Icons ---------- */
const I = {
  blast: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2"/></svg>),
  risk: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L17 16H3L10 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><line x1="10" y1="7" x2="10" y2="11" stroke="currentColor" strokeWidth="1.8"/><circle cx="10" cy="13.5" r="1" fill="currentColor"/></svg>),
  check: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  sim: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10a7 7 0 0112-5M17 10a7 7 0 01-12 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M15 2v4h-4M5 18v-4h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  live: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="2.5" fill="currentColor"/><circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5"/><circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1" opacity="0.4"/></svg>),
  doc: (<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><line x1="7" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5"/><line x1="7" y1="10.5" x2="13" y2="10.5" stroke="currentColor" strokeWidth="1.5"/><line x1="7" y1="14" x2="11" y2="14" stroke="currentColor" strokeWidth="1.5"/></svg>),
};

const FEATURES = [
  { icon: I.blast, title: 'Blast radius analysis', body: 'Type "move all sessions to Hall B" — see every affected session, task, volunteer, and announcement before anything changes.' },
  { icon: I.risk, title: 'Risk detection', body: 'Capacity overflows, double-booked volunteers, speaker conflicts. P0s caught while they\'re still preventable.' },
  { icon: I.check, title: 'Human approval gate', body: 'Nothing writes to Notion without your explicit approval. Analyze → review → approve → execute → audit.' },
  { icon: I.sim, title: 'What-if simulation', body: '"What if the main hall floods?" Simulate any scenario against live data. Discard it or convert it to a real change.' },
  { icon: I.live, title: 'Live operations', body: 'Event-day command view: what\'s happening now, what\'s next, who\'s checked in, where the gaps are.' },
  { icon: I.doc, title: 'Impact reports', body: 'Auto-generated debriefs: what changed, what broke, what worked. Your retrospective writes itself.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <a href="/" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-[16px] font-bold tracking-tight">Sanchalan</span>
          </a>
          <div className="hidden items-center gap-7 md:flex">
            <a href="/features" className="text-[13px] font-medium text-gray-600 hover:text-gray-900">Features</a>
            <a href="/pricing" className="text-[13px] font-medium text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="/about" className="text-[13px] font-medium text-gray-600 hover:text-gray-900">About</a>
            <a href="/faq" className="text-[13px] font-medium text-gray-600 hover:text-gray-900">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <a href="/app" className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-100">Sign in</a>
            <a href="/app" className="rounded-lg bg-gray-900 px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-gray-800">Get started</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pb-20 pt-36">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <a href="/changelog" className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-100">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              New: per-event workspaces & one-click undo
            </a>
            <h1 className="mt-6 text-[44px] font-bold leading-[1.08] tracking-tight md:text-[60px]">
              Notion stores the event.<br />
              <span className="text-gray-500">Sanchalan helps you run it.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-gray-600">
              The operational layer for events running on Notion. Describe a change in plain English —
              Sanchalan maps the blast radius, flags the risks, and applies it only with your approval.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="/app" className="w-full rounded-lg bg-gray-900 px-7 py-3 text-[15px] font-semibold text-white shadow-sm hover:bg-gray-800 sm:w-auto">
                Start free
              </a>
              <a href="/features" className="w-full rounded-lg border border-gray-300 px-7 py-3 text-[15px] font-semibold text-gray-700 hover:bg-gray-50 sm:w-auto">
                Explore features
              </a>
            </div>
            <p className="mt-4 text-[12px] text-gray-400">Free during beta · No credit card · Your data stays in Notion</p>
          </div>
          <div className="mx-auto mt-14 max-w-4xl">
            <DashboardMock />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-gray-100 bg-gray-50/60 px-6 py-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400">Built on infrastructure you trust</div>
          <div className="mt-4 flex items-center justify-center gap-10">
            {['Notion', 'Supabase', 'Vercel', 'Gemini'].map((x) => (
              <span key={x} className="text-[15px] font-semibold text-gray-400">{x}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gray-400">Features</div>
          <h2 className="mt-2 text-[32px] font-bold tracking-tight">Everything you need to run the event</h2>
          <p className="mt-3 text-[16px] text-gray-600">Notion holds your data. Sanchalan turns it into decisions.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="group rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700 group-hover:bg-gray-900 group-hover:text-white">
                {f.icon}
              </div>
              <div className="mt-4 text-[15px] font-semibold">{f.title}</div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-gray-600">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-gray-100 bg-gray-50/60 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gray-400">How it works</div>
            <h2 className="mt-2 text-[32px] font-bold tracking-tight">Three steps. No training needed.</h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { n: '1', t: 'Connect Notion', b: 'Link your event workspace. Sanchalan reads your venues, sessions, volunteers, tasks — all 11 databases.' },
              { n: '2', t: 'Describe the change', b: 'Type what you need in plain English. Sanchalan analyzes the impact and surfaces every risk instantly.' },
              { n: '3', t: 'Approve & execute', b: 'Review each proposed write, acknowledge the risks, hit approve. Notion updates, audit trail created.' },
            ].map((s) => (
              <div key={s.n} className="relative rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-[15px] font-bold text-white">{s.n}</div>
                <div className="mt-4 text-[16px] font-semibold">{s.t}</div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-gray-600">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="text-[22px] font-medium leading-relaxed tracking-tight text-gray-800">
          "We moved 200 attendees to a new venue at 9pm the night before. Sanchalan caught the capacity
          overflow, reassigned the volunteers, and drafted the announcement — before I'd finished my coffee."
        </div>
        <div className="mt-6 text-[13px] font-medium text-gray-500">Event coordinator · BBSR Founders Meetup</div>
      </section>

      {/* Pricing teaser */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-2xl bg-gray-900 px-8 py-14 text-center">
          <h2 className="text-[30px] font-bold tracking-tight text-white">Start free. Upgrade when it matters.</h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] text-gray-400">One event, all features, free during beta. Pro plans from ₹499/event when we launch.</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="/app" className="rounded-lg bg-white px-7 py-3 text-[15px] font-semibold text-gray-900 hover:bg-gray-100">Get started free</a>
            <a href="/pricing" className="rounded-lg border border-gray-700 px-7 py-3 text-[15px] font-semibold text-white hover:bg-gray-800">View pricing</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-[14px] font-bold">Sanchalan</span>
            </div>
            <p className="mt-3 max-w-[220px] text-[12.5px] leading-relaxed text-gray-500">The operational layer for events running on Notion.</p>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">Product</div>
            <div className="mt-3 space-y-2">
              <a href="/features" className="block text-[13px] text-gray-600 hover:text-gray-900">Features</a>
              <a href="/pricing" className="block text-[13px] text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="/changelog" className="block text-[13px] text-gray-600 hover:text-gray-900">Changelog</a>
              <a href="/app" className="block text-[13px] text-gray-600 hover:text-gray-900">Open app</a>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">Company</div>
            <div className="mt-3 space-y-2">
              <a href="/about" className="block text-[13px] text-gray-600 hover:text-gray-900">About</a>
              <a href="/contact" className="block text-[13px] text-gray-600 hover:text-gray-900">Contact</a>
              <a href="/faq" className="block text-[13px] text-gray-600 hover:text-gray-900">FAQ</a>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">Legal</div>
            <div className="mt-3 space-y-2">
              <a href="/privacy" className="block text-[13px] text-gray-600 hover:text-gray-900">Privacy</a>
              <a href="/terms" className="block text-[13px] text-gray-600 hover:text-gray-900">Terms</a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-gray-100 pt-5 text-center text-[12px] text-gray-400">
          Built for Kaun Banega Codepati 2026 (KBC-NOTION-03) · Team larpers
        </div>
      </footer>
    </div>
  );
}
