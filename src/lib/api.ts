// Frontend API helpers. Falls back to mock demo data when the backend
// (or Notion) is not configured.

import { MOCK } from './mock';
import type { DbKey, ImpactPlan, ParsedChange, Records } from './types';

const DB_KEYS: DbKey[] = ['venues', 'events', 'sessions', 'volunteers', 'tasks', 'comms', 'impactReports', 'attendees', 'speakers', 'sponsors', 'risks'];

async function post(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(json.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

export async function fetchAllRecords(): Promise<{ records: Records; demo: boolean }> {
  try {
    const results = await Promise.all(DB_KEYS.map((db) => post('/api/query', { db })));
    const records = {} as Records;
    DB_KEYS.forEach((db, i) => {
      (records as any)[db] = results[i].rows ?? [];
    });
    return { records, demo: false };
  } catch {
    return { records: MOCK, demo: true };
  }
}

export async function parseUpdate(text: string): Promise<ParsedChange & { via?: string }> {
  try {
    return await post('/api/parse', { text });
  } catch {
    // Local regex fallback so the demo never stalls
    const tm = text.match(/(delay|push(?:\s+back)?|postpone|prepone|bring\s+forward)\D{0,25}?(\d+)\s*(min(?:ute)?s?|hr?s?|hours?)/i);
    if (tm) {
      const n = parseInt(tm[2], 10) * (/hr|hour/i.test(tm[3]) ? 60 : 1);
      return { type: 'time_shift', params: { minutes: /prepone|bring\s+forward/i.test(tm[1]) ? -n : n }, via: 'local' };
    }
    const vm = text.match(/(?:move|shift|relocate|change)\s+(?:all\s+sessions\s+(?:from\s+)?|the\s+)?(.+?)\s+(?:to|into)\s+([A-Za-z0-9 .'\-]+?)(?:\.|$)/i);
    if (vm) return { type: 'venue_change', params: { fromVenueName: vm[1].trim(), toVenueName: vm[2].trim() }, via: 'local' };
    return { type: 'none', params: {}, via: 'local' };
  }
}

export async function applyPlan(plan: ImpactPlan): Promise<{ updated: number; created: { db: string; url: string }[] }> {
  return post('/api/apply', { plan });
}

export async function askQuestion(question: string, records: Records) {
  try {
    return await post('/api/ask', { question, records });
  } catch {
    return { answer: 'Ask service unavailable.', citations: [] };
  }
}
