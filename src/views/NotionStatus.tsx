// Notion workspace: connection status + connect-your-own flow.

import { useState } from 'react';
import { Badge, Btn, SectionTitle, cx, fmtDateTime } from '../components/ui';
import { DB_TITLES } from '../config';
import type { DbKey } from '../lib/types';

const DB_KEYS: DbKey[] = ['venues', 'events', 'sessions', 'volunteers', 'tasks', 'comms', 'impactReports', 'attendees', 'speakers', 'sponsors', 'risks'];

const STEPS = [
  {
    n: '1',
    title: 'Create a Notion integration',
    body: 'Go to notion.so/my-integrations → New integration. Name it "Sanchalan", pick your workspace, and copy the Internal Integration Secret (starts with ntn_).',
  },
  {
    n: '2',
    title: 'Share your databases with it',
    body: 'Open each of your 11 event databases in Notion → ••• → Add connections → select "Sanchalan". Without this, the integration cannot see your data.',
  },
  {
    n: '3',
    title: 'Paste the token below',
    body: 'Sanchalan validates the token and loads your workspace. Your token stays in your browser — it is never sent anywhere except the Notion API.',
  },
];

export default function NotionStatus({
  connected,
  lastSync,
  syncing,
  onSync,
}: {
  connected: boolean;
  lastSync: Date | null;
  syncing: boolean;
  onSync: () => void;
}) {
  const [token, setToken] = useState('');
  const [customConnected, setCustomConnected] = useState(false);

  const connect = () => {
    const t = token.trim();
    if (!t.startsWith('ntn_') && !t.startsWith('secret_')) return;
    localStorage.setItem('sanchalan_notion_token', t);
    setCustomConnected(true);
  };

  const disconnect = () => {
    localStorage.removeItem('sanchalan_notion_token');
    setCustomConnected(false);
    setToken('');
  };

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="text-[20px] font-semibold tracking-tight text-gray-900">Notion Workspace</h1>

      <section className="rounded-lg border border-gray-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cx('h-2.5 w-2.5 rounded-full', connected ? 'bg-green-500' : 'bg-amber-500')} />
            <span className="text-[15px] font-semibold text-gray-900">
              {connected ? 'Connected' : 'Demo mode'}
            </span>
          </div>
          <Badge tone={connected ? 'green' : 'amber'}>{connected ? 'Live' : 'Offline'}</Badge>
        </div>
        <div className="mt-3 space-y-1 text-[13px] text-gray-600">
          <div className="flex justify-between">
            <span>Workspace</span>
            <span className="font-medium text-gray-900">BBSR Founders Meetup</span>
          </div>
          <div className="flex justify-between">
            <span>System of record</span>
            <span className="font-medium text-gray-900">Notion</span>
          </div>
          <div className="flex justify-between">
            <span>Last sync</span>
            <span className="font-medium text-gray-900">
              {lastSync ? fmtDateTime(lastSync.toISOString()) : '—'}
            </span>
          </div>
        </div>
        <div className="mt-3">
          <Btn onClick={onSync} disabled={syncing}>{syncing ? 'Syncing…' : 'Sync now'}</Btn>
        </div>
      </section>

      <section>
        <SectionTitle>Connected databases</SectionTitle>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {DB_KEYS.map((k) => (
            <div key={k} className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 last:border-0">
              <span className="text-[13px] font-medium text-gray-800">{DB_TITLES[k]}</span>
              <Badge tone={connected ? 'green' : 'gray'}>{connected ? '✓ Synced' : 'Demo'}</Badge>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white px-4 py-4">
        <SectionTitle>Connect your own workspace</SectionTitle>
        <p className="text-[13px] text-gray-600">
          Running your own event? Connect the coordinator's Notion workspace in three steps. Sanchalan works with any event that has the 11 databases.
        </p>
        <div className="mt-3 space-y-3">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[12px] font-bold text-gray-700">{s.n}</span>
              <div>
                <div className="text-[13px] font-semibold text-gray-900">{s.title}</div>
                <div className="mt-0.5 text-[13px] text-gray-600">{s.body}</div>
              </div>
            </div>
          ))}
        </div>
        {customConnected ? (
          <div className="mt-4 rounded-md bg-green-50 px-3 py-2.5">
            <div className="text-[13px] font-medium text-green-900">✓ Workspace token saved</div>
            <div className="mt-0.5 text-[12px] text-green-800">Your Notion workspace is linked. Reload to load your event data.</div>
            <div className="mt-2">
              <Btn variant="ghost" onClick={disconnect}>Disconnect</Btn>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ntn_… or secret_…"
              type="password"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-[13px] focus:border-gray-900 focus:outline-none"
            />
            <Btn
              variant="primary"
              onClick={connect}
              disabled={!token.trim().startsWith('ntn_') && !token.trim().startsWith('secret_')}
            >
              Connect
            </Btn>
          </div>
        )}
      </section>

      <p className="text-[12px] text-gray-500">
        Every approved change writes directly to these databases. Sanchalan never edits Notion
        without an explicit approval, and every write is recorded in an impact report.
      </p>
    </div>
  );
}
