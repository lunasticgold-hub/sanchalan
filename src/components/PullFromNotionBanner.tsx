// Banner for empty custom events: pull data from the user's Notion workspace
// or add records manually.

import { useState } from 'react';
import { fetchCustomWorkspace } from '../lib/api';
import { migrateLegacyKey, scopedKey } from '../lib/userScope';
import { emptyRecords } from '../lib/eventData';
import type { Records } from '../lib/types';
import type { View } from '../components/Sidebar';
import ConnectNotionModal from './ConnectNotionModal';

export default function PullFromNotionBanner({
  eventId,
  setView,
  onPulled,
}: {
  eventId: string;
  setView: (v: View) => void;
  onPulled: (updater: (r: Records) => Records) => void;
}) {
  const [pulling, setPulling] = useState(false);
  const [err, setErr] = useState('');
  const [pulledCount, setPulledCount] = useState<number | null>(null);
  const [showConnect, setShowConnect] = useState(false);

  const hasMapping = (() => {
    try {
      migrateLegacyKey(`notion_map_${eventId}`);
      const raw = localStorage.getItem(scopedKey(`notion_map_${eventId}`));
      return Boolean(raw && JSON.parse(raw)?.token);
    } catch {
      return false;
    }
  })();

  const pull = async () => {
    setPulling(true);
    setErr('');
    try {
      migrateLegacyKey(`notion_map_${eventId}`);
      const raw = localStorage.getItem(scopedKey(`notion_map_${eventId}`));
      if (!raw) throw new Error('No Notion connection found for this event.');
      const { token, databases } = JSON.parse(raw);
      const pulled = await fetchCustomWorkspace(token, databases);
      const total = Object.values(pulled).reduce((n, arr: any) => n + (arr?.length ?? 0), 0);
      if (total === 0) throw new Error('No records found in your Notion databases.');
      onPulled((r) => ({ ...emptyRecords(), ...r, ...pulled }));
      setPulledCount(total);
    } catch (e: any) {
      setErr(e.message ?? 'Pull failed. Check your Notion connection.');
    } finally {
      setPulling(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5">
      <div className="text-[15px] font-semibold text-[#191919]">Set up your event</div>
      {pulledCount !== null ? (
        <p className="mt-1 text-[13.5px] text-green-700">
          ✓ Pulled {pulledCount} records from your Notion workspace.
        </p>
      ) : (
        <>
          <p className="mt-1 max-w-lg text-[13.5px] leading-relaxed text-[#6B6B6B]">
            Pull your real data from Notion, or add records manually below.
          </p>
          {err && <p className="mt-2 text-[13px] text-red-600">{err}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {hasMapping ? (
              <button
                onClick={pull}
                disabled={pulling}
                className="rounded-lg bg-[#191919] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#2e2e2e] disabled:opacity-50"
              >
                {pulling ? 'Pulling from Notion…' : '↓ Pull from Notion'}
              </button>
            ) : (
              <button
                onClick={() => setShowConnect(true)}
                className="rounded-lg bg-[#191919] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#2e2e2e]"
              >
                ⇄ Connect Notion & Sync
              </button>
            )}
            <button onClick={() => setView('venues')} className="rounded-lg border border-[#D9D9D6] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#3d3d3d] hover:bg-[#F5F5F3]">+ Add venue</button>
            <button onClick={() => setView('sessions')} className="rounded-lg border border-[#D9D9D6] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#3d3d3d] hover:bg-[#F5F5F3]">+ Add session</button>
            <button onClick={() => setView('volunteers')} className="rounded-lg border border-[#D9D9D6] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#3d3d3d] hover:bg-[#F5F5F3]">+ Add volunteer</button>
            <button onClick={() => setView('tasks')} className="rounded-lg border border-[#D9D9D6] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#3d3d3d] hover:bg-[#F5F5F3]">+ Add task</button>
          </div>
          {!hasMapping && (
            <p className="mt-2 text-[12px] text-[#6B6B6B]">
              Connect your Notion workspace to pull your real event data.
            </p>
          )}
        </>
      )}
      {showConnect && (
        <ConnectNotionModal
          eventId={eventId}
          onClose={() => setShowConnect(false)}
          onPulled={(updater) => {
            onPulled(updater);
            setShowConnect(false);
          }}
        />
      )}
    </div>
  );
}
