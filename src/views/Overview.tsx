// Overview — the event workspace home page.
// A document, not a dashboard. Rows and dividers, not cards.

import type { ChangeRequest, Records } from '../lib/types';
import { useState } from 'react';
import { Badge, Btn, EmptyState, fmtDate, prioTone } from '../components/ui';
import PullFromNotionBanner from '../components/PullFromNotionBanner';
import ConnectNotionModal from '../components/ConnectNotionModal';
import type { View } from '../components/Sidebar';

function relativeDay(iso: string) {
  if (!iso) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 1) return `In ${days} days`;
  if (days < 0) return fmtDate(iso);
  return '';
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
  const isEmptyCustom = activeEvent?.id.startsWith('custom-') &&
    records.sessions.length === 0 && records.tasks.length === 0 &&
    records.volunteers.length === 0 && records.attendees.length === 0;

  const upcoming = [...records.sessions]
    .filter((s) => !s.starts || new Date(s.starts) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => (a.starts ?? '').localeCompare(b.starts ?? ''))
    .slice(0, 6);

  const recentActivity = [...changes].reverse().slice(0, 6);
  const [showConnect, setShowConnect] = useState(false);

  const attentionItems: { kind: string; title: string; sub: string; action: () => void; actionLabel: string; badge?: React.ReactNode }[] = [
    ...p0.map((r) => ({
      kind: 'Critical',
      title: r.text,
      sub: 'Risk · needs resolution before applying',
      action: () => setView('risks'),
      actionLabel: 'View',
      badge: <Badge tone={prioTone('P0')}>P0</Badge>,
    })),
    ...pending.map((c) => ({
      kind: 'Approval',
      title: c.input,
      sub: 'Change request · awaiting your review',
      action: () => onReview(c.id),
      actionLabel: 'Review',
      badge: <Badge tone="amber">Approval</Badge>,
    })),
    ...overdueTasks.slice(0, 3).map((t) => ({
      kind: 'Overdue',
      title: t.title,
      sub: `Task · due ${fmtDate(t.due)}`,
      action: () => setView('tasks'),
      actionLabel: 'View',
      badge: <Badge tone="red">Overdue</Badge>,
    })),
  ];

  return (
    <div className="mx-auto max-w-[900px]">
      {isEmptyCustom && activeEvent && (
        <div className="mb-8">
          <PullFromNotionBanner
            eventId={activeEvent.id}
            setView={setView}
            onPulled={(updater) => updateCustomData?.(updater)}
          />
        </div>
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

      {/* Event title — document style */}
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-[#191919]">{event?.name ?? 'Event overview'}</h1>
          <p className="mt-1.5 text-[14px] text-[#6B6B6B]">
            {[relativeDay(event?.date ?? ''), fmtDate(event?.date ?? ''), event?.organizer].filter(Boolean).join(' · ')}
          </p>
          <p className="mt-2 text-[13px] text-[#9B9B9B]">
            {records.sessions.length} sessions · {records.attendees.length} attendees · {openTasks.length} open tasks · {p0.length} critical issues
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          {activeEvent?.id.startsWith('custom-') && (
            <button onClick={() => setShowConnect(true)} className="text-[13px] font-medium text-[#6B6B6B] hover:text-[#191919] transition-quiet">
              ⇄ Sync
            </button>
          )}
          <Btn variant="primary" onClick={() => setView('changes')}>New change</Btn>
        </div>
      </div>

      <hr className="my-8 border-[#E8E8E6]" />

      {/* Needs attention — rows, not cards */}
      <section className="mb-10" aria-label="Needs attention">
        <h2 className="mb-1 text-[20px] font-semibold tracking-tight text-[#191919]">Needs attention</h2>
        {attentionItems.length === 0 ? (
          <p className="mt-3 text-[14px] text-[#9B9B9B]">Nothing needs your attention right now.</p>
        ) : (
          <>
            <p className="mb-4 text-[13px] text-[#6B6B6B]">{attentionItems.length} item{attentionItems.length === 1 ? '' : 's'} need{attentionItems.length === 1 ? 's' : ''} your attention</p>
            <div>
              {attentionItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-[#F0EFEC] py-3 first:border-t">
                  <div className="w-20 shrink-0">{item.badge ?? <span className="text-[12px] font-medium text-[#9B9B9B]">{item.kind}</span>}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] text-[#191919]">{item.title}</div>
                    <div className="text-[12.5px] text-[#9B9B9B]">{item.sub}</div>
                  </div>
                  <button onClick={item.action} className="shrink-0 text-[13px] font-medium text-[#6B6B6B] hover:text-[#191919] transition-quiet">
                    {item.actionLabel} →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Schedule — timeline rows */}
      <section className="mb-10" aria-label="Schedule">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[20px] font-semibold tracking-tight text-[#191919]">Schedule</h2>
          <button onClick={() => setView('sessions')} className="text-[13px] font-medium text-[#6B6B6B] hover:text-[#191919] transition-quiet">All sessions →</button>
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No sessions scheduled"
            body="Add sessions to build your event schedule."
            action={<Btn variant="secondary" onClick={() => setView('sessions')}>Go to sessions</Btn>}
          />
        ) : (
          <div>
            {upcoming.map((s) => (
              <button key={s.id} onClick={() => setView('sessions')} className="flex w-full items-baseline gap-6 border-b border-[#F0EFEC] py-3.5 text-left first:border-t transition-quiet hover:bg-[#F5F5F3]">
                <div className="w-20 shrink-0 text-[13px] tabular-nums text-[#6B6B6B]">
                  {s.starts ? new Date(s.starts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-medium text-[#191919]">{s.name}</div>
                  <div className="mt-0.5 text-[13px] text-[#9B9B9B]">
                    {[s.speaker, s.format].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                {s.status && (
                  <span className="shrink-0 text-[12.5px] text-[#9B9B9B]">{s.status}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Recent activity — rows */}
      <section className="mb-10" aria-label="Recent activity">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[20px] font-semibold tracking-tight text-[#191919]">Recent activity</h2>
          <button onClick={() => setView('changes')} className="text-[13px] font-medium text-[#6B6B6B] hover:text-[#191919] transition-quiet">All changes →</button>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-[14px] text-[#9B9B9B]">No activity yet. Changes you analyze will appear here.</p>
        ) : (
          <div>
            {recentActivity.map((c) => (
              <button key={c.id} onClick={() => onReview(c.id)} className="flex w-full items-baseline gap-6 border-b border-[#F0EFEC] py-3 text-left first:border-t transition-quiet hover:bg-[#F5F5F3]">
                <div className="w-20 shrink-0 text-[12.5px] tabular-nums text-[#9B9B9B]">
                  {c.createdAt ? new Date(c.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '—'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] text-[#191919]">{c.input}</div>
                  <div className="text-[12.5px] text-[#9B9B9B]">
                    {c.status === 'applied' ? 'Applied' : c.status === 'analyzed' ? 'Analysis complete · awaiting approval' : c.status}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Event index — quiet text links, not cards */}
      <section aria-label="Event index">
        <h2 className="mb-4 text-[20px] font-semibold tracking-tight text-[#191919]">Browse</h2>
        <div className="columns-2 gap-8 md:columns-3">
          {[
            { view: 'sessions' as View, label: 'Sessions', count: records.sessions.length },
            { view: 'attendees' as View, label: 'Attendees', count: records.attendees.length },
            { view: 'venues' as View, label: 'Venues', count: records.venues.length },
            { view: 'volunteers' as View, label: 'Volunteers', count: records.volunteers.length },
            { view: 'speakers' as View, label: 'Speakers', count: records.speakers.length },
            { view: 'sponsors' as View, label: 'Sponsors', count: records.sponsors.length },
            { view: 'tasks' as View, label: 'Tasks', count: records.tasks.length },
            { view: 'comms' as View, label: 'Communications', count: records.comms.length },
            { view: 'risks' as View, label: 'Risks', count: records.risks.length },
          ].map((c) => (
            <button
              key={c.view}
              onClick={() => setView(c.view)}
              className="mb-1 flex w-full items-baseline justify-between break-inside-avoid py-1.5 text-left transition-quiet hover:bg-[#F5F5F3] rounded px-2 -mx-2"
            >
              <span className="text-[14px] text-[#191919]">{c.label}</span>
              <span className="text-[13px] tabular-nums text-[#9B9B9B]">{c.count}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
