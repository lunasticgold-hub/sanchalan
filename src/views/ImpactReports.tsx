// Impact reports: enterprise audit records for applied changes,
// plus impact reports already stored in Notion.

import type { ChangeRequest, Records } from '../lib/types';
import ProvenanceBadge from '../components/ProvenanceBadge';
import type { Maps } from './Changes';
import { Badge, Btn, EmptyState, SectionTitle, fmtDateTime, prioTone } from '../components/ui';

function AuditRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-[#F0EFEC] py-2 last:border-0">
      <div className="w-36 shrink-0 text-[12px] font-medium uppercase tracking-wide text-[#6B6B6B]">{label}</div>
      <div className="text-[13px] text-[#2b2b2b]">{value}</div>
    </div>
  );
}

function ChangeAudit({ c, maps }: { c: ChangeRequest; maps: Maps }) {
  const plan = c.plan!;
  const writes = plan.updates.length + plan.newTasks.length + plan.newComms.length + plan.newImpactReports.length;
  const changeDesc =
    c.parsed?.type === 'venue_change'
      ? `${c.parsed.params.fromVenueName} → ${c.parsed.params.toVenueName}`
      : c.parsed?.type === 'time_shift'
        ? `Schedule ${c.parsed.params.minutes > 0 ? 'delayed' : 'preponed'} by ${Math.abs(c.parsed.params.minutes)} min`
        : c.parsed?.type === 'general'
          ? c.parsed.params.summary
          : c.input;
  return (
    <div className="rounded-lg border border-[#E8E8E6] bg-white px-5 py-4">
      <h2 className="text-[16px] font-semibold text-[#191919]">Change Impact Report</h2>
      <div className="mt-3">
        <AuditRow label="Event" value={changeDesc} />
        <AuditRow label="Change" value={c.input} />
        <AuditRow label="Requested" value={`${fmtDateTime(c.createdAt)} · ${c.requestedBy}`} />
        <AuditRow
          label="Affected"
          value={`${plan.updates.filter((u) => u.db === 'sessions').length} sessions · ${plan.updates.filter((u) => u.db === 'tasks').length + plan.newTasks.length} tasks · ${plan.newComms.length} communication(s)`}
        />
        <AuditRow
          label="Risk detected"
          value={
            plan.risks.length === 0 ? (
              'None'
            ) : (
              <span className="space-x-1">
                {plan.risks.map((r, i) => (
                  <span key={i} className="mr-1 inline-flex items-center gap-1">
                    <Badge tone={prioTone(r.level)}>{r.level}</Badge>
                    <span className="text-[12px]">{r.text}</span>
                  </span>
                ))}
              </span>
            )
          }
        />
        <AuditRow
          label="Execution"
          value={
            c.status === 'applied'
              ? `Approved by ${c.approvedBy} · Applied ${fmtDateTime(c.appliedAt ?? '')}${c.riskAcknowledged ? ' · P0 risk acknowledged' : ''}`
              : c.status === 'analyzed'
                ? 'Awaiting approval'
                : c.status
          }
        />
        <AuditRow
          label="Notion sync"
          value={
            c.status === 'applied' && c.applyResult ? (
              <span>
                <Badge tone="green">Successful</Badge>
                <span className="ml-2 text-[12px] text-[#6B6B6B]">
                  {c.applyResult.updated} updated · {c.applyResult.created.length} created ({writes} proposed writes)
                </span>
              </span>
            ) : (
              <span className="text-[#6B6B6B]">—</span>
            )
          }
        />
      </div>

      <div className="mt-4">
        <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#6B6B6B]">Applied writes</div>
        <div className="overflow-hidden rounded-md border border-[#E8E8E6]">
          {plan.updates.map((u, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-[#F0EFEC] px-3 py-1.5 text-[13px] last:border-0">
              <Badge tone="blue">Update</Badge>
              <span className="font-mono text-[11px] text-[#9B9B9B]">{u.db}</span>
              <span className="text-[#3d3d3d]">
                {u.db === 'sessions' ? maps.session.get(u.pageId) : `${u.db} record`}
                {' ← '}
                {Object.keys(u.props).join(', ')}
              </span>
            </div>
          ))}
          {plan.newTasks.map((t, i) => (
            <div key={`t${i}`} className="flex items-center gap-2 border-b border-[#F0EFEC] px-3 py-1.5 text-[13px] last:border-0">
              <Badge tone="green">Create</Badge>
              <span className="font-mono text-[11px] text-[#9B9B9B]">tasks</span>
              <span className="text-[#3d3d3d]">{t.title} [{t.priority}]</span>
            </div>
          ))}
          {plan.newComms.map((cm, i) => (
            <div key={`c${i}`} className="flex items-center gap-2 border-b border-[#F0EFEC] px-3 py-1.5 text-[13px] last:border-0">
              <Badge tone="green">Create</Badge>
              <span className="font-mono text-[11px] text-[#9B9B9B]">comms</span>
              <span className="text-[#3d3d3d]">{cm.name} → {cm.audience} via {cm.channel}</span>
            </div>
          ))}
          {plan.newImpactReports.map((ir, i) => (
            <div key={`r${i}`} className="flex items-center gap-2 px-3 py-1.5 text-[13px]">
              <Badge tone="green">Create</Badge>
              <span className="font-mono text-[11px] text-[#9B9B9B]">impactReports</span>
              <span className="text-[#3d3d3d]">{ir.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ImpactReports({
  records,
  changes,
  maps,
  selectedId,
  setSelectedId,
}: {
  records: Records;
  changes: ChangeRequest[];
  maps: Maps;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}) {
  const applied = [...changes].reverse().filter((c) => c.status === 'applied' || c.status === 'analyzed');
  const selected = selectedId ? changes.find((c) => c.id === selectedId) ?? null : null;

  return (
    <div className="space-y-4">
      <h1 className="text-[20px] font-semibold tracking-tight text-[#191919]">Impact Reports</h1>

      {selected ? (
        <div className="space-y-3">
          <Btn variant="ghost" onClick={() => setSelectedId(null)}>← Back to reports</Btn>
          <ChangeAudit c={selected} maps={maps} />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <SectionTitle>This session</SectionTitle>
            {applied.length === 0 ? (
              <EmptyState
                title="No reports yet"
                body="Approved and applied changes generate an impact report here with the full audit trail."
              />
            ) : (
              <div className="space-y-2">
                {applied.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="w-full rounded-lg border border-[#E8E8E6] bg-white px-4 py-3 text-left hover:border-gray-400"
                  >
                    <div className="truncate text-[13px] font-semibold text-[#191919]">{c.input}</div>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-[#6B6B6B]">
                      <Badge tone={c.status === 'applied' ? 'green' : 'amber'}>
                        {c.status === 'applied' ? 'Applied' : 'Awaiting approval'}
                      </Badge>
                      {fmtDateTime(c.appliedAt ?? c.createdAt)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <SectionTitle>In Notion</SectionTitle>
            {records.impactReports.length === 0 ? (
              <EmptyState title="No stored reports" body="Impact reports written to Notion appear here." />
            ) : (
              <div className="space-y-2">
                {records.impactReports.map((ir) => (
                  <div key={ir.id} className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-[#191919]">{ir.name}</span>
                      <ProvenanceBadge source={ir.source} />
                    </div>
                    <div className="mt-1 text-[12px] text-[#6B6B6B]">Trigger: {ir.trigger}</div>
                    <p className="mt-1 text-[13px] text-[#3d3d3d]">{ir.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
