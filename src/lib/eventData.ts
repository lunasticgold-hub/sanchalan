// Per-event data isolation. Demo event uses live Notion records;
// custom events use localStorage-backed records (start empty, user adds).

import type { Records } from './types';

export function emptyRecords(): Records {
  return {
    venues: [], events: [], sessions: [], volunteers: [], tasks: [],
    comms: [], impactReports: [], attendees: [], speakers: [], sponsors: [], risks: [],
  };
}

const key = (eventId: string) => `sanchalan_event_data_${eventId}`;

export function loadCustomRecords(eventId: string): Records {
  try {
    const raw = localStorage.getItem(key(eventId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...emptyRecords(), ...parsed };
    }
  } catch {}
  return emptyRecords();
}

export function saveCustomRecords(eventId: string, records: Records) {
  try {
    localStorage.setItem(key(eventId), JSON.stringify(records));
  } catch {}
}

export function isCustomEvent(eventId: string) {
  return eventId.startsWith('custom-');
}
