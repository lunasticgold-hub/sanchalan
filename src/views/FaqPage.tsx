import { PageShell } from './site';

const FAQS = [
  { q: 'Do I need to move my data into Sanchalan?', a: 'No. Your data stays in your Notion workspace. Sanchalan reads and writes through the official Notion API. Unplug us and everything is exactly where you left it.' },
  { q: 'Can Sanchalan change my Notion without asking?', a: 'Never. Every multi-record change goes through analyze → review → approve → execute → audit. You see the blast radius and risks first, then explicitly approve. Nothing applies silently.' },
  { q: 'What happens if I approve something by mistake?', a: 'Every applied change can be undone — Sanchalan reverts the Notion writes and archives anything it created. The audit trail records both the apply and the undo.' },
  { q: 'Which Notion databases do I need?', a: 'Sanchalan works with 11 databases: events, venues, sessions, speakers, attendees, volunteers, tasks, sponsors, risks, communications, and impact reports. The setup guide walks you through creating them.' },
  { q: 'Is my Notion token safe?', a: 'Your integration token is used server-side only for API calls to Notion. We never display it, log it, or share it. Rotate it anytime from Notion settings.' },
  { q: 'Does it work for multiple events?', a: 'Yes. Create separate events and switch between them. Each event keeps its own data, changes, and audit trail.' },
  { q: 'What does the AI actually do?', a: 'AI handles language work only: understanding your change request and drafting communications. Relationships, capacity checks, conflict detection, mutations, and audit are deterministic code — verifiable, every time.' },
];

export default function FaqPage() {
  return (
    <PageShell title="FAQ" subtitle="Answers to the questions we hear most.">
      <div className="space-y-4">
        {FAQS.map((f) => (
          <div key={f.q} className="rounded-lg border border-gray-200 p-5">
            <div className="text-[15px] font-semibold text-gray-900">{f.q}</div>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-600">{f.a}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
