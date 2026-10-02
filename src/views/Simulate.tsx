// Scenario Mode: "what if" simulations without writes.
// Plus venue recommendation and volunteer finder (propose → convert to change).

import { useMemo, useState } from 'react';
import type { ImpactPlan, ParsedChange, Records } from '../lib/types';
import { applyGeneralChange, applyTimeShift, applyVenueChange, EST_ATTENDEES } from '../lib/engine';
import { parseUpdate } from '../lib/api';
import { Badge, Btn, EmptyState, SectionTitle, prioTone, td, th, tr } from '../components/ui';

export interface ScenarioResult {
  input: string;
  parsed: ParsedChange & { via?: string };
  plan: ImpactPlan;
}

function ImpactSummary({ plan }: { plan: ImpactPlan }) {
  const counts: Array<[string, number]> = [
    ['Sessions', plan.updates.filter((u) => u.db === 'sessions').length],
    ['Tasks', plan.updates.filter((u) => u.db === 'tasks').length + plan.newTasks.length],
    ['Volunteers', plan.updates.filter((u) => u.db === 'volunteers').length],
    ['Communications', plan.newComms.length],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {counts.map(([l, v]) => (
        <div key={l} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="text-[20px] font-semibold text-gray-900">{v}</div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{l} affected</div>
        </div>
      ))}
    </div>
  );
}

export default function Simulate({
  records,
  onConvert,
}: {
  records: Records;
  onConvert: (s: ScenarioResult) => void;
}) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'scenario' | 'venue' | 'volunteer'>('scenario');

  const analyze = async () => {
    const text = input.trim();
    if (!text) return;
    setBusy(true); setError('');
    try {
      const parsed = await parseUpdate(text);
      if (parsed.type === 'none') { setError('Could not understand that scenario. Describe the change plainly, e.g. "What if the keynote is cancelled?"'); setBusy(false); return; }
      // Handle "what if X is unavailable" phrasing → treat as venue inquiry
      const plan =
        parsed.type === 'venue_change'
          ? applyVenueChange(records, parsed.params)
          : parsed.type === 'time_shift'
            ? applyTimeShift(records, parsed.params)
            : applyGeneralChange(records, parsed.params);
      setResult({ input: text, parsed, plan });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight">Scenario Mode</h1>
        <p className="mt-1 text-[13px] text-gray-500">Ask "what if" — see the impact with zero writes. Convert to a change request when ready.</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {([['scenario', 'What-if analysis'], ['venue', 'Find venue'], ['volunteer', 'Find volunteers']] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-3 py-2 text-[13px] font-medium ${tab === k ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}
          >{l}</button>
        ))}
      </div>

      {tab === 'scenario' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyze()}
              placeholder='e.g. "What if Main Audi is unavailable?"'
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-500 focus:outline-none"
            />
            <Btn variant="primary" onClick={analyze} disabled={busy || !input.trim()}>{busy ? 'Analyzing…' : 'Simulate'}</Btn>
          </div>
          {error && <div className="text-[13px] text-red-600">{error}</div>}
          {result && (
            <div className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-blue-700">Simulation — no changes applied</div>
                <div className="mt-1 text-[14px] text-gray-800">{result.plan.summary}</div>
              </div>
              <ImpactSummary plan={result.plan} />
              {result.plan.risks.length > 0 && (
                <section>
                  <SectionTitle>Risks detected</SectionTitle>
                  <div className="space-y-2">
                    {result.plan.risks.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-md border border-gray-200 bg-white px-3 py-2">
                        <Badge tone={prioTone(r.level)}>{r.level}</Badge>
                        <span className="text-[13px] text-gray-700">{r.text}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <div className="flex gap-2">
                <Btn variant="secondary" onClick={() => { setResult(null); setInput(''); }}>Discard simulation</Btn>
                <Btn variant="primary" onClick={() => onConvert(result)}>Convert to change request</Btn>
              </div>
            </div>
          )}
          {!result && !error && (
            <EmptyState title="No simulation yet" body="Describe a hypothetical change to see its blast radius before committing to anything." />
          )}
        </div>
      )}

      {tab === 'venue' && <VenueFinder records={records} onSimulate={(text) => { setInput(text); setTab('scenario'); }} />}
      {tab === 'volunteer' && <VolunteerFinder records={records} />}
    </div>
  );
}

function VenueFinder({ records, onSimulate }: { records: Records; onSimulate: (text: string) => void }) {
  const [sessionId, setSessionId] = useState(records.sessions[0]?.id ?? '');
  const session = records.sessions.find((s) => s.id === sessionId);
  const currentVenue = records.venues.find((v) => v.id === session?.venueId);
  const candidates = useMemo(() => {
    return records.venues
      .filter((v) => v.id !== session?.venueId)
      .map((v) => {
        const checks: Array<[string, boolean, string]> = [
          ['Capacity', v.capacity >= EST_ATTENDEES, `${v.capacity} seats`],
          ['Equipment', (session?.format === 'Workshop' ? v.facilities.includes('Projector') : true), v.facilities.slice(0, 3).join(', ') || '—'],
        ];
        const others = records.sessions.filter((s) => s.venueId === v.id && s.id !== sessionId);
        checks.push(['Availability', true, others.length ? `${others.length} other booking(s)` : 'No conflicts']);
        return { venue: v, checks, ok: checks.every(([, b]) => b) };
      })
      .sort((a, b) => Number(b.ok) - Number(a.ok));
  }, [records, session, sessionId]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-gray-600">Find a venue for</span>
        <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[13px]">
          {records.sessions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {currentVenue && <span className="text-[13px] text-gray-500">currently: {currentVenue.name}</span>}
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr><th className={th}>Venue</th><th className={th}>Capacity</th><th className={th}>Equipment</th><th className={th}>Availability</th><th className={th}></th></tr>
          </thead>
          <tbody>
            {candidates.map(({ venue: v, checks, ok }) => (
              <tr key={v.id} className={tr}>
                <td className={td}>
                  <span className="font-medium">{v.name}</span>{' '}
                  {ok ? <Badge tone="green">Compatible</Badge> : <Badge tone="amber">Check</Badge>}
                </td>
                <td className={td}>{checks[0][2]}</td>
                <td className={td}>{checks[1][2]}</td>
                <td className={td}>{checks[2][2]}</td>
                <td className={td}>
                  <Btn variant="secondary" onClick={() => onSimulate(`Move ${session?.name ?? 'session'} from ${currentVenue?.name ?? ''} to ${v.name}`)}>
                    Simulate move
                  </Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VolunteerFinder({ records }: { records: Records }) {
  const [role, setRole] = useState('all');
  const [shift, setShift] = useState('all');
  const candidates = useMemo(() => {
    return records.volunteers.filter((v) =>
      (role === 'all' || v.role === role) && (shift === 'all' || v.shift === shift || v.shift === 'Full-day'),
    );
  }, [records, role, shift]);
  const roles = [...new Set(records.volunteers.map((v) => v.role))];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-gray-600">Find volunteers:</span>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[13px]">
          <option value="all">Any role</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={shift} onChange={(e) => setShift(e.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[13px]">
          <option value="all">Any shift</option>
          <option value="Morning">Morning</option>
          <option value="Afternoon">Afternoon</option>
          <option value="Full-day">Full-day</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr><th className={th}>Volunteer</th><th className={th}>Role</th><th className={th}>Shift</th><th className={th}>Workload</th><th className={th}>Skills</th></tr>
          </thead>
          <tbody>
            {candidates.map((v) => {
              const taskCount = records.tasks.filter((t) => t.ownerId === v.id && t.status !== 'Done').length;
              return (
                <tr key={v.id} className={tr}>
                  <td className={td}><span className="font-medium">{v.name}</span></td>
                  <td className={td}>{v.role}</td>
                  <td className={td}>{v.shift}</td>
                  <td className={td}>
                    {taskCount} open tasks{' '}
                    {taskCount >= 5 ? <Badge tone="amber">Loaded</Badge> : <Badge tone="green">Available</Badge>}
                  </td>
                  <td className={td}>{v.skills.join(', ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-gray-500">Assignment requires human approval — propose candidates in a change request before updating Notion.</p>
    </div>
  );
}
