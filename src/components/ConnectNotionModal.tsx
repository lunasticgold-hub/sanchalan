// Connect Notion directly from the event page — no wizard needed.
// Paste token → discover databases → save mapping → pull data.

import { useEffect, useState } from 'react';
import { fetchCustomWorkspace } from '../lib/api';
import { emptyRecords } from '../lib/eventData';
import type { Records } from '../lib/types';

const EXPECTED = [
  ['events', 'Events'],
  ['venues', 'Venues'],
  ['sessions', 'Sessions'],
  ['volunteers', 'Volunteers'],
  ['tasks', 'Tasks'],
  ['comms', 'Communications'],
  ['impactReports', 'Impact Reports'],
  ['attendees', 'Attendees'],
  ['speakers', 'Speakers'],
  ['sponsors', 'Sponsors'],
  ['risks', 'Risks'],
] as const;

export default function ConnectNotionModal({
  eventId,
  onClose,
  onPulled,
}: {
  eventId: string;
  onClose: () => void;
  onPulled: (updater: (r: Records) => Records) => void;
}) {
  const [token, setToken] = useState(() => {
    // Pre-fill from saved token: this event's mapping first, then global
    try {
      const eventRaw = localStorage.getItem(`sanchalan_notion_map_${eventId}`);
      if (eventRaw) {
        const t = JSON.parse(eventRaw)?.token;
        if (t) return t;
      }
      return localStorage.getItem('sanchalan_notion_token') ?? '';
    } catch {
      return '';
    }
  });
  const [discovering, setDiscovering] = useState(false);
  const [discoverErr, setDiscoverErr] = useState('');
  const [discovered, setDiscovered] = useState<{ id: string; name: string }[] | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncErr, setSyncErr] = useState('');
  const [done, setDone] = useState<number | null>(null);
  const [autoTried, setAutoTried] = useState(false);
  const [mode, setMode] = useState<'link' | 'token'>('link');
  const [pageLink, setPageLink] = useState('');
  const [pageTitle, setPageTitle] = useState('');

  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  const matchDb = (expected: string) =>
    discovered?.find((d) => norm(d.name).includes(norm(expected)) || norm(expected).includes(norm(d.name))) ?? null;

  // Auto-discover on open if we already have a token
  useEffect(() => {
    if (!autoTried && token.trim()) {
      setAutoTried(true);
      discover();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const discover = async () => {
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
      setPageTitle('');
    } catch (e: any) {
      setDiscoverErr(e.message ?? 'Could not reach Notion. Check the token.');
    } finally {
      setDiscovering(false);
    }
  };

  const discoverFromLink = async () => {
    if (!token.trim() || !pageLink.trim()) return;
    setDiscovering(true);
    setDiscoverErr('');
    try {
      const resp = await fetch('/api/discover-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), pageIdOrUrl: pageLink.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? 'Discovery failed');
      setDiscovered(data.databases ?? []);
      setPageTitle(data.pageTitle ?? '');
    } catch (e: any) {
      setDiscoverErr(e.message ?? 'Could not read that page. Check the link and sharing.');
    } finally {
      setDiscovering(false);
    }
  };

  const sync = async () => {
    if (!discovered) return;
    setSyncing(true);
    setSyncErr('');
    try {
      const mapping: Record<string, string> = {};
      EXPECTED.forEach(([key, expected]) => {
        const m = matchDb(expected);
        if (m) mapping[key] = m.id;
      });
      if (Object.keys(mapping).length === 0) throw new Error('No databases matched. Check the names.');
      // Save mapping for this event + remember token globally
      try {
        localStorage.setItem(`sanchalan_notion_map_${eventId}`, JSON.stringify({ token: token.trim(), databases: mapping }));
        localStorage.setItem('sanchalan_notion_token', token.trim());
      } catch {}
      // Pull data
      const pulled = await fetchCustomWorkspace(token.trim(), mapping);
      const total = Object.values(pulled).reduce((n, arr: any) => n + (arr?.length ?? 0), 0);
      if (total === 0) throw new Error('No records found in your Notion databases.');
      onPulled((r) => ({ ...emptyRecords(), ...r, ...pulled }));
      setDone(total);
    } catch (e: any) {
      setSyncErr(e.message ?? 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-[16px] font-semibold text-gray-900">Connect Notion</div>
        <p className="mt-1 text-[13px] text-gray-500">Paste a Notion page link — Sanchalan finds all databases on it automatically.</p>

        {done !== null ? (
          <div className="mt-4 rounded-lg bg-green-50 p-4 text-center">
            <div className="text-[15px] font-semibold text-green-800">✓ Synced {done} records from Notion</div>
            <button onClick={onClose} className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-gray-800">Done</button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* Mode tabs */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setMode('link')}
                className={`flex-1 rounded-md py-1.5 text-[13px] font-medium ${mode === 'link' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Paste page link
              </button>
              <button
                onClick={() => setMode('token')}
                className={`flex-1 rounded-md py-1.5 text-[13px] font-medium ${mode === 'token' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                Browse all databases
              </button>
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-medium text-gray-700">Notion integration token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ntn_..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-[13px] outline-none focus:border-gray-500"
              />
            </div>

            {mode === 'link' ? (
              <div>
                <label className="mb-1 block text-[13px] font-medium text-gray-700">Notion page link</label>
                <div className="flex gap-2">
                  <input
                    value={pageLink}
                    onChange={(e) => setPageLink(e.target.value)}
                    placeholder="https://notion.so/..."
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-[13px] outline-none focus:border-gray-500"
                  />
                  <button
                    onClick={discoverFromLink}
                    disabled={!token.trim() || !pageLink.trim() || discovering}
                    className="rounded-md bg-gray-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                  >
                    {discovering ? 'Reading…' : 'Find databases'}
                  </button>
                </div>
                <p className="mt-1.5 text-[12px] text-gray-500">
                  Copy the link of the Notion page holding your databases. Share just that <strong>one page</strong> with your integration: open it → ••• → Add connections.
                </p>
              </div>
            ) : (
              <div>
                <button
                  onClick={discover}
                  disabled={!token.trim() || discovering}
                  className="w-full rounded-md bg-gray-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                >
                  {discovering ? 'Finding…' : 'Find all my databases'}
                </button>
                <p className="mt-1.5 text-[12px] text-gray-500">
                  Searches your whole workspace. Share each database first: open it → ••• → Add connections.
                </p>
              </div>
            )}
            {discoverErr && <p className="mt-2 text-[13px] text-red-600">{discoverErr}</p>}

            {discovered && (
              <div>
                <div className="mb-2 text-[13px] font-medium text-gray-700">
                  Found {discovered.length} database{discovered.length === 1 ? '' : 's'}{pageTitle ? ` on "${pageTitle}"` : ''}
                </div>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-gray-200 p-2">
                  {EXPECTED.map(([key, expected]) => {
                    const m = matchDb(expected);
                    return (
                      <div key={key} className="flex items-center justify-between px-2 py-1 text-[13px]">
                        <span className="text-gray-600">{expected}</span>
                        {m ? (
                          <span className="font-medium text-green-700">✓ {m.name}</span>
                        ) : (
                          <span className="text-gray-400">not found</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {syncErr && <p className="mt-2 text-[13px] text-red-600">{syncErr}</p>}
                <button
                  onClick={sync}
                  disabled={syncing}
                  className="mt-3 w-full rounded-lg bg-gray-900 py-2.5 text-[14px] font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {syncing ? 'Syncing from Notion…' : '↓ Sync from Notion'}
                </button>
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={onClose} className="rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:bg-gray-100">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
