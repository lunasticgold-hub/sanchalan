// Sanchalan app shell sidebar — Notion-inspired calm navigation.
// Sections, subtle active states, event context. No visual noise.

import { useState } from 'react';
import { cx } from './ui';
import Logo from './Logo';

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

const PRIMARY: { view: View; label: string }[] = [
  { view: 'overview', label: 'Overview' },
  { view: 'changes', label: 'Changes' },
  { view: 'inbox', label: 'Inbox' },
  { view: 'risks', label: 'Risks' },
  { view: 'impacts', label: 'Impact Reports' },
];

const WORKSPACE: { view: View; label: string; desc: string }[] = [
  { view: 'live', label: 'Live Operations', desc: 'Event-day command view' },
  { view: 'preflight', label: 'Pre-flight', desc: 'Readiness checklist' },
  { view: 'simulate', label: 'Simulate', desc: 'What-if scenarios' },
];

const DATA: { view: View; label: string }[] = [
  { view: 'sessions', label: 'Sessions' },
  { view: 'attendees', label: 'Attendees' },
  { view: 'venues', label: 'Venues' },
  { view: 'volunteers', label: 'Volunteers' },
  { view: 'speakers', label: 'Speakers' },
  { view: 'sponsors', label: 'Sponsors' },
  { view: 'tasks', label: 'Tasks' },
  { view: 'comms', label: 'Communications' },
];

function NavItem({
  active,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'mb-px flex w-full items-center justify-between rounded-[6px] px-2.5 py-[7px] text-[13px] transition-quiet',
        active
          ? 'bg-[#EFEFEA] font-medium text-[#191919]'
          : 'text-[#6B6B6B] hover:bg-[#F5F5F3] hover:text-[#191919]',
      )}
    >
      <span className="truncate">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800">
          {badge}
        </span>
      )}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 mt-4 px-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#9B9B9B]">
      {children}
    </div>
  );
}

export default function Sidebar({
  view,
  setView,
  connected,
  pendingCount,
  events,
  activeEventId,
  onSelectEvent,
  onAddEvent,
  userEmail,
  onSignOut,
  collapsed,
  onToggleCollapse,
}: {
  view: View;
  setView: (v: View) => void;
  connected: boolean;
  pendingCount: number;
  events: { id: string; name: string }[];
  activeEventId: string;
  onSelectEvent: (id: string) => void;
  onAddEvent: () => void;
  userEmail?: string | null;
  onSignOut?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Workspace header */}
      <div className="px-3 pb-2 pt-3">
        <div className="flex items-center gap-2 px-1">
          <Logo size={22} />
          <span className="text-[14px] font-semibold tracking-tight text-[#191919]">Sanchalan</span>
        </div>
        {/* Event switcher */}
        <div className="relative mt-2.5">
          <select
            value={activeEventId}
            onChange={(e) => {
              if (e.target.value === '__add__') onAddEvent();
              else onSelectEvent(e.target.value);
              setMobileOpen(false);
            }}
            aria-label="Switch event"
            className="w-full appearance-none truncate rounded-[6px] border border-[#E8E8E6] bg-white px-2 py-1.5 pr-7 text-[12.5px] font-medium text-[#191919] transition-quiet hover:border-[#D9D9D6] focus:border-[#191919] focus:outline-none"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
            <option value="__add__">+ New event…</option>
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#9B9B9B]" aria-hidden>▾</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2 slim-scroll" aria-label="Primary">
        {PRIMARY.map((n) => (
          <NavItem
            key={n.view}
            active={view === n.view}
            label={n.label}
            badge={n.view === 'changes' ? pendingCount : undefined}
            onClick={() => { setView(n.view); setMobileOpen(false); }}
          />
        ))}

        <SectionLabel>Workspace</SectionLabel>
        {WORKSPACE.map((n) => (
          <NavItem
            key={n.view}
            active={view === n.view}
            label={n.label}
            onClick={() => { setView(n.view); setMobileOpen(false); }}
          />
        ))}

        <SectionLabel>Event data</SectionLabel>
        {DATA.map((n) => (
          <NavItem
            key={n.view}
            active={view === n.view}
            label={n.label}
            onClick={() => { setView(n.view); setMobileOpen(false); }}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#E8E8E6] px-2 py-2">
        <button
          onClick={() => { setView('notion'); setMobileOpen(false); }}
          className={cx(
            'flex w-full items-center gap-2 rounded-[6px] px-2.5 py-[7px] text-left text-[13px] transition-quiet',
            view === 'notion' ? 'bg-[#EFEFEA] font-medium text-[#191919]' : 'text-[#6B6B6B] hover:bg-[#F5F5F3] hover:text-[#191919]',
          )}
        >
          <span
            className={cx('h-2 w-2 shrink-0 rounded-full', connected ? 'bg-green-500' : 'bg-amber-500')}
            aria-hidden
          />
          <span className="truncate">{connected ? 'Notion connected' : 'Connect Notion'}</span>
        </button>
      </div>
      <div className="border-t border-[#E8E8E6] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8E8E6] text-[10px] font-semibold text-[#6B6B6B]" aria-hidden>
            {(userEmail ?? 'S').slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12.5px] text-[#6B6B6B]">{userEmail ?? 'Signed in'}</span>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
              className="rounded p-1 text-[#9B9B9B] hover:bg-[#F5F5F3] hover:text-[#191919] transition-quiet"
            >
              «
            </button>
          )}
        </div>
        {onSignOut && userEmail && (
          <button onClick={onSignOut} className="mt-1.5 text-[12px] font-medium text-[#9B9B9B] hover:text-[#191919] transition-quiet">
            Sign out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="fixed left-3 top-3 z-40 rounded-[6px] border border-[#E8E8E6] bg-white p-2 text-[#191919] shadow-sm md:hidden"
      >
        <span aria-hidden>☰</span>
      </button>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute left-0 top-0 h-full w-64 bg-[#FBFBFA] shadow-xl">
            {sidebar}
          </div>
        </div>
      )}
      {/* Desktop */}
      <aside
        className={cx(
          'hidden h-screen shrink-0 flex-col border-r border-[#E8E8E6] bg-[#FBFBFA] transition-all md:flex',
          collapsed ? 'w-14' : 'w-60',
        )}
        aria-label="Sidebar"
      >
        {collapsed ? (
          <div className="flex h-full flex-col items-center py-3">
            <Logo size={22} />
            <button
              onClick={onToggleCollapse}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="mt-4 rounded p-1.5 text-[#9B9B9B] hover:bg-[#F5F5F3] hover:text-[#191919] transition-quiet"
            >
              »
            </button>
          </div>
        ) : (
          sidebar
        )}
      </aside>
    </>
  );
}
