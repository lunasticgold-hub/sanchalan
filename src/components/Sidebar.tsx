// Left application sidebar: logo, workspace, nav, connection status.

import { cx } from './ui';

export type View =
  | 'overview'
  | 'changes'
  | 'sessions'
  | 'tasks'
  | 'volunteers'
  | 'venues'
  | 'comms'
  | 'impacts'
  | 'notion';

const NAV: { view: View; label: string }[] = [
  { view: 'overview', label: 'Overview' },
  { view: 'changes', label: 'Changes' },
  { view: 'sessions', label: 'Sessions' },
  { view: 'tasks', label: 'Tasks' },
  { view: 'volunteers', label: 'Volunteers' },
  { view: 'venues', label: 'Venues' },
  { view: 'comms', label: 'Communications' },
  { view: 'impacts', label: 'Impact Reports' },
];

export default function Sidebar({
  view,
  setView,
  connected,
  pendingCount,
}: {
  view: View;
  setView: (v: View) => void;
  connected: boolean;
  pendingCount: number;
}) {
  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="px-4 pb-3 pt-4">
        <div className="text-[15px] font-bold tracking-tight text-gray-900">Sanchalan</div>
        <div className="mt-0.5 truncate text-[12px] text-gray-500">BBSR Founders Meetup #1</div>
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

      <div className="border-t border-gray-200 px-4 py-3">
        <button
          onClick={() => setView('notion')}
          className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-gray-50"
        >
          <span
            className={cx(
              'h-2 w-2 shrink-0 rounded-full',
              connected ? 'bg-green-500' : 'bg-amber-500',
            )}
          />
          <span className="text-[12px] font-medium text-gray-700">
            {connected ? 'Notion connected' : 'Demo mode'}
          </span>
        </button>
        <div className="mt-2 flex items-center gap-2 px-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-[11px] font-bold text-gray-600">
            AR
          </span>
          <span className="truncate text-[12px] text-gray-600">Abhigyan Rai</span>
        </div>
      </div>
    </aside>
  );
}
