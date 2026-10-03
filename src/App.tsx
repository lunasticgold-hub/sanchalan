// Sanchalan — operations shell.
// Sidebar nav + views. Notion is the system of record; demo data fallback when offline.

import { useEffect, useMemo, useState } from 'react';
import Sidebar, { type View } from './components/Sidebar';
import Overview from './views/Overview';
import Live from './views/Live';
import Preflight from './views/Preflight';
import Inbox from './views/Inbox';
import Changes, { type Maps } from './views/Changes';
import Simulate, { type ScenarioResult } from './views/Simulate';
import { CommsView, SessionsView, TasksView, VenuesView, VolunteersView } from './views/Records';
import { AttendeesView, SpeakersView, SponsorsView } from './views/Entities';
import Risks from './views/Risks';
import ImpactReports from './views/ImpactReports';
import NotionStatus from './views/NotionStatus';
import { fetchAllRecords } from './lib/api';
import type { ChangeRequest, Records } from './lib/types';
import { cx } from './components/ui';
import Auth from './components/Auth';
import { supabase, supabaseConfigured } from './lib/supabase';

const VIEW_TITLES: Record<View, string> = {
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
  notion: 'Notion',
};

const OPERATOR = 'Abhigyan Rai';
const uid = () => Math.random().toString(36).slice(2, 10);

// Command palette: Cmd/Ctrl+K global search across entities.
function CommandPalette({ records, onGo, onClose }: { records: Records; onGo: (v: View) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const out: Array<{ label: string; sub: string; view: View }> = [];
    const push = (arr: Array<{ id: string; name?: string; title?: string; company?: string }>, label: string, view: View) => {
      for (const r of arr) {
        const name = r.name ?? r.title ?? r.company ?? '';
        if (name.toLowerCase().includes(t)) out.push({ label: name, sub: label, view });
        if (out.length >= 12) break;
      }
    };
    push(records.sessions, 'Session', 'sessions');
    push(records.venues, 'Venue', 'venues');
    push(records.volunteers, 'Volunteer', 'volunteers');
    push(records.speakers, 'Speaker', 'speakers');
    push(records.sponsors, 'Sponsor', 'sponsors');
    push(records.tasks, 'Task', 'tasks');
    push(records.attendees, 'Attendee', 'attendees');
    push(records.comms, 'Communication', 'comms');
    return out.slice(0, 12);
  }, [q, records]);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute left-1/2 top-24 w-full max-w-lg -translate-x-1/2" onClick={(e) => e.stopPropagation()}>
        <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xl">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter' && results[0]) { onGo(results[0].view); onClose(); }
            }}
            placeholder="Search sessions, venues, people, tasks…"
            className="w-full border-b border-gray-200 px-4 py-3 text-[14px] focus:outline-none"
          />
          <div className="max-h-72 overflow-y-auto py-1">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => { onGo(r.view); onClose(); }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-50"
              >
                <span className="text-[14px] font-medium text-gray-900">{r.label}</span>
                <span className="text-[11px] uppercase tracking-wide text-gray-400">{r.sub}</span>
              </button>
            ))}
            {q.trim() && results.length === 0 && (
              <div className="px-4 py-3 text-[13px] text-gray-500">No matches.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [palette, setPalette] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string>('');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [customEvents, setCustomEvents] = useState<{ id: string; name: string; date?: string; location?: string; expectedAttendees?: string; organizer?: string; description?: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sanchalan_custom_events') ?? '[]');
    } catch { return []; }
  });
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(!supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user?.email ? { email: data.session.user.email } : null);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user?.email ? { email: session.user.email } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const events = useMemo(() => {
    const fromRecords = (records?.events ?? []).map((e) => ({ id: e.id, name: e.name }));
    return [...fromRecords, ...customEvents];
  }, [records, customEvents]);

  useEffect(() => {
    if (!activeEventId && events.length > 0) setActiveEventId(events[0].id);
  }, [events, activeEventId]);

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

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const maps: Maps | null = useMemo(() => {
    if (!records) return null;
    return {
      venue: new Map(records.venues.map((v) => [v.id, v.name])),
      session: new Map(records.sessions.map((s) => [s.id, s.name])),
      vol: new Map(records.volunteers.map((v) => [v.id, v.name])),
    };
  }, [records]);

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa] text-[13px] text-gray-500">
        Loading…
      </div>
    );
  }

  if (supabaseConfigured && !user) {
    return <Auth onDone={() => {}} />;
  }

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

  const convertScenario = (s: ScenarioResult) => {
    const cr: ChangeRequest = {
      id: uid(),
      input: s.input,
      parsed: s.parsed,
      plan: s.plan,
      status: 'analyzed',
      createdAt: new Date().toISOString(),
      requestedBy: OPERATOR,
    };
    setChanges((cs) => [...cs, cr]);
    setReviewId(cr.id);
    setView('changes');
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-gray-900">
      <Sidebar
        view={view}
        setView={goView}
        connected={!demo}
        pendingCount={pendingCount}
        events={events}
        activeEventId={activeEventId}
        onSelectEvent={setActiveEventId}
        onAddEvent={() => setShowAddEvent(true)}
        userEmail={user?.email}
        onSignOut={() => supabase?.auth.signOut()}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="mb-4 flex items-center justify-end">
            <button
              onClick={() => setPalette(true)}
              className={cx(
                'flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5',
                'text-[12px] text-gray-500 hover:border-gray-300 hover:text-gray-700',
              )}
            >
              <span>Search…</span>
              <kbd className="rounded border border-gray-200 bg-gray-50 px-1 font-mono text-[10px]">⌘K</kbd>
            </button>
          </div>

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
              onReview={reviewChange}
              activeEvent={events.find((e) => e.id === activeEventId) ?? null}
            />
          )}
          {view === 'live' && <Live records={records} changes={changes} />}
          {view === 'preflight' && <Preflight records={records} setView={setView} />}
          {view === 'inbox' && <Inbox records={records} changes={changes} setView={setView} />}
          {view === 'attendees' && <AttendeesView records={records} maps={maps} />}
          {view === 'speakers' && <SpeakersView records={records} maps={maps} />}
          {view === 'sponsors' && <SponsorsView records={records} />}

          {view === 'changes' && (
            <Changes
              initialActiveId={reviewId}
              records={records}
              maps={maps}
              changes={changes}
              setChanges={setChanges}
              refreshRecords={load}
              onViewImpact={gotoImpact}
              operatorName={user?.email ?? undefined}
            />
          )}
          {view === 'simulate' && <Simulate records={records} onConvert={convertScenario} />}

          {view === 'sessions' && <SessionsView records={records} maps={maps} />}
          {view === 'tasks' && <TasksView records={records} maps={maps} />}
          {view === 'volunteers' && <VolunteersView records={records} maps={maps} />}
          {view === 'venues' && <VenuesView records={records} />}
          {view === 'comms' && <CommsView records={records} />}
          {view === 'risks' && <Risks records={records} changes={changes} setView={setView} />}

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

      {palette && <CommandPalette records={records} onGo={goView} onClose={() => setPalette(false)} />}

      {showAddEvent && (
        <AddEventWizard
          onClose={() => setShowAddEvent(false)}
          onAdd={(evt) => {
            const id = `custom-${Date.now()}`;
            const full = { id, ...evt };
            setCustomEvents((cs) => [...cs, full]);
            try {
              localStorage.setItem('sanchalan_custom_events', JSON.stringify([...customEvents, full]));
            } catch {}
            setActiveEventId(id);
            setShowAddEvent(false);
            setView('overview');
          }}
        />
      )}
    </div>
  );
}

interface NewEventData {
  name: string;
  date: string;
  location: string;
  expectedAttendees: string;
  organizer: string;
  description: string;
}

function AddEventWizard({ onClose, onAdd }: { onClose: () => void; onAdd: (e: NewEventData) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<NewEventData>({ name: '', date: '', location: '', expectedAttendees: '', organizer: '', description: '' });
  const [token, setToken] = useState('');
  const set = (k: keyof NewEventData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canNext1 = form.name.trim() && form.date.trim() && form.location.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 text-[16px] font-semibold text-gray-900">Add your event</div>
        <div className="mb-5 text-[12px] font-medium text-gray-500">Step {step} of 4</div>

        {step === 1 && (
          <div className="space-y-3">
            <div className="text-[13px] font-semibold text-gray-800">Event details</div>
            <input value={form.name} onChange={set('name')} placeholder="Event name *" className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <input value={form.date} onChange={set('date')} type="date" className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none" />
              <input value={form.location} onChange={set('location')} placeholder="Venue / City *" className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.expectedAttendees} onChange={set('expectedAttendees')} type="number" placeholder="Expected attendees" className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none" />
              <input value={form.organizer} onChange={set('organizer')} placeholder="Organizer" className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none" />
            </div>
            <textarea value={form.description} onChange={set('description')} placeholder="Short description (optional)" rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none" />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="text-[13px] font-semibold text-gray-800">Connect the coordinator's Notion</div>
            <p className="text-[13px] text-gray-600">Sanchalan reads and writes your event data in Notion. Three quick steps:</p>
            {[
              'Create an integration at notion.so/my-integrations and copy the secret (starts with ntn_).',
              'In Notion, open each event database → ••• → Add connections → pick your integration.',
              'Paste the token below.',
            ].map((t, i) => (
              <div key={i} className="flex gap-2 text-[13px] text-gray-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold">{i + 1}</span>
                {t}
              </div>
            ))}
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type="password"
              placeholder="ntn_… or secret_… (optional for now)"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="text-[13px] font-semibold text-gray-800">Databases Sanchalan needs</div>
            <p className="text-[13px] text-gray-600">Your Notion workspace should have these 11 databases. Sanchalan maps to them by name:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {['Events', 'Venues', 'Sessions', 'Volunteers', 'Tasks', 'Communications', 'Impact Reports', 'Attendees', 'Speakers', 'Sponsors', 'Risks'].map((d) => (
                <div key={d} className="rounded-md bg-gray-50 px-3 py-1.5 text-[12px] font-medium text-gray-700">{d}</div>
              ))}
            </div>
            <p className="text-[12px] text-gray-500">Don't have them yet? Duplicate our template workspace, or let Sanchalan work with whatever databases you share — it adapts to what's there.</p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="text-[13px] font-semibold text-gray-800">Ready to go</div>
            <div className="rounded-md bg-gray-50 p-3 text-[13px] text-gray-700 space-y-1">
              <div><span className="font-medium">Event:</span> {form.name}</div>
              <div><span className="font-medium">Date:</span> {form.date || '—'}</div>
              <div><span className="font-medium">Location:</span> {form.location}</div>
              {form.expectedAttendees && <div><span className="font-medium">Expected:</span> {form.expectedAttendees} attendees</div>}
              {form.organizer && <div><span className="font-medium">Organizer:</span> {form.organizer}</div>}
              <div><span className="font-medium">Notion:</span> {token.trim() ? 'Token saved ✓' : 'Connect later from Workspace settings'}</div>
            </div>
            <p className="text-[13px] text-gray-600">Once added, run Pre-flight to check readiness, use Changes for operational updates, and Simulate for what-ifs.</p>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:bg-gray-100">Cancel</button>
          <div className="flex gap-2">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="rounded-md border border-gray-300 px-4 py-1.5 text-[13px] font-medium text-gray-700">Back</button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !canNext1}
                className="rounded-md bg-gray-900 px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={() => {
                  if (token.trim()) {
                    try { localStorage.setItem('sanchalan_notion_token', token.trim()); } catch {}
                  }
                  onAdd(form);
                }}
                className="rounded-md bg-gray-900 px-4 py-1.5 text-[13px] font-medium text-white"
              >
                Add event
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
