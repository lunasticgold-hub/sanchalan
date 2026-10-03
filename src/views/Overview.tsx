// Overview — the event workspace home.
// Answers "what needs my attention?" with calm, scannable hierarchy.

import type { ChangeRequest, Records } from '../lib/types';
import { useState } from 'react';
import { Badge, Btn, EmptyState, SectionTitle, PageHeader, fmtDate, prioTone } from '../components/ui';
import PullFromNotionBanner from '../components/PullFromNotionBanner';
import ConnectNotionModal from '../components/ConnectNotionModal';
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
  updateCustomData,
}: {
  records: Records;
  changes: ChangeRequest[];
  setView: (v: View) => void;
  onReview: (id: string) => void;
  activeEvent?: { id: string; name: string; date?: string; location?: string; organizer?: string; expectedAttendance?: number } | null;
  updateCustomData?: (updater: (r: Records) => Records) => void;
}) {
  const notionEvent = records.events[0];
  const event = activeEvent && activeEvent.id.startsWith('custom-')
    ? { name: activeEvent.name, date: activeEvent.date ?? '', organizer: activeEvent.organizer ?? activeEvent.location ?? '' }
    : notionEvent;
  const pending = changes.filter((c) => c.status === 'analyzed');
  const latestPlan = [...changes].reverse().find((c) => c.plan)?.plan ?? null;
  const risks = latestPlan?.risks ?? [];
  const p0 = risks.filter((r) => r.level === 'P0');
  const openTasks = records.tasks.filter((t) => t.status !== 'Done');
  const overdueTasks = records.tasks.filter((t) => {
    if (t.status === 'Done' || !t.due) return false;
    return new Date(t.due) < new Date(new Date().setHours(0, 0, 0, 0));
  });
  const status: 'At risk' | 'On track' = p0.length > 0 || pending.length > 0 ? 'At risk' : 'On track';
  const isEmptyCustom = activeEvent?.id.startsWith('custom-') &&
    records.sessions.length === 0 && records.tasks.length === 0 &&
    records.volunteers.length === 0 && records.attendees.length === 0;

  // Upcoming sessions (today onwards, sorted)
  const upcoming = [...records.sessions]
    .filter((s) => !s.starts || new Date(s.starts) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => (a.starts ?? '').localeCompare(b.starts ?? ''))
    .slice(0, 5);

  // Recent activity from changes
  const recentActivity = [...changes].reverse().slice(0, 6);

  const [showConnect, setShowConnect] = useState(false);
  const needsAttentionCount = p0.length + pending.length + overdueTasks.length;

  return (
    <div className="space-y-8">
      {isEmptyCustom && activeEvent && (
        <PullFromNotionBanner
          eventId={activeEvent.id}
          setView={setView}
          onPulled={(updater) => updateCustomData?.(updater)}
        />
      )}
      {showConnect && activeEvent && (
        <ConnectNotionModal
          eventId={activeEvent.id}
          onClose={() => setShowConnect(false)}
          onPulled={(updater) => {
            updateCustomData?.(updater);
            setShowConnect(false);
          }}
        />
      )}

      {/* Header */}
      <PageHeader
        title={event?.name ?? 'Event overview'}
        meta={
          <>
            {relativeDay(event?.date ?? '')} · {fmtDate(event?.date ?? '')}
            {event?.organizer ? ` · ${event.organizer}` : ''}
          </>
        }
        action={
          <div className="flex items-center gap-2">
            {activeEvent?.id.startsWith('custom-') && (
              <Btn variant="secondary" onClick={() => setShowConnect(true)}>⇄ Sync from Notion</Btn>
            )}
            <Btn variant="primary" onClick={() => setView('changes')}>New change</Btn>
          </div>
        }
      />

      {/* Quick summary — compact metrics */}
      <section aria-label="Event summary">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-[#E8E8E6] py-4">
          {[
            ['Sessions', String(records.sessions.length), 'sessions' as View],
            ['Attendees', String(records.attendees.length), 'attendees' as View],
            ['Open tasks', String(openTasks.length), 'tasks' as View],
            ['Critical issues', String(p0.length), 'risks' as View],
            ['Pending approvals', String(pending.length), 'changes' as View],
          ].map(([label, value, v]) => (
            <button key={label as string} onClick={() => setView(v as View)} className="group text-left">
              <div className="text-[20px] font-semibold tabular-nums tracking-tight text-[#191919] group-hover:underline underline-offset-4">{value}</div>
              <div className="text-[12px] text-[#6B6B6B]">{label}</div>
            </button>
          ))}
          <div className="ml-auto">
            <Badge tone={status === 'At risk' ? 'red' : 'green'}>{status}</Badge>
          </div>
        </div>
      </section>

      {/* Needs attention — the most useful section */}
      {needsAttentionCount > 0 && (
        <section aria-label="Needs attention">
          <SectionTitle>Needs attention</SectionTitle>
          <div className="divide-y divide-[#F0EFEC] rounded-[10px] border border-[#E8E8E6] bg-white">
            {p0.map((r, i) => (
              <div key={`p0-${i}`} className="flex items-start gap-3 px-4 py-3">
                <Badge tone={prioTone('P0')}>P0</Badge>
                <p className="flex-1 text-[13px] leading-relaxed text-[#191919]">{r.text}</p>
                <button onClick={() => setView('risks')} className="shrink-0 text-[12.5px] font-medium text-[#6B6B6B] hover:text-[#191919] transition-quiet">View →</button>
              </div>
            ))}
            {pending.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3">
                <Badge tone="amber">Approval</Badge>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-[#191919]">{c.input}</div>
                  <div className="text-[12px] text-[#9B9B9B]">Awaiting your review</div>
                </div>
                <Btn variant="secondary" onClick={() => onReview(c.id)}>Review</Btn>
              </div>
            ))}
            {overdueTasks.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <Badge tone="red">Overdue</Badge>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-[#191919]">{t.title}</div>
                  <div className="text-[12px] text-[#9B9B9B]">Due {fmtDate(t.due)}</div>
                </div>
                <button onClick={() => setView('tasks')} className="shrink-0 text-[12.5px] font-medium text-[#6B6B6B] hover:text-[#191919] transition-quiet">View →</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Two-column: agenda + activity */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section aria-label="Upcoming sessions">
          <SectionTitle action={<button onClick={() => setView('sessions')} className="text-[12.5px] font-medium text-[#6B6B6B] hover:text-[#191919] transition-quiet">View all →</button>}>
            Upcoming sessions
          </SectionTitle>
          {upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming sessions"
              body="Sessions you add will appear here in chronological order."
              action={<Btn variant="secondary" onClick={() => setView('sessions')}>Go to sessions</Btn>}
            />
          ) : (
            <div className="divide-y divide-[#F0EFEC] rounded-[10px] border border-[#E8E8E6] bg-white">
              {upcoming.map((s) => (
                <button key={s.id} onClick={() => setView('sessions')} className="flex w-full items-center gap-4 px-4 py-3 text-left transition-quiet hover:bg-[#F5F5F3]">
                  <div className="w-14 shrink-0 text-[13px] font-medium tabular-nums text-[#191919]">
                    {s.starts ? new Date(s.starts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-[#191919]">{s.name}</div>
                    <div className="truncate text-[12px] text-[#9B9B9B]">{s.speaker || s.format || ''}</div>
                  </div>
                  {s.status && <Badge tone={s.status === 'Confirmed' ? 'green' : 'gray'}>{s.status}</Badge>}
                </button>
              ))}
            </div>
          )}
        </section>

        <section aria-label="Recent activity">
          <SectionTitle action={<button onClick={() => setView('changes')} className="text-[12.5px] font-medium text-[#6B6B6B] hover:text-[#191919] transition-quiet">View all →</button>}>
            Recent activity
          </SectionTitle>
          {recentActivity.length === 0 ? (
            <EmptyState
              title="No activity yet"
              body="Changes you analyze and apply will appear here as a chronological feed."
            />
          ) : (
            <div className="divide-y divide-[#F0EFEC] rounded-[10px] border border-[#E8E8E6] bg-white">
              {recentActivity.map((c) => (
                <button key={c.id} onClick={() => onReview(c.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left transition-quiet hover:bg-[#F5F5F3]">
                  <div className="mt-0.5 shrink-0">
                    <Badge tone={c.status === 'applied' ? 'green' : c.status === 'analyzed' ? 'amber' : 'gray'}>
                      {c.status === 'applied' ? 'Applied' : c.status === 'analyzed' ? 'Analyzed' : c.status}
                    </Badge>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-[#191919]">{c.input}</div>
                    <div className="text-[12px] text-[#9B9B9B]">
                      {c.createdAt ? new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Event data — quiet index */}
      <section aria-label="Event data">
        <SectionTitle>Event data</SectionTitle>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[#E8E8E6] bg-[#E8E8E6] md:grid-cols-4">
          {[
            { view: 'attendees' as View, label: 'Attendees', count: records.attendees.length },
            { view: 'sessions' as View, label: 'Sessions', count: records.sessions.length },
            { view: 'venues' as View, label: 'Venues', count: records.venues.length },
            { view: 'volunteers' as View, label: 'Volunteers', count: records.volunteers.length },
            { view: 'speakers' as View, label: 'Speakers', count: records.speakers.length },
            { view: 'sponsors' as View, label: 'Sponsors', count: records.sponsors.length },
            { view: 'tasks' as View, label: 'Tasks', count: records.tasks.length },
            { view: 'comms' as View, label: 'Communications', count: records.comms.length },
          ].map((c) => (
            <button
              key={c.view}
              onClick={() => setView(c.view)}
              className="group flex items-center justify-between bg-white px-4 py-3 text-left transition-quiet hover:bg-[#F5F5F3]"
            >
              <div>
                <div className="text-[16px] font-semibold tabular-nums text-[#191919]">{c.count}</div>
                <div className="text-[12px] text-[#6B6B6B]">{c.label}</div>
              </div>
              <span className="text-[#D9D9D6] transition-quiet group-hover:translate-x-0.5 group-hover:text-[#191919]" aria-hidden>→</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
