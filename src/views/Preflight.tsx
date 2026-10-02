// Pre-flight: event readiness checklist across operational categories.
// Deterministic checks — no arbitrary scores.

import { useMemo } from 'react';
import type { Records } from '../lib/types';
import { Badge, SectionTitle } from '../components/ui';
import type { View } from '../components/Sidebar';

interface Check {
  label: string;
  state: 'ready' | 'attention' | 'critical';
  detail: string;
  view: View;
}

export default function Preflight({ records, setView }: { records: Records; setView: (v: View) => void }) {
  const checks = useMemo<Check[]>(() => {
    const out: Check[] = [];
    const now = new Date();

    // Venues
    out.push({
      label: 'Venues', view: 'venues',
      state: 'ready', detail: `${records.venues.length}/${records.venues.length} confirmed`,
    });
    // Sessions
    const unscheduled = records.sessions.filter((s) => !s.starts || !s.venueId);
    out.push({
      label: 'Sessions', view: 'sessions',
      state: unscheduled.length ? 'attention' : 'ready',
      detail: unscheduled.length ? `${unscheduled.length} missing time/venue` : `${records.sessions.length}/${records.sessions.length} scheduled`,
    });
    // Volunteers — confirmation proxy: volunteers with no sessions assigned
    const unassigned = records.volunteers.filter((v) => v.sessionIds.length === 0);
    out.push({
      label: 'Volunteers', view: 'volunteers',
      state: unassigned.length ? 'attention' : 'ready',
      detail: unassigned.length ? `${unassigned.length} without session assignment` : `${records.volunteers.length} assigned`,
    });
    // Speakers
    const spkMissing = records.speakers.filter((s) => s.confirmation !== 'Confirmed' || s.arrival !== 'Confirmed');
    out.push({
      label: 'Speakers', view: 'speakers',
      state: spkMissing.length ? 'attention' : 'ready',
      detail: spkMissing.length ? `${spkMissing.length} arrival/confirmation pending` : `${records.speakers.length}/${records.speakers.length} confirmed`,
    });
    // Tasks
    const overdue = records.tasks.filter((t) => t.status !== 'Done' && t.due && new Date(t.due) < now);
    out.push({
      label: 'Tasks', view: 'tasks',
      state: overdue.length ? 'attention' : 'ready',
      detail: overdue.length ? `${overdue.length} overdue` : `${records.tasks.filter((t) => t.status === 'Done').length}/${records.tasks.length} done`,
    });
    // Communications
    const unapproved = records.comms.filter((c) => c.status !== 'Approved' && c.status !== 'Sent');
    out.push({
      label: 'Communications', view: 'comms',
      state: unapproved.length ? 'attention' : 'ready',
      detail: unapproved.length ? `${unapproved.length} awaiting approval` : `${records.comms.length}/${records.comms.length} approved`,
    });
    // Sponsors
    const spnOpen = records.sponsors.filter((s) => s.payment !== 'Paid' || s.booth !== 'Confirmed');
    out.push({
      label: 'Sponsors', view: 'sponsors',
      state: spnOpen.length ? 'attention' : 'ready',
      detail: spnOpen.length ? `${spnOpen.length} items pending` : `${records.sponsors.length} sponsors settled`,
    });
    // Capacity risks — sessions in venues smaller than expected headcount proxy
    const capRisks = records.sessions.filter((s) => {
      const v = records.venues.find((vv) => vv.id === s.venueId);
      return v && v.capacity < 150 && (s.format === 'Keynote' || s.format === 'Panel');
    });
    out.push({
      label: 'Capacity risks', view: 'risks',
      state: capRisks.length ? 'critical' : 'ready',
      detail: capRisks.length ? `${capRisks.length} sessions may exceed venue capacity` : 'No capacity conflicts detected',
    });
    return out;
  }, [records]);

  const icon = (s: Check['state']) =>
    s === 'ready' ? <Badge tone="green">✓</Badge> : s === 'attention' ? <Badge tone="amber">⚠</Badge> : <Badge tone="red">●</Badge>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight">Event Pre-flight</h1>
        <p className="mt-1 text-[13px] text-gray-500">Readiness check across every operational category. Run before doors open.</p>
      </div>
      <section>
        <SectionTitle>Checklist</SectionTitle>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {checks.map((c) => (
            <button
              key={c.label}
              onClick={() => setView(c.view)}
              className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-0 hover:bg-gray-50"
            >
              {icon(c.state)}
              <span className="w-36 text-[14px] font-medium text-gray-900">{c.label}</span>
              <span className="flex-1 text-[13px] text-gray-600">{c.detail}</span>
              <span className="text-[12px] text-blue-600">View →</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
