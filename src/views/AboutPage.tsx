import { PageShell } from './site';

export default function AboutPage() {
  return (
    <PageShell title="About" subtitle="We're building the operational layer for events that run on Notion.">
      <div className="space-y-6 text-[14px] leading-relaxed text-gray-700">
        <p>
          Sanchalan (संचालन) means <em>operations</em> — the art of making things run. We started Sanchalan
          because event organizers live in Notion, but Notion doesn't help them <strong>run</strong> the event.
          It stores the plan. It doesn't flag the conflict, compute the blast radius, or ask for approval
          before 200 attendees get the wrong venue.
        </p>
        <p>
          Sanchalan sits on top of your Notion workspace as a command center: describe a change in plain
          English, see everything it touches, acknowledge the risks, and apply it with one click — with a
          full audit trail.
        </p>
        <h2 className="pt-2 text-[18px] font-semibold text-gray-900">The team</h2>
        <p>
          We're <strong>team larpers</strong> — Abhigyan Rai, Aditya Kumar, and Akshit Sinha — building
          Sanchalan for Kaun Banega Codepati 2026 (KBC-NOTION-03), the Intelligent Team Operations &
          Event Command Center challenge.
        </p>
        <h2 className="pt-2 text-[18px] font-semibold text-gray-900">Principles</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Notion is the system of record. Your data is always yours.</li>
          <li>AI does language work; deterministic code does relationships, capacity, and audit.</li>
          <li>Nothing risky happens without a human's explicit approval.</li>
        </ul>
      </div>
    </PageShell>
  );
}
