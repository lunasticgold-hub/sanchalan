// Operational Inbox: prioritized action list across the event.
// Critical first; every item links to the record that needs attention.

import { useMemo } from 'react';
import type { ChangeRequest, Records } from '../lib/types';
import { Badge, EmptyState, SectionTitle } from '../components/ui';
import { collectRisks } from './Risks';
import type { View } from '../components/Sidebar';

interface InboxItem {
  id: string;
  kind: 'Critical' | 'Warning' | 'Task' | 'Communication';
  title: string;
  detail: string;
  view: View;
}

export default function Inbox({
  records, changes, setView,
}: {
  records: Records; changes: ChangeRequest[]; setView: (v: View) => void;
}) {
  const items = useMemo<InboxItem[]>(() => {
    const out: InboxItem[] = [];
    const now = new Date();
    for (const r of collectRisks(records, changes)) {
      out.push({
        id: r.id,
        kind: r.severity === 'Critical' ? 'Critical' : 'Warning',
        title: r.name, detail: r.description, view: r.view,
      });
    }
    for (const t of records.tasks) {
      if (t.status === 'Done' || !t.due) continue;
      const due = new Date(t.due);
      const hrs = (due.getTime() - now.getTime()) / 3600000;
      if (hrs < 0 || hrs < 2) {
        out.push({
          id: `t-${t.id}`,
          kind: hrs < 0 ? 'Critical' : 'Task',
          title: `${hrs < 0 ? 'Overdue' : 'Due soon'}: ${t.title}`,
          detail: `Due ${t.due.slice(0, 16).replace('T', ' ')} · ${t.priority}`,
          view: 'tasks',
        });
      }
    }
    for (const c of records.comms) {
      if (c.status === 'Draft' || c.status === 'Needs review') {
        out.push({
          id: `c-${c.id}`, kind: 'Communication',
          title: `Approve: ${c.name}`,
          detail: `${c.audience} · ${c.channel} · ${c.status}`,
          view: 'comms',
        });
      }
    }
    const rank = { Critical: 0, Warning: 1, Task: 2, Communication: 3 } as Record<string, number>;
    return out.sort((a, b) => rank[a.kind] - rank[b.kind]);
  }, [records, changes]);

  const tone = (k: InboxItem['kind']) =>
    k === 'Critical' ? 'red' : k === 'Warning' ? 'amber' : k === 'Task' ? 'blue' : 'gray';

  return (
    <div className="space-y-6">
      <h1 className="text-[20px] font-semibold tracking-tight">Inbox</h1>
      {items.length === 0 ? (
        <EmptyState
          title="Inbox zero"
          body="Nothing needs your attention right now. Risks, overdue tasks, and unapproved communications will appear here, most urgent first."
        />
      ) : (
        <section>
          <SectionTitle>{items.length} items need attention</SectionTitle>
          <div className="space-y-2">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => setView(it.view)}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left hover:border-gray-300"
              >
                <Badge tone={tone(it.kind)}>{it.kind === 'Critical' ? 'P0' : it.kind}</Badge>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-gray-900">{it.title}</div>
                  <div className="truncate text-[12px] text-gray-500">{it.detail}</div>
                </div>
                <span className="shrink-0 text-[12px] text-blue-600">Open →</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
