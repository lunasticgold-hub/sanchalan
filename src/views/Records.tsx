// Record tables: dense, sortable tables for sessions, tasks, volunteers,
// venues, communications. Row click opens a detail drawer with relationships.

import { useMemo, useState } from 'react';
import type { Records } from '../lib/types';
import { EST_ATTENDEES } from '../lib/engine';
import ProvenanceBadge from '../components/ProvenanceBadge';
import type { Maps } from './Changes';
import {
  Badge, cx, fmtDate, fmtTime, prioTone, statusTone, td, th, tr,
} from '../components/ui';

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

function sessionRisk(records: Records, sessionId: string): string | null {
  const s = records.sessions.find((s) => s.id === sessionId);
  const v = records.venues.find((v) => v.id === s?.venueId);
  if (v && v.capacity < EST_ATTENDEES) return 'Over capacity';
  return null;
}

export function SessionsView({ records, maps }: { records: Records; maps: Maps }) {
  const [sel, setSel] = useState<string | null>(null);
  const [venueFilter, setVenueFilter] = useState('all');
  const rows = useMemo(() => {
    const rs = [...records.sessions].sort((a, b) => a.starts.localeCompare(b.starts));
    return venueFilter === 'all' ? rs : rs.filter((s) => s.venueId === venueFilter);
  }, [records, venueFilter]);
  const s = sel ? records.sessions.find((x) => x.id === sel) : null;
  const sVols = s ? records.volunteers.filter((v) => v.sessionIds.includes(s.id)) : [];
  const sTasks = s ? records.tasks.filter((t) => t.sessionId === s.id) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold tracking-tight">Sessions</h1>
        <select
          value={venueFilter}
          onChange={(e) => setVenueFilter(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[13px]"
        >
          <option value="all">All venues</option>
          {records.venues.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Session</th><th className={th}>Time</th><th className={th}>Venue</th>
              <th className={th}>Speaker</th><th className={th}>Format</th><th className={th}>Status</th>
              <th className={th}>Volunteers</th><th className={th}>Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => {
              const risk = sessionRisk(records, x.id);
              const vols = records.volunteers.filter((v) => v.sessionIds.includes(x.id));
              return (
                <tr key={x.id} className={cx(tr, 'cursor-pointer')} onClick={() => setSel(x.id)}>
                  <td className={cx(td, 'font-medium')}>{x.name}</td>
                  <td className={cx(td, 'whitespace-nowrap font-mono text-[12px]')}>{fmtTime(x.starts)}–{fmtTime(x.ends)}</td>
                  <td className={td}>{maps.venue.get(x.venueId)}</td>
                  <td className={td}>{x.speaker}</td>
                  <td className={td}>{x.format}</td>
                  <td className={td}><Badge tone={statusTone(x.status)}>{x.status}</Badge></td>
                  <td className={td}>{vols.map((v) => v.name).join(', ') || '—'}</td>
                  <td className={td}>{risk ? <Badge tone="red">{risk}</Badge> : <span className="text-gray-400">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {s && (
        <Drawer title={s.name} onClose={() => setSel(null)}>
          <Rel label="Session" value={`${fmtTime(s.starts)}–${fmtTime(s.ends)} · ${s.format}`} />
          <Rel label="Venue" value={maps.venue.get(s.venueId)} />
          <Rel label="Expected attendees" value={String(EST_ATTENDEES)} />
          <Rel label="Speaker" value={s.speaker} />
          <Rel label="Status" value={<Badge tone={statusTone(s.status)}>{s.status}</Badge>} />
          <Rel label="Volunteers" value={sVols.length ? sVols.map((v) => `${v.name} (${v.role})`).join(', ') : '—'} />
          <Rel label="Tasks" value={sTasks.length ? sTasks.map((t) => t.title).join('; ') : '—'} />
        </Drawer>
      )}
    </div>
  );
}

export function TasksView({ records, maps }: { records: Records; maps: Maps }) {
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState<string | null>(null);
  const rows = filter === 'all' ? records.tasks : records.tasks.filter((t) => t.status === filter);
  const t = sel ? records.tasks.find((x) => x.id === sel) : null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold tracking-tight">Tasks</h1>
        <div className="flex gap-1">
          {['all', 'Todo', 'In progress', 'Blocked', 'Done'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cx(
                'rounded-md px-2.5 py-1 text-[12px] font-semibold',
                filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50',
              )}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Task</th><th className={th}>Session</th><th className={th}>Owner</th>
              <th className={th}>Due</th><th className={th}>Status</th><th className={th}>Priority</th><th className={th}>Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id} className={cx(tr, 'cursor-pointer')} onClick={() => setSel(x.id)}>
                <td className={cx(td, 'font-medium')}>{x.title}</td>
                <td className={td}>{maps.session.get(x.sessionId) ?? '—'}</td>
                <td className={td}>{maps.vol.get(x.ownerId) ?? 'Unassigned'}</td>
                <td className={cx(td, 'whitespace-nowrap')}>{fmtDate(x.due)}</td>
                <td className={td}><Badge tone={statusTone(x.status)}>{x.status}</Badge></td>
                <td className={td}><Badge tone={prioTone(x.priority)}>{x.priority}</Badge></td>
                <td className={td}><ProvenanceBadge source={x.source} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {t && (
        <Drawer title={t.title} onClose={() => setSel(null)}>
          <Rel label="Session" value={maps.session.get(t.sessionId) ?? '—'} />
          <Rel label="Owner" value={maps.vol.get(t.ownerId) ?? 'Unassigned'} />
          <Rel label="Due" value={fmtDate(t.due)} />
          <Rel label="Status" value={<Badge tone={statusTone(t.status)}>{t.status}</Badge>} />
          <Rel label="Priority" value={<Badge tone={prioTone(t.priority)}>{t.priority}</Badge>} />
          <Rel label="Source" value={<ProvenanceBadge source={t.source} />} />
          <Rel label="Detail" value={t.detail} />
        </Drawer>
      )}
    </div>
  );
}

export function VolunteersView({ records, maps }: { records: Records; maps: Maps }) {
  const [sel, setSel] = useState<string | null>(null);
  const v = sel ? records.volunteers.find((x) => x.id === sel) : null;
  const vTasks = v ? records.tasks.filter((t) => t.ownerId === v.id) : [];
  return (
    <div className="space-y-4">
      <h1 className="text-[20px] font-semibold tracking-tight">Volunteers</h1>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Name</th><th className={th}>Role</th><th className={th}>Assigned sessions</th>
              <th className={th}>Shift</th><th className={th}>Skills</th><th className={th}>Contact</th>
            </tr>
          </thead>
          <tbody>
            {records.volunteers.map((x) => (
              <tr key={x.id} className={cx(tr, 'cursor-pointer')} onClick={() => setSel(x.id)}>
                <td className={cx(td, 'font-medium')}>{x.name}</td>
                <td className={td}>{x.role}</td>
                <td className={td}>{x.sessionIds.map((id) => maps.session.get(id)).join(', ') || '—'}</td>
                <td className={td}>{x.shift}</td>
                <td className={td}>{x.skills.join(', ')}</td>
                <td className={cx(td, 'whitespace-nowrap font-mono text-[12px]')}>{x.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {v && (
        <Drawer title={v.name} onClose={() => setSel(null)}>
          <Rel label="Role" value={v.role} />
          <Rel label="Shift" value={v.shift} />
          <Rel label="Contact" value={v.phone} />
          <Rel label="Skills" value={v.skills.join(', ')} />
          <Rel label="Assigned sessions" value={v.sessionIds.map((id) => maps.session.get(id)).join(', ') || '—'} />
          <Rel label="Assigned tasks" value={vTasks.length ? vTasks.map((t) => t.title).join('; ') : '—'} />
        </Drawer>
      )}
    </div>
  );
}

export function VenuesView({ records }: { records: Records }) {
  const [sel, setSel] = useState<string | null>(null);
  const v = sel ? records.venues.find((x) => x.id === sel) : null;
  const bookings = (id: string) => records.sessions.filter((s) => s.venueId === id);
  return (
    <div className="space-y-4">
      <h1 className="text-[20px] font-semibold tracking-tight">Venues</h1>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Venue</th><th className={th}>Capacity</th><th className={th}>Location</th>
              <th className={th}>Equipment</th><th className={th}>Current bookings</th><th className={th}>Availability</th>
            </tr>
          </thead>
          <tbody>
            {records.venues.map((x) => {
              const b = bookings(x.id);
              return (
                <tr key={x.id} className={cx(tr, 'cursor-pointer')} onClick={() => setSel(x.id)}>
                  <td className={cx(td, 'font-medium')}>{x.name}</td>
                  <td className={td}>
                    {x.capacity}
                    {x.capacity < EST_ATTENDEES && <Badge tone="red" className="ml-2">Under {EST_ATTENDEES}</Badge>}
                  </td>
                  <td className={td}>{x.location}</td>
                  <td className={td}>{x.facilities.join(', ')}</td>
                  <td className={td}>{b.length}</td>
                  <td className={td}>
                    <Badge tone={b.length ? 'amber' : 'green'}>{b.length ? 'Booked' : 'Available'}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {v && (
        <Drawer title={v.name} onClose={() => setSel(null)}>
          <Rel label="Capacity" value={String(v.capacity)} />
          <Rel label="Availability" value={bookings(v.id).length ? 'Booked' : 'Available'} />
          <Rel label="Location" value={v.location} />
          <Rel label="Equipment" value={v.facilities.join(', ')} />
          <Rel label="Current bookings" value={bookings(v.id).map((s) => `${s.name} (${fmtTime(s.starts)}–${fmtTime(s.ends)})`).join('; ') || '—'} />
        </Drawer>
      )}
    </div>
  );
}

export function CommsView({ records }: { records: Records }) {
  const [sel, setSel] = useState<string | null>(null);
  const c = sel ? records.comms.find((x) => x.id === sel) : null;
  return (
    <div className="space-y-4">
      <h1 className="text-[20px] font-semibold tracking-tight">Communications</h1>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Message</th><th className={th}>Audience</th><th className={th}>Channel</th>
              <th className={th}>Related event</th><th className={th}>Status</th><th className={th}>Source</th>
            </tr>
          </thead>
          <tbody>
            {records.comms.map((x) => (
              <tr key={x.id} className={cx(tr, 'cursor-pointer')} onClick={() => setSel(x.id)}>
                <td className={cx(td, 'font-medium')}>{x.name}</td>
                <td className={td}>{x.audience}</td>
                <td className={td}>{x.channel}</td>
                <td className={td}>{records.events.find((e) => e.id === x.eventId)?.name ?? '—'}</td>
                <td className={td}><Badge tone={statusTone(x.status)}>{x.status}</Badge></td>
                <td className={td}><ProvenanceBadge source={x.source} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {c && (
        <Drawer title={c.name} onClose={() => setSel(null)}>
          <Rel label="Audience" value={c.audience} />
          <Rel label="Channel" value={c.channel} />
          <Rel label="Status" value={<Badge tone={statusTone(c.status)}>{c.status}</Badge>} />
          <Rel label="Source" value={<ProvenanceBadge source={c.source} />} />
          <Rel label="Draft" value={<span className="whitespace-pre-line">{c.draft}</span>} />
        </Drawer>
      )}
    </div>
  );
}
