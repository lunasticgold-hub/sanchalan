// Banner for empty custom events: pull data from the user's Notion workspace
// or add records manually.

import { useState } from 'react';
import { fetchCustomWorkspace } from '../lib/api';
import { emptyRecords } from '../lib/eventData';
import type { Records } from '../lib/types';
import type { View } from '../components/Sidebar';

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

  const hasMapping = (() => {
    try {
      const raw = localStorage.getItem(`sanchalan_notion_map_${eventId}`);
      return Boolean(raw && JSON.parse(raw)?.token);
    } catch {
      return false;
    }
  })();

  const pull = async () => {
    setPulling(true);
    setErr('');
    try {
      const raw = localStorage.getItem(`sanchalan_notion_map_${eventId}`);
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
      <div className="text-[15px] font-semibold text-gray-900">Set up your event</div>
      {pulledCount !== null ? (
        <p className="mt-1 text-[13.5px] text-green-700">
          ✓ Pulled {pulledCount} records from your Notion workspace.
        </p>
      ) : (
        <>
          <p className="mt-1 max-w-lg text-[13.5px] leading-relaxed text-gray-600">
            Pull your real data from Notion, or add records manually below.
          </p>
          {err && <p className="mt-2 text-[13px] text-red-600">{err}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {hasMapping && (
              <button
                onClick={pull}
                disabled={pulling}
                className="rounded-lg bg-gray-900 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {pulling ? 'Pulling from Notion…' : '↓ Pull from Notion'}
              </button>
            )}
            <button onClick={() => setView('venues')} className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">+ Add venue</button>
            <button onClick={() => setView('sessions')} className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">+ Add session</button>
            <button onClick={() => setView('volunteers')} className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">+ Add volunteer</button>
            <button onClick={() => setView('tasks')} className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50">+ Add task</button>
          </div>
          {!hasMapping && (
            <p className="mt-2 text-[12px] text-gray-500">
              To pull from Notion, create this event via the wizard with your Notion token.
            </p>
          )}
        </>
      )}
    </div>
  );
}
