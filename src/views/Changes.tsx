// Changes: the core product flow.
// Intent → impact analysis → risk detection → human approval → execution → audit.

import { useEffect, useMemo, useState } from 'react';
import type {
  ChangeRequest, ImpactPlan, ParsedChange, Records,
} from '../lib/types';
import { applyGeneralChange, applyTimeShift, applyVenueChange } from '../lib/engine';
import { applyPlan, parseUpdate } from '../lib/api';
import ProvenanceBadge from '../components/ProvenanceBadge';
import {
  Badge, Btn, EmptyState, SectionTitle, cx, fmtDateTime, fmtTime, prioTone,
} from '../components/ui';

export interface Maps {
  venue: Map<string, string>;
  session: Map<string, string>;
  vol: Map<string, string>;
}

interface Props {
  records: Records;
  maps: Maps;
  changes: ChangeRequest[];
  setChanges: React.Dispatch<React.SetStateAction<ChangeRequest[]>>;
  refreshRecords: () => Promise<void>;
  onViewImpact: (id: string) => void;
  initialActiveId?: string | null;
  operatorName?: string;
}

const FALLBACK_OPERATOR = 'Abhigyan Rai';
const uid = () => Math.random().toString(36).slice(2, 10);

// ---------- helpers ----------

function movedSessionIds(plan: ImpactPlan): string[] {
  return plan.updates.filter((u) => u.db === 'sessions').map((u) => u.pageId);
}

function flaggedVolunteers(records: Records, movedIds: string[]) {
  const set = new Set(movedIds);
  return records.volunteers.filter((v) => v.sessionIds.some((id) => set.has(id)));
}

function writeCount(plan: ImpactPlan) {
  return plan.updates.length + plan.newTasks.length + plan.newComms.length + plan.newImpactReports.length;
}

function p0Count(plan: ImpactPlan) {
  return plan.risks.filter((r) => r.level === 'P0').length;
}

interface TNode {
  label: string;
  detail?: string;
  tone?: 'venue' | 'session' | 'task' | 'vol' | 'comms';
  children: TNode[];
}

function buildTree(records: Records, plan: ImpactPlan, parsed: ParsedChange): TNode[] {
  const bySession = new Map(records.sessions.map((s) => [s.id, s]));
  const taskUpdates = plan.updates.filter((u) => u.db === 'tasks');
  if (parsed.type === 'venue_change') {
    const moved = movedSessionIds(plan);
    const vols = flaggedVolunteers(records, moved);
    return [
      {
        label: parsed.params.fromVenueName,
        detail: 'venue',
        tone: 'venue',
        children: [
          ...moved.map((sid) => {
            const s = bySession.get(sid);
            const sessTasks = taskUpdates.filter((u) => {
              const t = records.tasks.find((t) => t.id === u.pageId);
              return t?.sessionId === sid;
            });
            const sessVols = vols.filter((v) => v.sessionIds.includes(sid));
            return {
              label: s?.name ?? sid,
              detail: s ? `${fmtTime(s.starts)}–${fmtTime(s.ends)}` : undefined,
              tone: 'session' as const,
              children: [
                ...sessTasks.map((u) => {
                  const t = records.tasks.find((t) => t.id === u.pageId);
                  return {
                    label: String(u.props.Title ?? t?.title ?? 'task'),
                    detail: 'task rewritten',
                    tone: 'task' as const,
                    children: [],
                  };
                }),
                ...sessVols.map((v) => ({
                  label: v.name,
                  detail: `${v.role} · reconfirm`,
                  tone: 'vol' as const,
                  children: [],
                })),
              ],
            };
          }),
          ...plan.newComms.map((c) => ({
            label: c.name,
            detail: `${c.channel} → ${c.audience}`,
            tone: 'comms' as const,
            children: [],
          })),
        ],
      },
    ];
  }
  // general: affected entities grouped by kind → people involved
  if (parsed.type === 'general') {
    const planSessions = new Set(plan.newTasks.map((t) => t.sessionId).filter(Boolean));
    const groups: TNode[] = [];
    for (const s of records.sessions.filter((s) => planSessions.has(s.id))) {
      const vols = records.volunteers.filter((v) => v.sessionIds.includes(s.id));
      groups.push({
        label: s.name,
        detail: `${fmtTime(s.starts)}–${fmtTime(s.ends)}`,
        tone: 'session',
        children: vols.map((v) => ({ label: v.name, detail: `${v.role} · brief`, tone: 'vol' as const, children: [] })),
      });
    }
    return [
      {
        label: parsed.params.summary,
        detail: `general · ${parsed.params.action}`,
        tone: 'venue',
        children: [
          ...groups,
          ...plan.newComms.map((c) => ({
            label: c.name,
            detail: `${c.channel} → ${c.audience}`,
            tone: 'comms' as const,
            children: [],
          })),
        ],
      },
    ];
  }
  // time_shift: schedule node → sessions → assigned volunteers
  const mins = parsed.type === 'time_shift' ? parsed.params.minutes : 0;
  return [
    {
      label: `Schedule shift ${mins > 0 ? '+' : ''}${mins} min`,
      detail: 'all sessions',
      tone: 'venue',
      children: records.sessions.map((s) => ({
        label: s.name,
        detail: `${fmtTime(s.starts)}–${fmtTime(s.ends)}`,
        tone: 'session' as const,
        children: records.volunteers
          .filter((v) => v.sessionIds.includes(s.id))
          .map((v) => ({ label: v.name, detail: v.shift, tone: 'vol' as const, children: [] })),
      })),
    },
  ];
}

function Tree({ nodes }: { nodes: TNode[] }) {
  return (
    <ul className="space-y-1">
      {nodes.map((n, i) => (
        <li key={i}>
          <div className="flex items-baseline gap-2 rounded px-2 py-1 hover:bg-[#F5F5F3]">
            <span
              className={cx(
                'h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full',
                n.tone === 'venue' && 'bg-[#191919]',
                n.tone === 'session' && 'bg-blue-600',
                n.tone === 'task' && 'bg-amber-500',
                n.tone === 'vol' && 'bg-green-600',
                n.tone === 'comms' && 'bg-gray-400',
              )}
            />
            <span className="text-[13px] font-medium text-[#191919]">{n.label}</span>
            {n.detail && <span className="text-[12px] text-[#6B6B6B]">{n.detail}</span>}
          </div>
          {n.children.length > 0 && (
            <div className="ml-[13px] border-l border-[#E8E8E6] pl-3">
              <Tree nodes={n.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---------- main view ----------

export default function Changes({ records, maps, changes, setChanges, refreshRecords, onViewImpact, initialActiveId, operatorName }: Props) {
  const OPERATOR = operatorName ?? FALLBACK_OPERATOR;
  const [activeId, setActiveId] = useState<string | null>(initialActiveId ?? null);
  const [showNew, setShowNew] = useState(false);
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [ackRisk, setAckRisk] = useState(false);
  const [execLog, setExecLog] = useState<string[]>([]);
  const [applyError, setApplyError] = useState('');
  const [editingComms, setEditingComms] = useState<number | null>(null);
  const [commsDraft, setCommsDraft] = useState('');

  const active = changes.find((c) => c.id === activeId) ?? null;
  const history = useMemo(() => [...changes].reverse(), [changes]);

  useEffect(() => {
    if (initialActiveId) setActiveId(initialActiveId);
  }, [initialActiveId]);

  const patchChange = (id: string, patch: Partial<ChangeRequest>) =>
    setChanges((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const startAnalyze = async () => {
    const text = input.trim();
    if (!text) return;
    setParsing(true);
    setParseError('');
    try {
      const parsed = await parseUpdate(text);
      if (parsed.type === 'none') {
        setParseError('Could not understand that as an ops update. Try describing the change plainly, e.g. "Cancel the keynote session" or "Assign Priya to registration desk".');
        setParsing(false);
        return;
      }
      const plan =
        parsed.type === 'venue_change'
          ? applyVenueChange(records, parsed.params)
          : parsed.type === 'time_shift'
            ? applyTimeShift(records, parsed.params)
            : applyGeneralChange(records, parsed.params);
      const cr: ChangeRequest = {
        id: uid(),
        input: text,
        parsed,
        plan,
        status: 'analyzed',
        createdAt: new Date().toISOString(),
        requestedBy: OPERATOR,
      };
      setChanges((cs) => [...cs, cr]);
      setActiveId(cr.id);
      setShowNew(false);
      setInput('');
      setAckRisk(false);
    } finally {
      setParsing(false);
    }
  };

  const doApprove = async () => {
    if (!active?.plan) return;
    const id = active.id;
    // Capture rollback data: previous values for all pages being updated
    const rollbackUpdates: { db: string; pageId: string; props: Record<string, any> }[] = [];
    for (const u of active.plan.updates) {
      if (u.db === 'sessions') {
        const s = records.sessions.find((x) => x.id === u.pageId);
        if (s) rollbackUpdates.push({ db: 'sessions', pageId: u.pageId, props: { Venue: { rel: s.venueId } } });
      } else if (u.db === 'tasks') {
        const t = records.tasks.find((x) => x.id === u.pageId);
        if (t) rollbackUpdates.push({ db: 'tasks', pageId: u.pageId, props: { Title: t.title, Detail: t.detail } });
      }
    }
    patchChange(id, {
      status: 'applying',
      approvedBy: OPERATOR,
      riskAcknowledged: p0Count(active.plan) > 0,
      rollback: { updates: rollbackUpdates, createdIds: [] },
    });
    setApplyError('');
    setExecLog(['Validating change plan…']);
    try {
      const res = await applyPlan(active.plan);
      const plan = active.plan;
      const log = [
        `Updated ${plan.updates.filter((u) => u.db === 'sessions').length} session(s)`,
        `Updated ${plan.updates.filter((u) => u.db === 'tasks').length} task(s)`,
      ];
      if (plan.newTasks.length) log.push(`Created ${plan.newTasks.length} new task(s)`);
      if (plan.newComms.length) log.push('Created communication draft');
      if (plan.newImpactReports.length) log.push('Created impact report');
      log.push('Notion synced');
      setExecLog(log);
      // Capture created page IDs for undo
      const createdIds = (res.created ?? []).filter((c: any) => c.id).map((c: any) => ({ db: c.db, pageId: c.id }));
      patchChange(id, {
        status: 'applied',
        appliedAt: new Date().toISOString(),
        applyResult: res,
        rollback: { updates: rollbackUpdates, createdIds },
      });
      await refreshRecords();
    } catch (e: any) {
      const msg =
        e?.status === 501
          ? 'Notion is not connected (NOTION_TOKEN missing). The plan was not applied.'
          : `Apply failed: ${e?.message ?? 'unknown error'}`;
      setApplyError(msg);
      patchChange(id, { status: 'analyzed', applyError: msg });
    }
  };

  const doDelete = () => {
    if (!active) return;
    // Only the requester or admin (OPERATOR) can delete
    if (active.requestedBy !== OPERATOR) return;
    setChanges((cs) => cs.filter((c) => c.id !== active.id));
    setActiveId(null);
  };

  const doUndo = async () => {
    if (!active?.rollback || active.status !== 'applied') return;
    if (active.requestedBy !== OPERATOR) return;
    const id = active.id;
    patchChange(id, { status: 'applying' });
    setApplyError('');
    setExecLog(['Reverting applied changes…']);
    try {
      // 1. Revert updated pages to previous values
      const reverseUpdates = active.rollback.updates.map((u) => ({
        db: u.db as any,
        pageId: u.pageId,
        props: u.props,
      }));
      // 2. Archive created pages
      const archive = active.rollback.createdIds.map((c) => ({ pageId: c.pageId }));
      await applyPlan({ updates: reverseUpdates, newTasks: [], newComms: [], newImpactReports: [], risks: [], summary: '' } as any, archive);
      setExecLog(['Reverted updated records', `Archived ${archive.length} created record(s)`, 'Notion synced']);
      patchChange(id, { status: 'undone', undoneAt: new Date().toISOString() });
      await refreshRecords();
    } catch (e: any) {
      const msg = `Undo failed: ${e?.message ?? 'unknown error'}`;
      setApplyError(msg);
      patchChange(id, { status: 'applied', applyError: msg });
    }
  };

  const doCancel = () => {
    if (!active) return;
    patchChange(active.id, { status: 'cancelled', cancelNote: 'Cancelled by operator before approval.' });
    setActiveId(null);
  };

  const doResolveRiskFirst = () => {
    if (!active) return;
    patchChange(active.id, {
      status: 'draft',
      cancelNote: 'Returned to draft — resolve the P0 risk before re-analyzing.',
    });
    setInput(active.input);
    setActiveId(null);
    setShowNew(true);
  };

  const saveCommsEdit = (idx: number) => {
    if (!active?.plan) return;
    const plan = {
      ...active.plan,
      newComms: active.plan.newComms.map((c, i) => (i === idx ? { ...c, draft: commsDraft } : c)),
    };
    patchChange(active.id, { plan });
    setEditingComms(null);
  };

  // ----- analysis screen -----
  const renderAnalysis = (c: ChangeRequest) => {
    const plan = c.plan!;
    const parsed = c.parsed!;
    // General changes have no session *updates*; their affected sessions
    // live on the generated follow-up tasks.
    const moved = parsed.type === 'general'
      ? [...new Set(plan.newTasks.map((t) => t.sessionId).filter(Boolean))]
      : movedSessionIds(plan);
    const vols = flaggedVolunteers(records, moved);
    const sessU = plan.updates.filter((u) => u.db === 'sessions');
    const taskU = plan.updates.filter((u) => u.db === 'tasks');
    const p0s = plan.risks.filter((r) => r.level === 'P0');
    const p1s = plan.risks.filter((r) => r.level !== 'P0');
    const tree = buildTree(records, plan, parsed);
    const applying = c.status === 'applying';

    const counts: { label: string; n: number; target: string }[] = [
      { label: 'Sessions', n: sessU.length, target: 'grp-sessions' },
      { label: 'Tasks', n: taskU.length + plan.newTasks.length, target: 'grp-tasks' },
      { label: 'Volunteers', n: vols.length, target: 'grp-volunteers' },
      { label: 'Communication', n: plan.newComms.length, target: 'grp-comms' },
    ];

    return (
      <div className="space-y-5">
        {/* Change request */}
        <section className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-3">
          <SectionTitle>Change request</SectionTitle>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {parsed.type === 'venue_change' && (
              <>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-[#6B6B6B]">Move sessions from</div>
                  <div className="text-[15px] font-semibold">{parsed.params.fromVenueName}</div>
                </div>
                <div className="text-[#9B9B9B]">→</div>
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wide text-[#6B6B6B]">To</div>
                  <div className="text-[15px] font-semibold">{parsed.params.toVenueName}</div>
                </div>
              </>
            )}
            {parsed.type === 'time_shift' && (
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-[#6B6B6B]">Shift</div>
                <div className="text-[15px] font-semibold">
                  All sessions {parsed.params.minutes > 0 ? 'delayed' : 'preponed'} by {Math.abs(parsed.params.minutes)} min
                </div>
              </div>
            )}
            {parsed.type === 'general' && (
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-[#6B6B6B]">Change · {parsed.params.action}</div>
                <div className="text-[15px] font-semibold">{parsed.params.summary}</div>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Badge tone="blue">Analysis complete</Badge>
            </div>
          </div>
          <div className="mt-2 text-[12px] text-[#6B6B6B]">
            Requested by {c.requestedBy} · {fmtDateTime(c.createdAt)}
            {parsed.via && <span className="ml-2">· parsed via {parsed.via}</span>}
          </div>
        </section>

        {/* Impact summary */}
        <section className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-3">
          <SectionTitle>Impact summary</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {counts.map((k) => (
              <button
                key={k.label}
                onClick={() => scrollTo(k.target)}
                className="rounded-md border border-[#D9D9D6] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#2b2b2b] hover:border-gray-500"
              >
                {k.n} {k.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-[#6B6B6B]">{plan.summary}</p>
        </section>

        {/* Dependency view */}
        <section className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-3">
          <SectionTitle>Dependency view</SectionTitle>
          <Tree nodes={tree} />
        </section>

        {/* Risk check */}
        <section className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-3">
          <SectionTitle>Risk check</SectionTitle>
          {plan.risks.length === 0 && (
            <p className="text-[13px] text-[#6B6B6B]">No risks detected for this change.</p>
          )}
          <div className="space-y-2">
            {p0s.map((r, i) => (
              <div key={i} className="rounded-md border border-red-300 bg-red-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Badge tone="solidRed">P0</Badge>
                  <span className="text-[14px] font-semibold text-red-800">Capacity conflict</span>
                </div>
                <p className="mt-1 text-[13px] text-red-800">{r.text}</p>
                <p className="mt-2 border-t border-red-200 pt-2 text-[12px] text-red-700">
                  Recommendation: do not move the sessions until an overflow plan or alternative
                  venue is confirmed.
                </p>
              </div>
            ))}
            {p1s.map((r, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                <Badge tone={prioTone(r.level)}>{r.level}</Badge>
                <p className="text-[13px] text-amber-900">{r.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Proposed changes */}
        <section className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-3">
          <SectionTitle>Proposed changes</SectionTitle>
          <div className="space-y-4">
            <div id="grp-sessions">
              <div className="mb-1 text-[13px] font-semibold text-[#191919]">Sessions ({sessU.length})</div>
              {sessU.map((u) => {
                const s = records.sessions.find((s) => s.id === u.pageId);
                return (
                  <div key={u.pageId} className="flex items-center justify-between gap-3 border-t border-[#F0EFEC] py-2">
                    <span className="text-[13px] font-medium">{s?.name ?? u.pageId}</span>
                    <span className="text-[13px] text-[#6B6B6B]">
                      Venue: <span className="line-through decoration-gray-400">{maps.venue.get(s?.venueId ?? '')}</span>
                      <span className="mx-1.5 text-[#9B9B9B]">→</span>
                      <span className="font-semibold text-[#191919]">
                        {parsed.type === 'venue_change' ? parsed.params.toVenueName : 'rescheduled'}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div id="grp-tasks">
              <div className="mb-1 text-[13px] font-semibold text-[#191919]">
                Tasks ({taskU.length + plan.newTasks.length})
              </div>
              {taskU.map((u) => {
                const t = records.tasks.find((t) => t.id === u.pageId);
                return (
                  <div key={u.pageId} className="border-t border-[#F0EFEC] py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[13px]">
                        <span className="line-through decoration-gray-400 text-[#6B6B6B]">{t?.title}</span>
                        <span className="mx-1.5 text-[#9B9B9B]">→</span>
                        <span className="font-medium text-[#191919]">{String(u.props.Title ?? '')}</span>
                      </span>
                      <Badge tone="blue">Rewrite</Badge>
                    </div>
                    <div className="mt-0.5 text-[12px] text-[#6B6B6B]">Detail text updated with new venue references.</div>
                  </div>
                );
              })}
              {plan.newTasks.map((t, i) => (
                <div key={`nt-${i}`} className="flex items-center justify-between gap-3 border-t border-[#F0EFEC] py-2">
                  <span className="text-[13px] font-medium text-[#191919]">{t.title}</span>
                  <span className="flex items-center gap-2">
                    <Badge tone={prioTone(t.priority)}>{t.priority}</Badge>
                    <ProvenanceBadge source={t.source} />
                  </span>
                </div>
              ))}
            </div>

            <div id="grp-volunteers">
              <div className="mb-1 text-[13px] font-semibold text-[#191919]">Volunteers ({vols.length})</div>
              {vols.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 border-t border-[#F0EFEC] py-2">
                  <span className="text-[13px] font-medium text-[#191919]">{v.name}</span>
                  <span className="text-[12px] text-[#6B6B6B]">
                    Notify — reconfirm {v.sessionIds.filter((id) => moved.includes(id)).map((id) => maps.session.get(id)).join(', ')}
                  </span>
                </div>
              ))}
            </div>

            <div id="grp-comms">
              <div className="mb-1 text-[13px] font-semibold text-[#191919]">Communications ({plan.newComms.length})</div>
              {plan.newComms.map((c, i) => (
                <div key={i} className="border-t border-[#F0EFEC] py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[13px] font-medium text-[#191919]">{c.name}</span>
                    <span className="flex items-center gap-2">
                      <ProvenanceBadge source={c.source} />
                      <button
                        onClick={() => { setEditingComms(i); setCommsDraft(c.draft); }}
                        className="text-[12px] font-semibold text-blue-700 hover:underline"
                      >
                        Edit
                      </button>
                    </span>
                  </div>
                  {editingComms === i ? (
                    <div className="mt-1">
                      <textarea
                        value={commsDraft}
                        onChange={(e) => setCommsDraft(e.target.value)}
                        rows={4}
                        className="w-full rounded-md border border-[#D9D9D6] px-2 py-1 text-[13px]"
                      />
                      <div className="mt-1 flex gap-2">
                        <Btn onClick={() => saveCommsEdit(i)}>Save</Btn>
                        <Btn variant="ghost" onClick={() => setEditingComms(null)}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 whitespace-pre-line text-[12px] text-[#6B6B6B]">{c.draft}</p>
                  )}
                  <div className="mt-0.5 text-[12px] text-[#6B6B6B]">{c.audience} · {c.channel} · {c.status}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Approval bar */}
        <div className="sticky bottom-0 rounded-lg border border-[#D9D9D6] bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[13px] text-[#3d3d3d]">
              <span className="font-semibold text-[#191919]">{writeCount(plan)} changes proposed</span>
              {p0s.length > 0 && (
                <span className="ml-2 font-semibold text-red-700">
                  · {p0s.length} critical risk detected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Btn onClick={doCancel} disabled={applying}>Cancel</Btn>
              <Btn variant="ghost" onClick={doDelete} disabled={applying} className="text-red-700 hover:text-red-800">Delete</Btn>
              {p0s.length > 0 && (
                <Btn onClick={doResolveRiskFirst} disabled={applying}>Resolve risk first</Btn>
              )}
              <Btn
                variant={p0s.length > 0 ? 'danger' : 'primary'}
                onClick={doApprove}
                disabled={applying || (p0s.length > 0 && !ackRisk)}
              >
                {applying ? 'Applying…' : p0s.length > 0 ? 'Approve with risk' : 'Approve & Apply'}
              </Btn>
            </div>
          </div>
          {p0s.length > 0 && !applying && (
            <label className="mt-2 flex cursor-pointer items-start gap-2 text-[12px] text-[#6B6B6B]">
              <input
                type="checkbox"
                checked={ackRisk}
                onChange={(e) => setAckRisk(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                I acknowledge the P0 capacity risk above and take responsibility for approving this
                change anyway. The risk will be recorded in the impact report.
              </span>
            </label>
          )}
          {applyError && (
            <p className="mt-2 text-[13px] font-medium text-red-700">{applyError}</p>
          )}
        </div>
      </div>
    );
  };

  // ----- execution / done -----
  const renderExecuting = () => (
    <div className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-6">
      <SectionTitle>Applying changes…</SectionTitle>
      <ul className="space-y-2">
        {execLog.map((l, i) => (
          <li key={i} className="flex items-center gap-2 text-[13px] text-[#3d3d3d]">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">✓</span>
            {l}
          </li>
        ))}
      </ul>
    </div>
  );

  const renderDone = (c: ChangeRequest) => (
    <div className="space-y-4">
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4">
        <div className="text-[15px] font-semibold text-green-900">Changes applied</div>
        <p className="mt-1 text-[13px] text-green-800">
          {c.applyResult
            ? `${c.applyResult.updated} records updated, ${c.applyResult.created.length} created in Notion.`
            : 'Applied.'}{' '}
          {fmtDateTime(c.appliedAt ?? '')} · Approved by {c.approvedBy}
        </p>
      </div>
      <div className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-3">
        <SectionTitle>Execution</SectionTitle>
        <ul className="space-y-2">
          {execLog.map((l, i) => (
            <li key={i} className="flex items-center gap-2 text-[13px] text-[#3d3d3d]">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">✓</span>
              {l}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <Btn variant="primary" onClick={() => onViewImpact(c.id)}>View impact report</Btn>
          {c.rollback && (c.rollback.updates.length > 0 || c.rollback.createdIds.length > 0) && (
            <Btn variant="ghost" onClick={doUndo} className="text-red-700 hover:text-red-800">Undo change</Btn>
          )}
        </div>
        <p className="mt-2 text-[12px] text-[#6B6B6B]">Undo reverts the Notion updates and archives created records. The requester or admin can undo.</p>
      </div>
    </div>
  );

  // ----- page -----
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold tracking-tight text-[#191919]">Changes</h1>
        {!showNew && !active && <Btn variant="primary" onClick={() => setShowNew(true)}>New change</Btn>}
      </div>

      {showNew && !active && (
        <section className="rounded-lg border border-[#E8E8E6] bg-white px-4 py-4">
          <SectionTitle>New change</SectionTitle>
          {changes.find((c) => c.status === 'draft' && c.cancelNote) && (
            <p className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
              {changes.find((c) => c.status === 'draft' && c.cancelNote)?.cancelNote}
            </p>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder="Describe an operational change…"
            className="w-full rounded-md border border-[#D9D9D6] px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none"
          />
          <div className="mt-1 text-[12px] text-[#6B6B6B]">
            Example: “Move all sessions from Main Audi to Seminar Hall B.”
          </div>
          {parseError && <p className="mt-2 text-[13px] font-medium text-red-700">{parseError}</p>}
          <div className="mt-3 flex gap-2">
            <Btn variant="primary" onClick={startAnalyze} disabled={parsing || !input.trim()}>
              {parsing ? 'Analyzing…' : 'Analyze change'}
            </Btn>
            <Btn variant="ghost" onClick={() => { setShowNew(false); setInput(''); setParseError(''); }}>
              Cancel
            </Btn>
          </div>
        </section>
      )}

      {active?.status === 'analyzed' && renderAnalysis(active)}
      {active?.status === 'applying' && renderExecuting()}
      {active?.status === 'applied' && renderDone(active)}
      {active?.status === 'undone' && (
        <div className="rounded-lg border border-[#E8E8E6] bg-[#F5F5F3] px-4 py-4">
          <div className="text-[15px] font-semibold text-[#191919]">Change undone</div>
          <p className="mt-1 text-[13px] text-[#6B6B6B]">
            Reverted {fmtDateTime(active.undoneAt ?? '')}. Notion records restored to previous values; created records archived.
          </p>
        </div>
      )}

      {!active && !showNew && (
        <section>
          {history.length === 0 ? (
            <EmptyState
              title="No changes yet"
              body="Describe an operational change in plain language. Sanchalan analyzes the impact, surfaces risks, and applies the plan to Notion only after your approval."
              action={<Btn variant="primary" onClick={() => setShowNew(true)}>New change</Btn>}
            />
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#E8E8E6] bg-white">
              {history.map((c) => (
                <button
                  key={c.id}
                  onClick={() => (c.status === 'analyzed' || c.status === 'applied' || c.status === 'undone' ? setActiveId(c.id) : null)}
                  className="flex w-full items-center justify-between gap-3 border-b border-[#F0EFEC] px-4 py-3 text-left last:border-0 hover:bg-[#F5F5F3]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-[#191919]">{c.input}</div>
                    <div className="mt-0.5 text-[12px] text-[#6B6B6B]">{fmtDateTime(c.createdAt)}</div>
                  </div>
                  <Badge
                    tone={
                      c.status === 'applied' ? 'green'
                      : c.status === 'analyzed' ? 'amber'
                      : c.status === 'cancelled' ? 'gray'
                      : c.status === 'undone' ? 'gray' : 'blue'
                    }
                  >
                    {c.status === 'analyzed' ? 'Awaiting approval' : c.status === 'undone' ? 'Undone' : c.status}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {active && (active.status === 'analyzed' || active.status === 'applied' || active.status === 'undone') && (
        <Btn variant="ghost" onClick={() => setActiveId(null)}>← Back to changes</Btn>
      )}
    </div>
  );
}
