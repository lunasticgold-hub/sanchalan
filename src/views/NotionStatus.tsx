// Notion connection: first-class integration status page.

import { Badge, Btn, SectionTitle, cx, fmtDateTime } from '../components/ui';
import { DB_TITLES } from '../config';
import type { DbKey } from '../lib/types';

const DB_KEYS: DbKey[] = ['venues', 'events', 'sessions', 'volunteers', 'tasks', 'comms', 'impactReports'];

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
        {!connected && (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
            Notion is not connected. The app is running on demo data. Set NOTION_TOKEN on the
            server to sync the live workspace.
          </p>
        )}
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

      <p className="text-[12px] text-gray-500">
        Every approved change writes directly to these databases. Sanchalan never edits Notion
        without an explicit approval, and every write is recorded in an impact report.
      </p>
    </div>
  );
}
