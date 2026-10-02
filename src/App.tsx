import { useEffect, useMemo, useState } from 'react';
import ProvenanceBadge from './components/ProvenanceBadge';
import { applyTimeShift, applyVenueChange } from './lib/engine';
import { applyPlan, askQuestion, fetchAllRecords, parseUpdate } from './lib/api';
import type { ImpactPlan, ParsedChange, Records, Task } from './lib/types';

type Role = 'ops' | 'volunteer' | 'leadership';
type Tab = 'dash' | 'ops' | 'ask';

const fmtT = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
};

const statusColor: Record<string, string> = {
  Done: 'bg-emerald-100 text-emerald-800', Ready: 'bg-emerald-100 text-emerald-800',
  'In progress': 'bg-blue-100 text-blue-800', Scheduled: 'bg-slate-200 text-slate-700',
  Todo: 'bg-slate-200 text-slate-700', Blocked: 'bg-red-100 text-red-800',
  Draft: 'bg-amber-100 text-amber-800', Approved: 'bg-blue-100 text-blue-800',
  Sent: 'bg-emerald-100 text-emerald-800', Planning: 'bg-violet-100 text-violet-800',
  Live: 'bg-emerald-100 text-emerald-800', Wrapped: 'bg-slate-200 text-slate-700',
};
const prioColor: Record<string, string> = {
  P0: 'bg-red-600 text-white', P1: 'bg-amber-500 text-white', P2: 'bg-slate-400 text-white',
};
const chip = (t: string, m: Record<string, string>) => (
  <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${m[t] ?? 'bg-slate-200 text-slate-700'}`}>{t}</span>
);

export default function App() {
  const [records, setRecords] = useState<Records | null>(null);
  const [demo, setDemo] = useState(false);
  const [role, setRole] = useState<Role>('ops');
  const [tab, setTab] = useState<Tab>('dash');
  const [loading, setLoading] = useState(true);

  // Ops flow
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<(ParsedChange & { via?: string }) | null>(null);
  const [parsing, setParsing] = useState(false);
  const [plan, setPlan] = useState<ImpactPlan | null>(null);
  const [applyState, setApplyState] = useState<'idle' | 'working' | 'live' | 'offline'>('idle');
  const [applyMsg, setApplyMsg] = useState('');

  // Ask
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ answer: string; citations: { label: string; db: string; pageId: string }[] } | null>(null);
  const [asking, setAsking] = useState(false);

  const [taskFilter, setTaskFilter] = useState('all');

  useEffect(() => {
    fetchAllRecords().then(({ records, demo }) => {
      setRecords(records);
      setDemo(demo);
      setLoading(false);
    });
  }, []);

  const maps = useMemo(() => {
    if (!records) return null;
    return {
      venue: new Map(records.venues.map((v) => [v.id, v.name])),
      session: new Map(records.sessions.map((s) => [s.id, s.name])),
      vol: new Map(records.volunteers.map((v) => [v.id, v.name])),
    };
  }, [records]);

  if (loading || !records || !maps) {
    return <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-600">Loading command center…</div>;
  }

  const event = records.events[0];
  const tasksByStatus = (s: string) => records.tasks.filter((t) => t.status === s).length;
  const filteredTasks = taskFilter === 'all' ? records.tasks : records.tasks.filter((t) => t.status === taskFilter);
  const sortedSessions = [...records.sessions].sort((a, b) => a.starts.localeCompare(b.starts));

  const doParse = async () => {
    if (!input.trim()) return;
    setParsing(true);
    setPlan(null);
    setApplyState('idle');
    setApplyMsg('');
    const p = await parseUpdate(input.trim());
    setParsed(p);
    setParsing(false);
  };

  const doSimulate = () => {
    if (!parsed || parsed.type === 'none') return;
    const p = parsed.type === 'venue_change'
      ? applyVenueChange(records, parsed.params)
      : applyTimeShift(records, parsed.params);
    setPlan(p);
  };

  const doApply = async () => {
    if (!plan) return;
    setApplyState('working');
    try {
      const res = await applyPlan(plan);
      setApplyState('live');
      const urls = res.created.map((c) => `${c.db}: ${c.url}`).join('\n');
      setApplyMsg(`Wrote to Notion: ${res.updated} updated, ${res.created.length} created.\n${urls}`);
    } catch (e: any) {
      if (e?.status === 501) {
        setApplyState('offline');
        setApplyMsg('Connect NOTION_TOKEN to go live — the writes below are exactly what WOULD be applied.');
      } else {
        setApplyState('offline');
        setApplyMsg(`Apply failed: ${e?.message ?? 'unknown error'}`);
      }
    }
  };

  const doAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    const res = await askQuestion(question.trim(), records);
    setAnswer(res);
    setAsking(false);
  };

  const renderPlanWrites = () => {
    if (!plan) return null;
    const rows: { kind: string; db: string; desc: string }[] = [];
    for (const u of plan.updates) {
      const keys = Object.keys(u.props).join(', ');
      rows.push({ kind: 'Update', db: u.db, desc: `${u.pageId} ← ${keys}` });
    }
    for (const t of plan.newTasks) rows.push({ kind: 'Create', db: 'tasks', desc: `${t.title} [${t.priority}]` });
    for (const c of plan.newComms) rows.push({ kind: 'Create', db: 'comms', desc: `${c.name} → ${c.audience} via ${c.channel}` });
    for (const ir of plan.newImpactReports) rows.push({ kind: 'Create', db: 'impactReports', desc: ir.name });
    return (
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
        <div className="bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Notion writes ({rows.length})
        </div>
        <ul className="max-h-56 divide-y divide-slate-100 overflow-auto bg-white text-sm">
          {rows.map((r, i) => (
            <li key={i} className="flex items-start gap-2 px-3 py-1.5">
              <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${r.kind === 'Update' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>{r.kind}</span>
              <span className="font-mono text-[11px] text-slate-400">{r.db}</span>
              <span className="text-slate-700">{r.desc}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderTask = (t: Task) => (
    <div key={t.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">{t.title}</span>
        <div className="flex shrink-0 items-center gap-1.5">
          {chip(t.priority, prioColor)}
          {chip(t.status, statusColor)}
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-slate-500">
          {maps.vol.get(t.ownerId) ?? 'Unassigned'} · {maps.session.get(t.sessionId) ?? '—'} · due {fmtT(t.due)}
        </span>
        <ProvenanceBadge source={t.source} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <div className="text-lg font-bold tracking-tight">Sanchalan <span className="font-normal text-slate-400">· Event Command Center</span></div>
            <div className="text-xs text-slate-400">
              {event ? `${event.name} · ${event.date} · ${event.organizer}` : 'No event loaded'} · Problem ID KBC-NOTION-03
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(['ops', 'volunteer', 'leadership'] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${role === r ? 'bg-white text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                {r === 'ops' ? 'Ops lead' : r === 'volunteer' ? 'Volunteer lead' : 'Leadership'}
              </button>
            ))}
          </div>
        </div>
        {demo && (
          <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-bold uppercase tracking-widest text-slate-900">
            Demo data — connect Notion to go live
          </div>
        )}
        <nav className="mx-auto flex max-w-7xl gap-1 px-4 pb-3">
          {([['dash', 'Dashboard'], ['ops', 'Log ops update'], ['ask', 'Ask']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-t-lg px-4 py-1.5 text-sm font-semibold ${tab === t ? 'bg-slate-100 text-slate-900' : 'text-slate-300 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4">
        {tab === 'dash' && (
          <div className="space-y-4">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                ['Sessions', String(records.sessions.length)],
                ['Tasks open', String(records.tasks.filter((t) => t.status !== 'Done').length)],
                ['Tasks blocked', String(tasksByStatus('Blocked'))],
                ['Volunteers', String(records.volunteers.length)],
                ['Comms drafts', String(records.comms.filter((c) => c.status === 'Draft').length)],
              ].map(([label, val]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="text-2xl font-bold">{val}</div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
                </div>
              ))}
            </div>

            {/* Risk alerts (from last simulation) */}
            {plan && plan.risks.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <div className="text-sm font-bold text-red-800">Risk alerts — last simulation</div>
                <ul className="mt-1 space-y-1 text-sm text-red-700">
                  {plan.risks.map((r, i) => (
                    <li key={i} className="flex gap-2"><span>{chip(r.level, prioColor)}</span><span>{r.text}</span></li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              {/* Timeline */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Session timeline</h2>
                <div className="space-y-2">
                  {sortedSessions.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                      <div className="w-24 shrink-0 font-mono text-xs text-slate-600">{fmtT(s.starts)}–{fmtT(s.ends)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-slate-500">{maps.venue.get(s.venueId)} · {s.format}{s.speaker !== '—' ? ` · ${s.speaker}` : ''}</div>
                      </div>
                      {chip(s.status, statusColor)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Tasks</h2>
                  <div className="flex gap-1">
                    {['all', 'Todo', 'In progress', 'Blocked', 'Done'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setTaskFilter(f)}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${taskFilter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="max-h-96 space-y-2 overflow-auto">{filteredTasks.map(renderTask)}</div>
              </div>
            </div>

            {/* Volunteers + Comms (role-gated) */}
            {(role === 'ops' || role === 'volunteer') && (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Volunteers</h2>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {records.volunteers.map((v) => (
                    <div key={v.id} className="rounded-lg border border-slate-200 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{v.name}</span>
                        <span className="text-[11px] text-slate-500">{v.role} · {v.shift}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">Skills: {v.skills.join(', ')}</div>
                      <div className="text-xs text-slate-500">Sessions: {v.sessionIds.map((id) => maps.session.get(id)).join(', ') || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(role === 'ops' || role === 'leadership') && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Comms log</h2>
                  <div className="space-y-2">
                    {records.comms.map((c) => (
                      <div key={c.id} className="rounded-lg border border-slate-200 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{c.name}</span>
                          <div className="flex items-center gap-1.5">{chip(c.status, statusColor)}<ProvenanceBadge source={c.source} /></div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{c.audience} · {c.channel}</div>
                        <p className="mt-1 text-xs text-slate-600">{c.draft}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Impact reports</h2>
                  <div className="space-y-2">
                    {records.impactReports.map((ir) => (
                      <div key={ir.id} className="rounded-lg border border-slate-200 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{ir.name}</span>
                          <ProvenanceBadge source={ir.source} />
                        </div>
                        <div className="mt-1 text-xs text-slate-500">Trigger: {ir.trigger}</div>
                        <p className="mt-1 text-xs text-slate-600">{ir.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'ops' && (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Log ops update</h2>
              <p className="mt-1 text-xs text-slate-500">Type what changed — e.g. “Move all sessions from Main Audi to Outdoor Plaza” or “Delay everything by 30 minutes”.</p>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                placeholder="Move all sessions from Main Audi to Outdoor Plaza"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={doParse}
                  disabled={parsing || !input.trim()}
                  className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {parsing ? 'Parsing…' : 'Parse'}
                </button>
                {parsed && parsed.type !== 'none' && (
                  <button onClick={doSimulate} className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-slate-900">
                    Simulate impact
                  </button>
                )}
                {plan && (
                  <button
                    onClick={doApply}
                    disabled={applyState === 'working'}
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    {applyState === 'working' ? 'Applying…' : 'Apply to Notion'}
                  </button>
                )}
              </div>

              {parsed && (
                <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                  parsed: {JSON.stringify(parsed)}
                </div>
              )}

              {plan && (
                <div className="mt-3 rounded-lg border border-slate-200 p-3">
                  <div className="text-sm font-bold">Blast radius</div>
                  <p className="mt-1 text-sm text-slate-700">{plan.summary}</p>
                  {plan.risks.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {plan.risks.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm"><span>{chip(r.level, prioColor)}</span><span>{r.text}</span></li>
                      ))}
                    </ul>
                  )}
                  {plan.newTasks.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">New tasks</div>
                      <div className="mt-1 space-y-1.5">{plan.newTasks.map((t, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 rounded bg-slate-50 px-2 py-1.5 text-sm">
                          <span>{chip(t.priority, prioColor)} <span className="ml-1 font-medium">{t.title}</span></span>
                          <ProvenanceBadge source={t.source} />
                        </div>
                      ))}</div>
                    </div>
                  )}
                  {plan.newComms.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">New comms drafts</div>
                      {plan.newComms.map((c, i) => (
                        <div key={i} className="mt-1 rounded bg-slate-50 px-2 py-1.5 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{c.name}</span>
                            <ProvenanceBadge source={c.source} />
                          </div>
                          <p className="mt-0.5 whitespace-pre-line text-xs text-slate-600">{c.draft}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {renderPlanWrites()}
                </div>
              )}

              {applyMsg && (
                <div className={`mt-3 whitespace-pre-line rounded-lg px-3 py-2 text-sm ${applyState === 'live' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                  {applyMsg}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'ask' && (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Ask the command center</h2>
              <div className="mt-2 flex gap-2">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && doAsk()}
                  placeholder="Which volunteers are on stage duty?"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-900 focus:outline-none"
                />
                <button onClick={doAsk} disabled={asking || !question.trim()} className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40">
                  {asking ? '…' : 'Ask'}
                </button>
              </div>
              {answer && (
                <div className="mt-3 rounded-lg bg-slate-50 p-3">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">{answer.answer}</pre>
                  {answer.citations.length > 0 && (
                    <div className="mt-2 border-t border-slate-200 pt-2">
                      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Sources</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {answer.citations.map((c, i) => (
                          <span key={i} className="rounded-full bg-white px-2 py-0.5 font-mono text-[11px] text-slate-600 ring-1 ring-slate-200">
                            [{i + 1}] {c.db}/{c.label.slice(0, 28)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-6 text-center text-[11px] text-slate-400">
        Sanchalan · Kaun Banega Codepati 2026 (KBC-NOTION-03) · Notion is the system of record — every write lands in the live databases
      </footer>
    </div>
  );
}
