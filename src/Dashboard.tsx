// Sanchalan — operations shell.
// Sidebar nav + views. Notion is the system of record; demo data fallback when offline.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sidebar, { type View } from './components/Sidebar';
import Topbar from './components/Topbar';
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
import { fetchAllRecords, fetchCustomWorkspace } from './lib/api';
import type { ChangeRequest, Records } from './lib/types';
import { Linkify } from './components/ui';
import Auth from './components/Auth';
import Logo from './components/Logo';
import { supabase, supabaseConfigured } from './lib/supabase';
import { emptyRecords, isCustomEvent, loadCustomRecords, saveCustomRecords } from './lib/eventData';
import { migrateLegacyKey, scopedKey, setScopeEmail } from './lib/userScope';

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
              <div className="px-4 py-3 text-[13px] text-[#6B6B6B]">No matches.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [records, setRecords] = useState<Records | null>(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [view, setView] = useState<View>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [selectedImpactId, setSelectedImpactId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [palette, setPalette] = useState(false);
  const [activeEventId, setActiveEventId] = useState<string>('');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [customEvents, setCustomEvents] = useState<{ id: string; name: string; date?: string; location?: string; expectedAttendees?: string; organizer?: string; description?: string }[]>([]);
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(!supabaseConfigured);
  const [customData, setCustomData] = useState<Record<string, Records>>({});

  // Active records: Notion data for demo event, local data for custom events
  const activeRecords: Records = (() => {
    if (!records) return emptyRecords();
    if (!activeEventId || !isCustomEvent(activeEventId)) return records;
    return customData[activeEventId] ?? loadCustomRecords(activeEventId);
  })();

  const updateCustomData = (_updater: (r: Records) => Records) => {
    // Used by entity views to add records to custom events
    if (!isCustomEvent(activeEventId)) return;
    setCustomData((prev) => {
      const current = prev[activeEventId] ?? loadCustomRecords(activeEventId);
      const next = _updater(current);
      saveCustomRecords(activeEventId, next);
      return { ...prev, [activeEventId]: next };
    });
  };
  // Exposed via props to entity views (see AddRecordButton in ui.tsx)
  const isCustomActive = isCustomEvent(activeEventId);
  const makeAdd = (kind: 'sessions' | 'attendees' | 'volunteers' | 'tasks' | 'venues' | 'speakers' | 'sponsors') =>
    (vals: Record<string, string>) => {
      const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      updateCustomData((r) => {
        const next = { ...r };
        if (kind === 'sessions') next.sessions = [...r.sessions, { id, name: vals.name, eventId: activeEventId, venueId: '', starts: vals.starts ?? '', ends: vals.ends ?? '', speaker: '', format: '', status: 'Scheduled' }];
        if (kind === 'volunteers') next.volunteers = [...r.volunteers, { id, name: vals.name, role: vals.role ?? '', phone: '', skills: [], shift: vals.shift ?? 'Full-day', sessionIds: [] }];
        if (kind === 'tasks') next.tasks = [...r.tasks, { id, title: vals.name, ownerId: '', sessionId: '', due: '', status: 'Todo', priority: 'P2', source: 'human', detail: vals.detail ?? '' }];
        if (kind === 'venues') next.venues = [...r.venues, { id, name: vals.name, capacity: parseInt(vals.capacity ?? '0', 10) || 0, location: vals.location ?? '', facilities: [] }];
        return next;
      });
    };

  useEffect(() => {
    if (!supabaseConfigured || !supabase) return;
    const toUser = (u: any) =>
      u?.email ? { email: u.email, name: u.user_metadata?.full_name ?? undefined } : null;
    supabase.auth.getSession().then(({ data }) => {
      setUser(toUser(data.session?.user));
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(toUser(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Per-account storage: events belong to the signed-in account, so a
  // different login on the same browser starts with a clean slate.
  const userEmail = user?.email ?? null;
  useEffect(() => {
    setScopeEmail(userEmail);
    migrateLegacyKey('custom_events');
    migrateLegacyKey('notion_token');
    let evts: { id: string; name: string }[] = [];
    try {
      evts = JSON.parse(localStorage.getItem(scopedKey('custom_events')) ?? '[]');
    } catch { evts = []; }
    setCustomEvents(evts as any);
    setCustomData({});
    setActiveEventId('');
    setView('overview');
  }, [userEmail]);

  const events = useMemo(() => {
    const fromRecords = (records?.events ?? []).map((e) => ({ id: e.id, name: e.name }));
    return [...fromRecords, ...customEvents];
  }, [records, customEvents]);

  useEffect(() => {
    // Don't auto-select the BBSR demo event. User picks their own event or creates one.
    if (activeEventId) return;
    if (customEvents.length > 0) {
      setActiveEventId(customEvents[0].id);
    }
    // Otherwise stay empty — welcome screen prompts to create first event
  }, [customEvents, activeEventId]);

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

  // The active custom event's Notion credentials (token + database mapping),
  // read from per-account storage. Undefined for the demo event (server fallback).
  const activeNotionCreds = (() => {
    if (!activeEventId || !isCustomEvent(activeEventId)) return { token: undefined as string | undefined, databases: undefined as Record<string, string> | undefined };
    try {
      migrateLegacyKey(`notion_map_${activeEventId}`);
      const raw = localStorage.getItem(scopedKey(`notion_map_${activeEventId}`));
      if (!raw) return { token: undefined as string | undefined, databases: undefined as Record<string, string> | undefined };
      const parsed = JSON.parse(raw);
      return { token: parsed.token as string | undefined, databases: parsed.databases as Record<string, string> | undefined };
    } catch {
      return { token: undefined as string | undefined, databases: undefined as Record<string, string> | undefined };
    }
  })();

  // Merge freshly pulled Notion records over existing ones, preserving
  // records created locally in Sanchalan (id starts with 'local-').
  const mergePulled = (current: Records, pulled: Partial<Records>): Records => {
    const next = { ...current };
    (Object.keys(pulled) as (keyof Records)[]).forEach((k) => {
      const fresh = ((pulled[k] as { id: string }[] | undefined) ?? []);
      const freshIds = new Set(fresh.map((x) => x.id));
      const localOnly = ((current[k] as { id: string }[] | undefined) ?? []).filter(
        (x) => x.id.startsWith('local-') && !freshIds.has(x.id)
      );
      (next as any)[k] = [...fresh, ...localOnly];
    });
    return next;
  };

  // Sync the active custom event from its connected Notion workspace.
  const syncCustomEvent = useCallback(async (eventId: string) => {
    let mapping: { token: string; databases: Record<string, string> } | null = null;
    try {
      migrateLegacyKey(`notion_map_${eventId}`);
      const raw = localStorage.getItem(scopedKey(`notion_map_${eventId}`));
      if (raw) mapping = JSON.parse(raw);
    } catch { /* ignore */ }
    if (!mapping?.token) return false;
    const pulled = await fetchCustomWorkspace(mapping.token, mapping.databases ?? {});
    const total = Object.values(pulled).reduce((n, arr: any) => n + (arr?.length ?? 0), 0);
    if (total === 0) return false;
    setCustomData((prev) => {
      const current = prev[eventId] ?? loadCustomRecords(eventId);
      const next = mergePulled(current, pulled);
      saveCustomRecords(eventId, next);
      return { ...prev, [eventId]: next };
    });
    return true;
  }, []);

  // Unified sync: refreshes whichever event is active. Safe to call in the
  // background — it never wipes locally created records.
  const syncingRef = useRef(false);
  const lastSyncRef = useRef(0);
  const activeEventIdRef = useRef(activeEventId);
  activeEventIdRef.current = activeEventId;

  const syncActive = useCallback(async (opts?: { force?: boolean }) => {
    if (syncingRef.current) return;
    if (!opts?.force && Date.now() - lastSyncRef.current < 30000) return; // at most every 30s
    syncingRef.current = true;
    setSyncing(true);
    try {
      const id = activeEventIdRef.current;
      if (id && isCustomEvent(id)) {
        const ok = await syncCustomEvent(id);
        if (ok) {
          lastSyncRef.current = Date.now();
          setLastSync(new Date());
        }
      } else {
        const { records, demo } = await fetchAllRecords();
        setRecords(records);
        setDemo(demo);
        lastSyncRef.current = Date.now();
        setLastSync(new Date());
      }
    } catch {
      // Background sync failures stay silent; manual sync surfaces errors.
    } finally {
      setLoading(false);
      setSyncing(false);
      syncingRef.current = false;
    }
  }, [syncCustomEvent]);

  useEffect(() => {
    load();
  }, []);

  // Auto-sync: refresh from Notion when the tab regains focus and every
  // 60s while visible, so Notion edits appear without a manual pull.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncActive();
    };
    const onFocus = () => syncActive();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') syncActive();
    }, 60000);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [syncActive]);

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
    if (!activeRecords) return null;
    return {
      venue: new Map(activeRecords.venues.map((v) => [v.id, v.name])),
      session: new Map(activeRecords.sessions.map((s) => [s.id, s.name])),
      vol: new Map(activeRecords.volunteers.map((v) => [v.id, v.name])),
    };
  }, [activeRecords]);

  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FBFBFA] text-[13px] text-[#6B6B6B]">
        Loading…
      </div>
    );
  }

  if (supabaseConfigured && !user) {
    return <Auth onDone={() => {}} />;
  }

  if (loading || !records || !maps) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FBFBFA] text-[13px] text-[#6B6B6B]">
        Loading workspace…
      </div>
    );
  }

  // Welcome screen: no event selected yet (new user hasn't created one)
  if (!activeEventId) {
    const demoEvent = (records.events ?? [])[0];
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FBFBFA] px-4">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900">
            <div className="h-5 w-5 rounded-full border-2 border-white" />
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Welcome to Sanchalan</h1>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-[#6B6B6B]">
            Create your first event to start running it — or connect your Notion workspace and pull your real data.
          </p>
          <button
            onClick={() => setShowAddEvent(true)}
            className="mt-6 w-full rounded-lg bg-gray-900 py-3 text-[15px] font-semibold text-white hover:bg-gray-800"
          >
            + Create your first event
          </button>
          {demoEvent && (
            <button
              onClick={() => { setActiveEventId(demoEvent.id); setView('overview'); }}
              className="mt-3 w-full rounded-lg border border-gray-200 py-2.5 text-[14px] font-medium text-gray-600 hover:bg-gray-50"
            >
              Try the demo event instead
            </button>
          )}
          <p className="mt-4 text-[12px] text-gray-400">Your data stays in your Notion. Nothing is shared.</p>
        </div>
        {showAddEvent && (
          <AddEventWizard
            onClose={() => setShowAddEvent(false)}
            onAdd={(evt) => {
              const id = `custom-${Date.now()}`;
              const full = { id, ...evt };
              setCustomEvents((cs) => [...cs, full]);
              try {
                localStorage.setItem(scopedKey('custom_events'), JSON.stringify([...customEvents, full]));
              } catch {}
              setActiveEventId(id);
              setShowAddEvent(false);
              setView('overview');
              return full;
            }}
          />
        )}
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
    <div className="flex min-h-screen bg-[#FBFBFA] text-[#191919]">
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
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          view={view}
          eventName={events.find((e) => e.id === activeEventId)?.name}
          onOpenSearch={() => setPalette(true)}
          onOpenNotion={() => goView('notion')}
          connected={!demo}
          pendingInbox={pendingCount}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">

          {demo && (
            <div className="mb-4 rounded-[6px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-800">
              Demo data — connect Notion to go live.
            </div>
          )}

          {view === 'overview' && (
            <Overview
              records={activeRecords}
              changes={changes}
              setView={setView}
              onReview={reviewChange}
              activeEvent={events.find((e) => e.id === activeEventId) ?? null}
              updateCustomData={updateCustomData}
            />
          )}
          {view === 'live' && <Live records={activeRecords} changes={changes} />}
          {view === 'preflight' && <Preflight records={activeRecords} setView={setView} />}
          {view === 'inbox' && <Inbox records={activeRecords} changes={changes} setView={setView} />}
          {view === 'attendees' && <AttendeesView records={activeRecords} maps={maps} />}
          {view === 'speakers' && <SpeakersView records={activeRecords} maps={maps} />}
          {view === 'sponsors' && <SponsorsView records={activeRecords} />}

          {view === 'changes' && (
            <Changes
              initialActiveId={reviewId}
              records={activeRecords}
              maps={maps}
              changes={changes}
              setChanges={setChanges}
              refreshRecords={load}
              onViewImpact={gotoImpact}
              operatorName={user?.name || user?.email || undefined}
              notionToken={activeNotionCreds.token}
              notionDatabases={activeNotionCreds.databases}
            />
          )}
          {view === 'simulate' && <Simulate records={activeRecords} onConvert={convertScenario} />}

          {view === 'sessions' && <SessionsView records={activeRecords} maps={maps} isCustom={isCustomActive} onAdd={makeAdd('sessions')} />}
          {view === 'tasks' && <TasksView records={activeRecords} maps={maps} isCustom={isCustomActive} onAdd={makeAdd('tasks')} />}
          {view === 'volunteers' && <VolunteersView records={activeRecords} maps={maps} isCustom={isCustomActive} onAdd={makeAdd('volunteers')} />}
          {view === 'venues' && <VenuesView records={activeRecords} isCustom={isCustomActive} onAdd={makeAdd('venues')} />}
          {view === 'comms' && <CommsView records={activeRecords} />}
          {view === 'risks' && <Risks records={activeRecords} changes={changes} setView={setView} />}

          {view === 'impacts' && (
            <ImpactReports
              records={activeRecords}
              changes={changes}
              maps={maps}
              selectedId={selectedImpactId}
              setSelectedId={setSelectedImpactId}
            />
          )}

          {view === 'notion' && (
            <NotionStatus connected={!demo} lastSync={lastSync} syncing={syncing} onSync={() => syncActive({ force: true })} />
          )}

          <footer className="mt-10 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo size={18} />
                <span className="text-[11px] font-medium text-[#9B9B9B]">Sanchalan · Kaun Banega Codepati 2026 (KBC-NOTION-03)</span>
              </div>
              <span className="text-[11px] text-[#9B9B9B]">Notion is the system of record</span>
            </div>
          </footer>
        </div>
      </main>
      </div>

      {palette && <CommandPalette records={activeRecords} onGo={goView} onClose={() => setPalette(false)} />}

      {showAddEvent && (
        <AddEventWizard
          onClose={() => setShowAddEvent(false)}
          onAdd={(evt) => {
            const id = `custom-${Date.now()}`;
            const full = { id, ...evt };
            setCustomEvents((cs) => [...cs, full]);
            try {
              localStorage.setItem(scopedKey('custom_events'), JSON.stringify([...customEvents, full]));
            } catch {}
            setActiveEventId(id);
            setShowAddEvent(false);
            setView('overview');
            return full;
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

function AddEventWizard({ onClose, onAdd }: { onClose: () => void; onAdd: (e: NewEventData) => { id: string } | void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<NewEventData>({ name: '', date: '', location: '', expectedAttendees: '', organizer: '', description: '' });
  const [token, setToken] = useState('');
  const [discovered, setDiscovered] = useState<{ id: string; name: string }[] | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [discoverErr, setDiscoverErr] = useState('');

  const discoverDatabases = async () => {
    if (!token.trim()) return;
    setDiscovering(true);
    setDiscoverErr('');
    try {
      const resp = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? 'Discovery failed');
      setDiscovered(data.databases ?? []);
    } catch (e: any) {
      setDiscoverErr(e.message ?? 'Could not reach Notion. Check the token and try again.');
    } finally {
      setDiscovering(false);
    }
  };

  // Auto-match discovered databases to expected names
  const matchDb = (expected: string) => {
    if (!discovered) return null;
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
    return discovered.find((d) => norm(d.name).includes(norm(expected)) || norm(expected).includes(norm(d.name))) ?? null;
  };
  const set = (k: keyof NewEventData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canNext1 = form.name.trim() && form.date.trim() && form.location.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 text-[16px] font-semibold text-gray-900">Add your event</div>
        <div className="mb-5 text-[12px] font-medium text-[#6B6B6B]">Step {step} of 4</div>

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
              'Paste the token below to continue.',
            ].map((t, i) => (
              <div key={i} className="flex gap-2 text-[13px] text-gray-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold">{i + 1}</span>
                <span><Linkify text={t} /></span>
              </div>
            ))}
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type="password"
              placeholder="ntn_… or secret_…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none"
            />
            {!token.trim() && (
              <p className="text-[12px] text-amber-700">Enter your Notion integration token to continue to the next step.</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="text-[13px] font-semibold text-gray-800">Connect your Notion databases</div>
            <p className="text-[13px] text-gray-600">Sanchalan found these databases in your workspace. Matched ones will feed your event:</p>
            {!discovered && !discovering && (
              <button
                onClick={discoverDatabases}
                className="rounded-md bg-gray-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-gray-800"
              >
                Discover databases
              </button>
            )}
            {discovering && <p className="text-[13px] text-[#6B6B6B]">Scanning your Notion workspace…</p>}
            {discoverErr && <p className="text-[13px] text-red-600">{discoverErr}</p>}
            {discovered && (
              <div className="space-y-1.5">
                {['Events', 'Venues', 'Sessions', 'Volunteers', 'Tasks', 'Communications', 'Impact Reports', 'Attendees', 'Speakers', 'Sponsors', 'Risks'].map((expected) => {
                  const m = matchDb(expected);
                  return (
                    <div key={expected} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5">
                      <span className="text-[12px] font-medium text-gray-700">{expected}</span>
                      {m ? (
                        <span className="text-[12px] text-green-700">✓ {m.name}</span>
                      ) : (
                        <span className="text-[12px] text-gray-400">not found</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {discovered && discovered.length === 0 && (
              <p className="text-[13px] text-amber-700">No databases found. Make sure you've shared them with your integration (Notion → ••• → Add connections).</p>
            )}
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
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-[13px] font-medium text-[#6B6B6B] hover:bg-gray-100">Cancel</button>
          <div className="flex gap-2">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="rounded-md border border-gray-300 px-4 py-1.5 text-[13px] font-medium text-gray-700">Back</button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={(step === 1 && !canNext1) || (step === 2 && !token.trim())}
                className="rounded-md bg-gray-900 px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-40"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={() => {
                  if (token.trim()) {
                    try { localStorage.setItem(scopedKey('notion_token'), token.trim()); } catch {}
                  }
                  const newEvent = onAdd(form);
                  // Save Notion mapping for this custom event
                  if (newEvent?.id && discovered && discovered.length > 0) {
                    const mapping: Record<string, string> = {};
                    // Keys must match DbKey in src/lib/types.ts
                    const keyMap: Record<string, string> = {
                      'Events': 'events',
                      'Venues': 'venues',
                      'Sessions': 'sessions',
                      'Volunteers': 'volunteers',
                      'Tasks': 'tasks',
                      'Communications': 'comms',
                      'Impact Reports': 'impactReports',
                      'Attendees': 'attendees',
                      'Speakers': 'speakers',
                      'Sponsors': 'sponsors',
                      'Risks': 'risks',
                    };
                    Object.keys(keyMap).forEach((expected) => {
                      const m = matchDb(expected);
                      if (m) mapping[keyMap[expected]] = m.id;
                    });
                    try {
                      localStorage.setItem(scopedKey(`notion_map_${newEvent.id}`), JSON.stringify({ token: token.trim(), databases: mapping }));
                    } catch {}
                  }
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
