// Sanchalan — operations shell.
// Sidebar nav + views. Notion is the system of record; demo data fallback when offline.

import { useEffect, useMemo, useState } from 'react';
import Sidebar, { type View } from './components/Sidebar';
import Overview from './views/Overview';
import Changes, { type Maps } from './views/Changes';
import { CommsView, SessionsView, TasksView, VenuesView, VolunteersView } from './views/Records';
import ImpactReports from './views/ImpactReports';
import NotionStatus from './views/NotionStatus';
import { fetchAllRecords } from './lib/api';
import type { ChangeRequest, Records } from './lib/types';

const VIEW_TITLES: Record<View, string> = {
  overview: 'Overview',
  changes: 'Changes',
  sessions: 'Sessions',
  tasks: 'Tasks',
  volunteers: 'Volunteers',
  venues: 'Venues',
  comms: 'Communications',
  impacts: 'Impact Reports',
  notion: 'Notion',
};

export default function App() {
  const [records, setRecords] = useState<Records | null>(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [view, setView] = useState<View>('overview');
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [selectedImpactId, setSelectedImpactId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const load = async () => {
    setSyncing(true);
    try {
      const { records, demo } = await fetchAllRecords();
      setRecords(records);
      setDemo(demo);
      setLastSync(new Date());
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const maps: Maps | null = useMemo(() => {
    if (!records) return null;
    return {
      venue: new Map(records.venues.map((v) => [v.id, v.name])),
      session: new Map(records.sessions.map((s) => [s.id, s.name])),
      vol: new Map(records.volunteers.map((v) => [v.id, v.name])),
    };
  }, [records]);

  if (loading || !records || !maps) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa] text-[13px] text-gray-500">
        Loading workspace…
      </div>
    );
  }

  const pendingCount = changes.filter((c) => c.status === 'analyzed').length;

  const goView = (v: View) => {
    if (v !== 'changes') setReviewId(null);
    setView(v);
  };

  const reviewChange = (id: string) => {
    setReviewId(id);
    setView('changes');
  };

  const gotoImpact = (id: string) => {
    setSelectedImpactId(id);
    setView('impacts');
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-gray-900">
      <Sidebar view={view} setView={goView} connected={!demo} pendingCount={pendingCount} />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">
          {demo && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-800">
              Demo data — connect Notion (NOTION_TOKEN) to go live.
            </div>
          )}

          {view === 'overview' && (
            <Overview
              records={records}
              changes={changes}
              setView={setView}
              onReview={(id) => {
                reviewChange(id);
              }}
            />
          )}

          {view === 'changes' && (
            <Changes
              initialActiveId={reviewId}
              records={records}
              maps={maps}
              changes={changes}
              setChanges={setChanges}
              refreshRecords={load}
              onViewImpact={gotoImpact}
            />
          )}

          {view === 'sessions' && <SessionsView records={records} maps={maps} />}
          {view === 'tasks' && <TasksView records={records} maps={maps} />}
          {view === 'volunteers' && <VolunteersView records={records} maps={maps} />}
          {view === 'venues' && <VenuesView records={records} />}
          {view === 'comms' && <CommsView records={records} />}

          {view === 'impacts' && (
            <ImpactReports
              records={records}
              changes={changes}
              maps={maps}
              selectedId={selectedImpactId}
              setSelectedId={setSelectedImpactId}
            />
          )}

          {view === 'notion' && (
            <NotionStatus connected={!demo} lastSync={lastSync} syncing={syncing} onSync={load} />
          )}

          <footer className="mt-10 border-t border-gray-200 pt-4 text-[11px] text-gray-400">
            Sanchalan · Kaun Banega Codepati 2026 (KBC-NOTION-03) · {VIEW_TITLES[view]} · Notion is
            the system of record
          </footer>
        </div>
      </main>
    </div>
  );
}
