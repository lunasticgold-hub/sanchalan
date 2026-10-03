import { PageShell } from './site';

const ENTRIES = [
  { date: 'Oct 3, 2026', items: ['Public marketing site: landing, features, pricing, about, FAQ, contact', 'Per-event data isolation — custom events start empty with + Add', 'Sanchalan logo, branded header/footer, favicon'] },
  { date: 'Oct 2, 2026', items: ['Full platform rebuild: 11 databases, 11 views', 'Command palette (⌘K), global search', 'Blast-radius engine, risk detection P0–P3', 'What-if simulation with convert-to-change', 'Live Ops and Pre-flight views', 'Approval workflow: analyze → review → approve → execute → audit', 'Undo for applied changes, delete for pending'] },
  { date: 'Oct 1, 2026', items: ['Initial Sanchalan prototype', 'Notion workspace seeded with demo event'] },
];

export default function ChangelogPage() {
  return (
    <PageShell title="Changelog" subtitle="What we've shipped, newest first.">
      <div className="space-y-6">
        {ENTRIES.map((e) => (
          <div key={e.date} className="rounded-lg border border-gray-200 p-5">
            <div className="text-[13px] font-semibold uppercase tracking-wider text-gray-400">{e.date}</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-gray-700">
              {e.items.map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
