// Risk Center: central operational risk dashboard.
// Groups seeded Notion risks + deterministic derived risks by severity.

import { useMemo } from 'react';
import type { ChangeRequest, Records } from '../lib/types';
import { Badge, EmptyState, SectionTitle } from '../components/ui';
import type { View } from '../components/Sidebar';

export interface DerivedRisk {
  id: string;
  name: string;
  severity: 'Critical' | 'Warning' | 'Watch';
  category: string;
  description: string;
  view: View;
}

export function collectRisks(records: Records, changes: ChangeRequest[]): DerivedRisk[] {
  const out: DerivedRisk[] = [];
  // Seeded risks from Notion
  for (const r of records.risks) {
    if (r.status === 'Resolved' || r.status === 'Closed') continue;
    out.push({
      id: r.id, name: r.name,
      severity: r.severity === 'Critical' ? 'Critical' : r.severity === 'Warning' ? 'Warning' : 'Watch',
      category: r.category, description: r.description, view: 'risks',
    });
  }
  // P0/P1 from analyzed change plans
  for (const c of changes) {
    if (c.status !== 'analyzed' || !c.plan) continue;
    for (const rk of c.plan.risks) {
      out.push({
        id: `plan-${c.id}-${rk.level}`, name: rk.text.slice(0, 80),
        severity: rk.level === 'P0' ? 'Critical' : rk.level === 'P1' ? 'Warning' : 'Watch',
        category: 'Change impact', description: `From change: "${c.input.slice(0, 80)}"`, view: 'changes',
      });
    }
  }
  // Overdue tasks
  const now = new Date();
  for (const t of records.tasks) {
    if (t.status === 'Done' || !t.due) continue;
    if (new Date(t.due) < now) {
      out.push({
        id: `od-${t.id}`, name: `Overdue: ${t.title}`,
        severity: t.priority === 'P0' ? 'Critical' : 'Warning',
        category: 'Tasks', description: `Due ${t.due.slice(0, 16).replace('T', ' ')} · owner ${t.ownerId.slice(0, 8)}`,
        view: 'tasks',
      });
    }
  }
  // Unconfirmed speakers
  for (const s of records.speakers) {
    if (s.confirmation !== 'Confirmed' || s.arrival !== 'Confirmed') {
      out.push({
        id: `spk-${s.id}`, name: `Speaker not ready: ${s.name}`,
        severity: 'Warning', category: 'People',
        description: [s.confirmation !== 'Confirmed' && 'confirmation pending', s.arrival !== 'Confirmed' && 'arrival unconfirmed'].filter(Boolean).join(' · '),
        view: 'speakers',
      });
    }
  }
  return out;
}

const sevTone = (s: string) => (s === 'Critical' ? 'red' : s === 'Warning' ? 'amber' : 'gray');
const sevOrder = { Critical: 0, Warning: 1, Watch: 2 } as Record<string, number>;

export default function Risks({
  records, changes, setView,
}: {
  records: Records; changes: ChangeRequest[]; setView: (v: View) => void;
}) {
  const risks = useMemo(() => collectRisks(records, changes).sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]), [records, changes]);
  const groups: Array<'Critical' | 'Warning' | 'Watch'> = ['Critical', 'Warning', 'Watch'];

  return (
    <div className="space-y-6">
      <h1 className="text-[20px] font-semibold tracking-tight">Risk Center</h1>
      {risks.length === 0 ? (
        <EmptyState
          title="No active operational risks"
          body="Risks appear here when the engine detects capacity conflicts, overdue tasks, unconfirmed speakers, or change impacts. Deterministic checks run on every sync."
        />
      ) : (
        groups.map((g) => {
          const rs = risks.filter((r) => r.severity === g);
          if (rs.length === 0) return null;
          return (
            <section key={g}>
              <SectionTitle>{g} · {rs.length}</SectionTitle>
              <div className="space-y-2">
                {rs.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setView(r.view)}
                    className="block w-full rounded-lg border border-[#E8E8E6] bg-white px-4 py-3 text-left hover:border-[#D9D9D6]"
                  >
                    <div className="flex items-center gap-2">
                      <Badge tone={sevTone(r.severity)}>{r.severity === 'Critical' ? 'P0' : r.severity === 'Warning' ? 'P1' : 'P2'}</Badge>
                      <span className="text-[14px] font-semibold text-[#191919]">{r.name}</span>
                      <span className="ml-auto text-[11px] uppercase tracking-wide text-[#9B9B9B]">{r.category}</span>
                    </div>
                    <div className="mt-1 text-[13px] text-[#6B6B6B]">{r.description}</div>
                  </button>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
