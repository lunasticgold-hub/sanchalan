// Sanchalan SaaS landing page.

import Logo from '../components/Logo';

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-[16px] font-bold tracking-tight text-gray-900">Sanchalan</span>
        </div>
        <div className="hidden items-center gap-6 md:flex">
          <a href="/features" className="text-[13px] font-medium text-gray-600 hover:text-gray-900">Features</a>
          <a href="/#how" className="text-[13px] font-medium text-gray-600 hover:text-gray-900">How it works</a>
          <a href="/pricing" className="text-[13px] font-medium text-gray-600 hover:text-gray-900">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          <a href="/app" className="rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-100">Sign in</a>
          <a href="/app" className="rounded-md bg-gray-900 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-gray-800">Get started</a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="px-6 pb-16 pt-32 text-center">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 inline-block rounded-full bg-gray-100 px-3 py-1 text-[12px] font-medium text-gray-700">
          Built for KBC × Notion 2026
        </div>
        <h1 className="text-[40px] font-bold leading-tight tracking-tight text-gray-900 md:text-[52px]">
          Notion stores the event.<br />Sanchalan helps you run it.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-gray-600">
          The operational layer for events running on Notion. Describe a change in plain English —
          Sanchalan maps the blast radius, flags the risks, and applies it only with your approval.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href="/app" className="rounded-md bg-gray-900 px-6 py-2.5 text-[15px] font-medium text-white hover:bg-gray-800">
            Start free
          </a>
          <a href="/#how" className="rounded-md border border-gray-300 px-6 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50">
            See how it works
          </a>
        </div>
        <p className="mt-3 text-[12px] text-gray-400">Free during beta · No credit card · Your data stays in Notion</p>
      </div>
    </section>
  );
}

function Logos() {
  return (
    <section className="border-y border-gray-100 bg-gray-50/50 px-6 py-8">
      <div className="mx-auto max-w-4xl text-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Powered by</div>
        <div className="mt-3 flex items-center justify-center gap-8 text-[14px] font-semibold text-gray-500">
          <span>Notion</span>
          <span>Supabase</span>
          <span>Vercel</span>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    title: 'Blast radius analysis',
    body: 'Type "move all sessions to Hall B" and see every affected session, task, volunteer, and announcement — before anything changes.',
  },
  {
    title: 'Risk detection',
    body: 'Capacity overflows, double-booked volunteers, speaker conflicts. Sanchalan catches the P0s while they\'re still preventable.',
  },
  {
    title: 'Human approval gate',
    body: 'Nothing writes to Notion without your explicit approval. Every multi-record change goes through analyze → review → approve → execute → audit.',
  },
  {
    title: 'What-if simulation',
    body: '"What if the main hall floods?" Simulate any scenario without touching a single record. Discard it or convert it into a real change.',
  },
  {
    title: 'Live operations',
    body: 'Event-day command view: what\'s happening now, what\'s next, who\'s checked in, where the gaps are.',
  },
  {
    title: 'Pre-flight checklist',
    body: 'Run readiness the night before: venues confirmed, speakers arrived, tasks done, comms approved, risks closed.',
  },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="text-center">
        <h2 className="text-[28px] font-bold tracking-tight text-gray-900">Everything you need to run the event</h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] text-gray-600">Notion holds your data. Sanchalan turns it into decisions.</p>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="text-[15px] font-semibold text-gray-900">{f.title}</div>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-600">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { n: '1', title: 'Connect Notion', body: 'Link your event workspace. Sanchalan reads your venues, sessions, volunteers, tasks — all 11 databases.' },
  { n: '2', title: 'Describe the change', body: 'Type what you need in plain English. Sanchalan analyzes the impact and surfaces risks instantly.' },
  { n: '3', title: 'Approve & execute', body: 'Review every proposed write, acknowledge the risks, hit approve. Notion updates, audit trail created.' },
];

function HowItWorks() {
  return (
    <section id="how" className="border-y border-gray-100 bg-gray-50/50 px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-[28px] font-bold tracking-tight text-gray-900">How it works</h2>
          <p className="mt-3 text-[15px] text-gray-600">Three steps. No training needed.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-[16px] font-bold text-white">{s.n}</div>
              <div className="mt-3 text-[15px] font-semibold text-gray-900">{s.title}</div>
              <p className="mt-1 text-[13px] text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-4xl px-6 py-20">
      <div className="text-center">
        <h2 className="text-[28px] font-bold tracking-tight text-gray-900">Pricing</h2>
        <p className="mt-3 text-[15px] text-gray-600">Free while we're in beta. Simple plans when we launch.</p>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-[14px] font-semibold text-gray-900">Starter</div>
          <div className="mt-2 text-[28px] font-bold text-gray-900">Free</div>
          <ul className="mt-4 space-y-2 text-[13px] text-gray-600">
            <li>✓ 1 event</li>
            <li>✓ All 11 databases</li>
            <li>✓ Change analysis & approvals</li>
            <li>✓ Community support</li>
          </ul>
          <a href="/app" className="mt-6 block rounded-md border border-gray-300 px-4 py-2 text-center text-[14px] font-medium text-gray-700 hover:bg-gray-50">Start free</a>
        </div>
        <div className="rounded-lg border-2 border-gray-900 bg-white p-6">
          <div className="text-[14px] font-semibold text-gray-900">Pro</div>
          <div className="mt-2 text-[28px] font-bold text-gray-900">Coming soon</div>
          <ul className="mt-4 space-y-2 text-[13px] text-gray-600">
            <li>✓ Unlimited events</li>
            <li>✓ Team roles & permissions</li>
            <li>✓ Automated email & WhatsApp</li>
            <li>✓ Priority support</li>
          </ul>
          <a href="/app" className="mt-6 block rounded-md bg-gray-900 px-4 py-2 text-center text-[14px] font-medium text-white hover:bg-gray-800">Join waitlist</a>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-gray-900 px-6 py-16 text-center">
      <h2 className="mx-auto max-w-xl text-[28px] font-bold tracking-tight text-white">Stop running your event on hope and spreadsheets.</h2>
      <p className="mx-auto mt-3 max-w-md text-[15px] text-gray-400">Connect Notion. Describe the change. Approve with confidence.</p>
      <a href="/app" className="mt-6 inline-block rounded-md bg-white px-6 py-2.5 text-[15px] font-medium text-gray-900 hover:bg-gray-100">Get started free</a>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-100 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <Logo size={22} />
          <span className="text-[13px] font-semibold text-gray-900">Sanchalan</span>
          <span className="text-[12px] text-gray-400">· Event Command Center</span>
        </div>
        <div className="text-[12px] text-gray-400">Built for Kaun Banega Codepati 2026 (KBC-NOTION-03) · Team larpers</div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <Hero />
      <Logos />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
