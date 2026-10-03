// Overview: answers "what needs my attention?"
// Operational status, active risks, pending changes, today's operations.

import type { ChangeRequest, Records } from '../lib/types';
import { EST_ATTENDEES } from '../lib/engine';
import { Badge, Btn, EmptyState, SectionTitle, Stat, cx, fmtDate, prioTone } from '../components/ui';
import type { View } from '../components/Sidebar';

function relativeDay(iso: string) {
  if (!iso) return '—';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return `In ${days} days`;
  return fmtDate(iso);
}

export default function Overview({
  records,
  changes,
  setView,
  onReview,
  activeEvent,
}: {
  records: Records;
  changes: ChangeRequest[];
  setView: (v: View) => void;
  onReview: (id: string) => void;
  activeEvent?: { id: string; name: string; date?: string; location?: string; organizer?: string } | null;
}) {
  const notionEvent = records.events[0];
  const event = activeEvent && activeEvent.id.startsWith('custom-')
    ? { name: activeEvent.name, date: activeEvent.date ?? '', organizer: activeEvent.organizer ?? activeEvent.location ?? '' }
    : notionEvent;
  const pending = changes.filter((c) => c.status === 'analyzed');
  const latestPlan = [...changes].reverse().find((c) => c.plan)?.plan ?? null;
  const risks = latestPlan?.risks ?? [];
  const p0 = risks.filter((r) => r.level === 'P0');
  const openTasks = records.tasks.filter((t) => t.status !== 'Done').length;
  const draftComms = records.comms.filter((c) => c.status === 'Draft').length;
  const status: 'At risk' | 'On track' = p0.length > 0 || pending.length > 0 ? 'At risk' : 'On track';

  return (
    <div className="space-y-6">
      {/* Operational status */}
      <section>
        <SectionTitle>Operational status</SectionTitle>
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
            <div>
              <div className="text-[16px] font-semibold text-gray-900">{event?.name ?? '—'}</div>
              <div className="mt-0.5 text-[13px] text-gray-500">
                {relativeDay(event?.date)} · {fmtDate(event?.date)} · {event?.organizer}
              </div>
            </div>
            <Badge tone={status === 'At risk' ? 'red' : 'green'}>{status}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-px bg-gray-100 md:grid-cols-4">
            {[
              ['Attendees (expected)', String(EST_ATTENDEES), undefined],
              ['Sessions', String(records.sessions.length), undefined],
              ['Volunteers', String(records.volunteers.length), undefined],
              ['Tasks', String(records.tasks.length), `${openTasks} open`],
            ].map(([l, v, sub]) => (
              <div key={l} className="bg-white px-4 py-3">
                <div className="text-[20px] font-semibold text-gray-900">{v}</div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{l}</div>
                {sub && <div className="text-[11px] text-gray-400">{sub}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active risks */}
      <section>
        <SectionTitle>Active risks</SectionTitle>
        {risks.length === 0 ? (
          <EmptyState
            title="No active risks"
            body="Risks surface here after you analyze an operational change. Capacity conflicts, shift overlaps, and dependency breaks are detected before anything is applied."
            action={<Btn onClick={() => setView('changes')}>Create change</Btn>}
          />
        ) : (
          <div className="space-y-2">
            {risks.map((r, i) => (
              <div
                key={i}
                className={cx(
                  'rounded-lg border bg-white px-4 py-3',
                  r.level === 'P0' ? 'border-red-300' : 'border-gray-200',
                )}
              >
                <div className="flex items-start gap-2">
                  <Badge tone={prioTone(r.level)}>{r.level}</Badge>
                  <p className="text-[13px] text-gray-800">{r.text}</p>
                </div>
                {r.level === 'P0' && (
                  <p className="mt-2 border-t border-gray-100 pt-2 text-[12px] text-gray-500">
                    Recommendation: do not apply the change until an overflow plan or alternative
                    venue is confirmed.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending changes */}
      <section>
        <SectionTitle>Pending changes</SectionTitle>
        {pending.length === 0 ? (
          <EmptyState
            title="No pending changes"
            body="Operational changes you submit will appear here for review and approval."
            action={<Btn onClick={() => setView('changes')}>Create change</Btn>}
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            {pending.map((c) => {
              const p = c.plan!;
              const writes = p.updates.length + p.newTasks.length + p.newComms.length + p.newImpactReports.length;
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 last:border-0">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-gray-900">{c.input}</div>
                    <div className="mt-0.5 text-[12px] text-gray-500">
                      {writes} proposed writes · {p.risks.filter((r) => r.level === 'P0').length} critical risk(s)
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone="amber">Awaiting approval</Badge>
                    <Btn onClick={() => onReview(c.id)}>Review</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Today's operations */}
      <section>
        <SectionTitle>Today's operations</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { view: 'sessions' as View, label: 'Sessions', value: String(records.sessions.length) },
            { view: 'volunteers' as View, label: 'Volunteers', value: String(records.volunteers.length) },
            { view: 'tasks' as View, label: 'Open tasks', value: String(openTasks) },
            { view: 'comms' as View, label: 'Pending comms', value: String(draftComms), sub: 'drafts awaiting review' },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setView(s.view)}
              className="group rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-all hover:border-gray-900 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="text-[20px] font-semibold text-gray-900">{s.value}</div>
                <span className="text-[14px] text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-gray-900">→</span>
              </div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{s.label}</div>
              {s.sub && <div className="text-[11px] text-gray-400">{s.sub}</div>}
            </button>
          ))}
        </div>
      </section>

      {/* Event data */}
      <section>
        <SectionTitle>Event data</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { view: 'attendees' as View, label: 'Attendees', count: records.attendees.length, sub: 'check-in status' },
            { view: 'sessions' as View, label: 'Sessions', count: records.sessions.length, sub: 'agenda' },
            { view: 'venues' as View, label: 'Venues', count: records.venues.length, sub: 'spaces & capacity' },
            { view: 'volunteers' as View, label: 'Volunteers', count: records.volunteers.length, sub: 'team' },
            { view: 'speakers' as View, label: 'Speakers', count: records.speakers.length, sub: 'lineup' },
            { view: 'sponsors' as View, label: 'Sponsors', count: records.sponsors.length, sub: 'partners' },
            { view: 'tasks' as View, label: 'Tasks', count: records.tasks.length, sub: `${openTasks} open` },
            { view: 'comms' as View, label: 'Communications', count: records.comms.length, sub: 'announcements' },
          ].map((c) => (
            <button
              key={c.view}
              onClick={() => setView(c.view)}
              className="group rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-all hover:border-gray-900 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="text-[20px] font-semibold text-gray-900">{c.count}</div>
                <span className="text-[14px] text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-gray-900">→</span>
              </div>
              <div className="text-[12px] font-medium text-gray-700">{c.label}</div>
              <div className="text-[11px] text-gray-400">{c.sub} · <span className="underline underline-offset-2">view list</span></div>
            </button>
          ))}
        </div>
      </section>

      {/* Tools */}
      <section>
        <SectionTitle>Tools</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { view: 'live' as View, label: 'Live Operations', desc: 'Event-day command view — now, next, coverage' },
            { view: 'preflight' as View, label: 'Pre-flight', desc: 'Readiness checklist before the event' },
            { view: 'simulate' as View, label: 'Simulate', desc: 'What-if scenarios without touching Notion' },
          ].map((t) => (
            <button
              key={t.view}
              onClick={() => setView(t.view)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-left hover:border-gray-300 hover:bg-gray-50"
            >
              <div className="text-[13px] font-semibold text-gray-900">{t.label}</div>
              <div className="mt-0.5 text-[12px] text-gray-500">{t.desc}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
