// Entity tables: attendees, speakers, sponsors.
// Dense operational tables with detail drawers, following Records.tsx patterns.

import { useMemo, useState } from 'react';
import type { Records } from '../lib/types';
import type { Maps } from './Changes';
import { Badge, cx, statusTone, td, th, tr } from '../components/ui';

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="text-[15px] font-semibold text-gray-900">{title}</div>
          <button onClick={onClose} className="rounded px-2 py-1 text-[13px] text-gray-500 hover:bg-gray-100">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

function Rel({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 py-2 last:border-0">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-0.5 text-[13px] text-gray-800">{value}</div>
    </div>
  );
}

export function AttendeesView({ records, maps }: { records: Records; maps: Maps }) {
  const [sel, setSel] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const rows = useMemo(() => {
    let rs = [...records.attendees];
    if (filter === 'checked') rs = rs.filter((a) => a.checkin === 'Checked in');
    if (filter === 'missing') rs = rs.filter((a) => a.checkin !== 'Checked in');
    if (filter === 'vip') rs = rs.filter((a) => a.ticket === 'VIP');
    return rs.sort((a, b) => a.name.localeCompare(b.name));
  }, [records, filter]);
  const checked = records.attendees.filter((a) => a.checkin === 'Checked in').length;
  const total = records.attendees.length;
  const vips = records.attendees.filter((a) => a.ticket === 'VIP');
  const vipsMissing = vips.filter((a) => a.checkin !== 'Checked in');
  const a = sel ? records.attendees.find((x) => x.id === sel) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold tracking-tight">Attendees</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[13px]">
          <option value="all">All ({total})</option>
          <option value="checked">Checked in ({checked})</option>
          <option value="missing">Not checked in ({total - checked})</option>
          <option value="vip">VIPs ({vips.length})</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Registered', String(total)],
          ['Checked in', String(checked)],
          ['Not checked in', String(total - checked)],
          ['Check-in rate', total ? `${Math.round((checked / total) * 100)}%` : '—'],
        ].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <div className="text-[20px] font-semibold text-gray-900">{v}</div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{l}</div>
          </div>
        ))}
      </div>

      {vipsMissing.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          {vipsMissing.length} VIP{vipsMissing.length > 1 ? 's' : ''} not checked in: {vipsMissing.map((v) => v.name).join(', ')}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Name</th><th className={th}>Ticket</th><th className={th}>Organization</th>
              <th className={th}>Check-in</th><th className={th}>Sessions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id} className={cx(tr, 'cursor-pointer')} onClick={() => setSel(x.id)}>
                <td className={td}>
                  <span className="font-medium">{x.name}</span>
                  {x.ticket === 'VIP' && <Badge tone="amber" className="ml-2">VIP</Badge>}
                </td>
                <td className={td}>{x.ticket}</td>
                <td className={td}>{x.organization}</td>
                <td className={td}>
                  <Badge tone={x.checkin === 'Checked in' ? 'green' : 'gray'}>{x.checkin}</Badge>
                </td>
                <td className={td}>{x.sessionIds.map((id) => maps.session.get(id) ?? id).join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {a && (
        <Drawer title={a.name} onClose={() => setSel(null)}>
          <Rel label="Ticket" value={a.ticket} />
          <Rel label="Organization" value={a.organization} />
          <Rel label="Check-in" value={<Badge tone={a.checkin === 'Checked in' ? 'green' : 'gray'}>{a.checkin}</Badge>} />
          <Rel label="Sessions" value={a.sessionIds.map((id) => maps.session.get(id) ?? id).join(', ') || '—'} />
          <Rel label="Open in Notion" value={<span className="text-blue-600">Open record →</span>} />
        </Drawer>
      )}
    </div>
  );
}

export function SpeakersView({ records, maps }: { records: Records; maps: Maps }) {
  const [sel, setSel] = useState<string | null>(null);
  const rows = [...records.speakers].sort((a, b) => a.name.localeCompare(b.name));
  const s = sel ? records.speakers.find((x) => x.id === sel) : null;
  const readiness = (sp: (typeof rows)[number]) => {
    const items: [string, boolean][] = [
      ['Confirmed', sp.confirmation === 'Confirmed'],
      ['Bio received', !!sp.bio && sp.bio !== '—'],
      ['AV requirements', !!sp.avRequirements && sp.avRequirements !== '—'],
      ['Arrival confirmed', sp.arrival === 'Confirmed'],
    ];
    return items;
  };

  return (
    <div className="space-y-4">
      <h1 className="text-[20px] font-semibold tracking-tight">Speakers</h1>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Speaker</th><th className={th}>Session</th><th className={th}>Readiness</th>
              <th className={th}>Arrival</th><th className={th}>Confirmation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => {
              const items = readiness(x);
              const missing = items.filter(([, ok]) => !ok).length;
              return (
                <tr key={x.id} className={cx(tr, 'cursor-pointer')} onClick={() => setSel(x.id)}>
                  <td className={td}><span className="font-medium">{x.name}</span></td>
                  <td className={td}>{maps.session.get(x.sessionId) ?? '—'}</td>
                  <td className={td}>
                    {missing === 0
                      ? <Badge tone="green">Ready</Badge>
                      : <Badge tone="amber">{missing} missing</Badge>}
                  </td>
                  <td className={td}>
                    <Badge tone={x.arrival === 'Confirmed' ? 'green' : 'amber'}>{x.arrival}</Badge>
                  </td>
                  <td className={td}><Badge tone={statusTone(x.confirmation)}>{x.confirmation}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {s && (
        <Drawer title={s.name} onClose={() => setSel(null)}>
          <Rel label="Session" value={maps.session.get(s.sessionId) ?? '—'} />
          <div className="border-b border-gray-100 py-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Readiness</div>
            <div className="mt-1 space-y-1">
              {readiness(s).map(([label, ok]) => (
                <div key={label} className="flex items-center gap-2 text-[13px]">
                  <span className={ok ? 'text-green-600' : 'text-amber-600'}>{ok ? '✓' : '⚠'}</span>
                  <span className={ok ? 'text-gray-700' : 'text-gray-900 font-medium'}>{label}{ok ? '' : ' — missing'}</span>
                </div>
              ))}
            </div>
          </div>
          <Rel label="Bio" value={s.bio || '—'} />
          <Rel label="AV requirements" value={s.avRequirements || '—'} />
          <Rel label="Contact" value={s.contact || '—'} />
          <Rel label="Open in Notion" value={<span className="text-blue-600">Open record →</span>} />
        </Drawer>
      )}
    </div>
  );
}

export function SponsorsView({ records }: { records: Records }) {
  const [sel, setSel] = useState<string | null>(null);
  const rows = [...records.sponsors];
  const s = sel ? records.sponsors.find((x) => x.id === sel) : null;

  return (
    <div className="space-y-4">
      <h1 className="text-[20px] font-semibold tracking-tight">Sponsors</h1>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Company</th><th className={th}>Tier</th><th className={th}>Booth</th>
              <th className={th}>Deliverables</th><th className={th}>Payment</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id} className={cx(tr, 'cursor-pointer')} onClick={() => setSel(x.id)}>
                <td className={td}><span className="font-medium">{x.company}</span></td>
                <td className={td}><Badge tone={x.tier === 'Platinum' ? 'blue' : x.tier === 'Gold' ? 'amber' : 'gray'}>{x.tier}</Badge></td>
                <td className={td}><Badge tone={x.booth === 'Confirmed' ? 'green' : 'amber'}>{x.booth}</Badge></td>
                <td className={td}>{x.deliverables.length} received</td>
                <td className={td}><Badge tone={x.payment === 'Paid' ? 'green' : 'amber'}>{x.payment}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {s && (
        <Drawer title={s.company} onClose={() => setSel(null)}>
          <Rel label="Tier" value={s.tier} />
          <Rel label="Contact" value={s.contact} />
          <Rel label="Booth" value={s.booth} />
          <div className="border-b border-gray-100 py-2">
            <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Deliverables</div>
            <div className="mt-1 space-y-1">
              {s.deliverables.map((d) => (
                <div key={d} className="flex items-center gap-2 text-[13px] text-gray-700">
                  <span className="text-green-600">✓</span>{d}
                </div>
              ))}
            </div>
          </div>
          <Rel label="Payment" value={<Badge tone={s.payment === 'Paid' ? 'green' : 'amber'}>{s.payment}</Badge>} />
          <Rel label="Open in Notion" value={<span className="text-blue-600">Open record →</span>} />
        </Drawer>
      )}
    </div>
  );
}
