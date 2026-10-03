// Minimal top bar: breadcrumbs on the left, search + profile on the right.
// Quiet, Notion-inspired. Actions stay contextual in the content area.

import type { View } from './Sidebar';

const VIEW_LABELS: Record<View, string> = {
  overview: 'Overview',
  live: 'Live Operations',
  preflight: 'Pre-flight',
  inbox: 'Inbox',
  attendees: 'Attendees',
  sessions: 'Sessions',
  venues: 'Venues',
  volunteers: 'Volunteers',
  speakers: 'Speakers',
  sponsors: 'Sponsors',
  tasks: 'Tasks',
  comms: 'Communications',
  risks: 'Risks',
  changes: 'Changes',
  simulate: 'Simulate',
  impacts: 'Impact Reports',
  notion: 'Notion Connection',
};

export default function Topbar({
  view,
  eventName,
  onOpenSearch,
  onOpenNotion,
  connected,
  pendingInbox,
}: {
  view: View;
  eventName?: string;
  onOpenSearch: () => void;
  onOpenNotion: () => void;
  connected: boolean;
  pendingInbox?: number;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center justify-between border-b border-[#E8E8E6] bg-[#FBFBFA]/95 px-4 backdrop-blur-sm md:px-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
        <span className="hidden shrink-0 text-[#9B9B9B] sm:inline">Sanchalan</span>
        {eventName && (
          <>
            <span className="hidden shrink-0 text-[#D9D9D6] sm:inline" aria-hidden>/</span>
            <span className="hidden max-w-40 truncate text-[#9B9B9B] sm:inline">{eventName}</span>
          </>
        )}
        <span className="shrink-0 text-[#D9D9D6]" aria-hidden>/</span>
        <span className="truncate font-medium text-[#191919]" aria-current="page">
          {VIEW_LABELS[view] ?? view}
        </span>
      </nav>

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={onOpenSearch}
          className="hidden items-center gap-2 rounded-[6px] border border-[#E8E8E6] bg-white px-2.5 py-1.5 text-[12.5px] text-[#9B9B9B] transition-quiet hover:border-[#D9D9D6] hover:text-[#6B6B6B] sm:flex"
          aria-label="Search (Ctrl+K)"
        >
          <span aria-hidden>⌕</span>
          <span>Search…</span>
          <kbd className="rounded border border-[#E8E8E6] bg-[#F5F5F3] px-1 text-[10px] font-medium">⌘K</kbd>
        </button>
        <button
          onClick={onOpenSearch}
          className="rounded-[6px] p-2 text-[#6B6B6B] hover:bg-[#F5F5F3] hover:text-[#191919] transition-quiet sm:hidden"
          aria-label="Search"
        >
          <span aria-hidden>⌕</span>
        </button>
        {!connected && (
          <button
            onClick={onOpenNotion}
            className="rounded-[6px] bg-amber-50 px-2.5 py-1.5 text-[12.5px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200 transition-quiet hover:bg-amber-100"
          >
            Connect Notion
          </button>
        )}
        {pendingInbox !== undefined && pendingInbox > 0 && (
          <span className="rounded-full bg-[#191919] px-2 py-0.5 text-[11px] font-medium text-white" title={`${pendingInbox} items need attention`}>
            {pendingInbox}
          </span>
        )}
      </div>
    </header>
  );
}
