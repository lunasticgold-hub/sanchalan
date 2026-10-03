// Live Operations: event-day control center.
// Current session, next 60 minutes, check-in, volunteer coverage, risks.

import { useMemo } from 'react';
import type { Records } from '../lib/types';
import { Badge, SectionTitle, fmtTime, statusTone } from '../components/ui';
import { collectRisks } from './Risks';
import type { ChangeRequest } from '../lib/types';

export default function Live({ records, changes }: { records: Records; changes: ChangeRequest[] }) {
  const now = new Date();
  const sessions = useMemo(
    () => [...records.sessions].sort((a, b) => a.starts.localeCompare(b.starts)),
    [records],
  );
  const current = sessions.find((s) => new Date(s.starts) <= now && new Date(s.ends) > now) ?? null;
  const upcoming = sessions.filter((s) => {
    const st = new Date(s.starts).getTime() - now.getTime();
    return st > 0 && st <= 60 * 60 * 1000;
  });
  const checked = records.attendees.filter((a) => a.checkin === 'Checked in').length;
  const total = records.attendees.length;
  const crit = collectRisks(records, changes).filter((r) => r.severity === 'Critical');
  const openTasks = records.tasks.filter((t) => t.status !== 'Done' && t.status !== 'Cancelled');
  const venueName = (id: string) => records.venues.find((v) => v.id === id)?.name ?? '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold tracking-tight">Live Operations</h1>
        <Badge tone="green">● Live</Badge>
      </div>

      {/* Currently happening */}
      <section>
        <SectionTitle>Currently happening</SectionTitle>
        {current ? (
          <div className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-3">
            <div className="text-[16px] font-semibold text-[#191919]">{current.name}</div>
            <div className="mt-1 text-[13px] text-[#6B6B6B]">
              {venueName(current.venueId)} · {fmtTime(current.starts)}–{fmtTime(current.ends)} · Speaker: {current.speaker}
            </div>
            <div className="mt-2 flex gap-2">
              <Badge tone={statusTone(current.status)}>{current.status}</Badge>
              <Badge tone="gray">{records.volunteers.filter((v) => v.sessionIds.includes(current.id)).length} volunteers assigned</Badge>
              <Badge tone="gray">{records.tasks.filter((t) => t.sessionId === current.id && t.status !== 'Done').length} open tasks</Badge>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#D9D9D6] bg-white px-4 py-6 text-center text-[13px] text-[#6B6B6B]">
            No session in progress right now. {upcoming.length > 0 ? `Next: ${upcoming[0].name} at ${fmtTime(upcoming[0].starts)}.` : 'All sessions concluded.'}
          </div>
        )}
      </section>

      {/* Next 60 minutes */}
      <section>
        <SectionTitle>Next 60 minutes</SectionTitle>
        {upcoming.length === 0 ? (
          <div className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-3 text-[13px] text-[#6B6B6B]">Nothing scheduled in the next hour.</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#E8E8E6] bg-white">
            {upcoming.map((s) => (
              <div key={s.id} className="flex items-center gap-3 border-b border-[#F0EFEC] px-4 py-2.5 last:border-0">
                <span className="w-14 shrink-0 font-mono text-[13px] text-[#3d3d3d]">{fmtTime(s.starts)}</span>
                <span className="flex-1 text-[13px] font-medium text-[#191919]">{s.name}</span>
                <span className="text-[12px] text-[#6B6B6B]">{venueName(s.venueId)}</span>
                <Badge tone={statusTone(s.status)}>{s.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Check-in */}
        <section>
          <SectionTitle>Attendee check-in</SectionTitle>
          <div className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-3">
            <div className="text-[22px] font-semibold text-[#191919]">{total ? Math.round((checked / total) * 100) : 0}%</div>
            <div className="text-[12px] text-[#6B6B6B]">{checked} of {total} checked in</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EFEFEA]">
              <div className="h-full rounded-full bg-green-500" style={{ width: `${total ? (checked / total) * 100 : 0}%` }} />
            </div>
          </div>
        </section>
        {/* Volunteer coverage */}
        <section>
          <SectionTitle>Volunteer coverage</SectionTitle>
          <div className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-3">
            <div className="text-[22px] font-semibold text-[#191919]">{records.volunteers.length}</div>
            <div className="text-[12px] text-[#6B6B6B]">volunteers on shift</div>
            <div className="mt-1 text-[12px] text-[#6B6B6B]">
              {['Morning', 'Afternoon', 'Full-day'].map((sh) => `${sh}: ${records.volunteers.filter((v) => v.shift === sh).length}`).join(' · ')}
            </div>
          </div>
        </section>
        {/* Tasks */}
        <section>
          <SectionTitle>Outstanding tasks</SectionTitle>
          <div className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-3">
            <div className="text-[22px] font-semibold text-[#191919]">{openTasks.length}</div>
            <div className="text-[12px] text-[#6B6B6B]">open tasks</div>
            <div className="mt-1 text-[12px] text-[#6B6B6B]">
              {openTasks.filter((t) => t.priority === 'P0').length} P0 · {openTasks.filter((t) => t.status === 'Blocked').length} blocked
            </div>
          </div>
        </section>
      </div>

      {/* Active risks */}
      {crit.length > 0 && (
        <section>
          <SectionTitle>Critical risks</SectionTitle>
          <div className="space-y-2">
            {crit.map((r) => (
              <div key={r.id} className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Badge tone="red">P0</Badge>
                  <span className="text-[14px] font-semibold text-[#191919]">{r.name}</span>
                </div>
                <div className="mt-1 text-[13px] text-[#6B6B6B]">{r.description}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
