// Left application sidebar: logo, workspace, nav, connection status.

import { cx } from './ui';

export type View =
  | 'overview'
  | 'live'
  | 'preflight'
  | 'inbox'
  | 'attendees'
  | 'sessions'
  | 'venues'
  | 'volunteers'
  | 'speakers'
  | 'sponsors'
  | 'tasks'
  | 'comms'
  | 'risks'
  | 'changes'
  | 'simulate'
  | 'impacts'
  | 'notion';

const NAV: { view: View; label: string }[] = [
  { view: 'overview', label: 'Overview' },
  { view: 'changes', label: 'Changes' },
  { view: 'inbox', label: 'Inbox' },
  { view: 'risks', label: 'Risks' },
  { view: 'impacts', label: 'Impact Reports' },
];

// Entity + tool views accessible from Overview (not in sidebar)
export const OVERVIEW_VIEWS: { view: View; label: string; desc: string }[] = [
  { view: 'live', label: 'Live Operations', desc: 'Event-day command view' },
  { view: 'preflight', label: 'Pre-flight', desc: 'Readiness checklist' },
  { view: 'simulate', label: 'Simulate', desc: 'What-if scenarios' },
  { view: 'attendees', label: 'Attendees', desc: 'Check-in and registrations' },
  { view: 'sessions', label: 'Sessions', desc: 'Agenda and scheduling' },
  { view: 'venues', label: 'Venues', desc: 'Spaces and capacity' },
  { view: 'volunteers', label: 'Volunteers', desc: 'Team and assignments' },
  { view: 'speakers', label: 'Speakers', desc: 'Lineup and readiness' },
  { view: 'sponsors', label: 'Sponsors', desc: 'Partners and deliverables' },
  { view: 'tasks', label: 'Tasks', desc: 'Work to be done' },
  { view: 'comms', label: 'Communications', desc: 'Announcements and drafts' },
];

export default function Sidebar({
  view,
  setView,
  connected,
  pendingCount,
  events,
  activeEventId,
  onSelectEvent,
  onAddEvent,
}: {
  view: View;
  setView: (v: View) => void;
  connected: boolean;
  pendingCount: number;
  events: { id: string; name: string }[];
  activeEventId: string;
  onSelectEvent: (id: string) => void;
  onAddEvent: () => void;
}) {
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="px-4 pb-3 pt-4">
        <div className="text-[15px] font-bold tracking-tight text-gray-900">Sanchalan</div>
        <div className="relative mt-1">
          <select
            value={activeEventId}
            onChange={(e) => {
              if (e.target.value === '__add__') onAddEvent();
              else onSelectEvent(e.target.value);
            }}
            className="w-full appearance-none truncate rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 pr-7 text-[12px] font-medium text-gray-700 focus:border-gray-400 focus:outline-none"
            title="Switch event"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
            <option value="__add__">+ Add event…</option>
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">▼</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {NAV.map((n) => (
          <button
            key={n.view}
            onClick={() => setView(n.view)}
            className={cx(
              'mb-0.5 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[13px] font-medium',
              view === n.view
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <span>{n.label}</span>
            {n.view === 'changes' && pendingCount > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="border-t border-gray-200 px-2 py-2">
        <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Workspace</div>
        <button
          onClick={() => setView('notion')}
          className={cx(
            'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-[13px] font-medium',
            view === 'notion' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          )}
        >
          <span
            className={cx(
              'h-2 w-2 shrink-0 rounded-full',
              connected ? 'bg-green-500' : 'bg-amber-500',
            )}
          />
          <span>{connected ? 'Notion connected' : 'Connect Notion'}</span>
        </button>
      </div>
      <div className="border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[11px] font-bold text-gray-600">
            AR
          </span>
          <span className="truncate text-[12px] text-gray-600">Abhigyan Rai</span>
        </div>
      </div>
    </aside>
  );
}
