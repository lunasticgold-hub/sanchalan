// Frontend API helpers. Falls back to mock demo data when the backend
// (or Notion) is not configured.

import { MOCK } from './mock';
import type { DbKey, GeneralChangeParams, ImpactPlan, ParsedChange, Records } from './types';

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

// Fetch records from a user's own Notion workspace (custom event).
// mapping: { token, databases: { venues: id, sessions: id, ... } }
export async function fetchCustomWorkspace(
  token: string,
  databases: Record<string, string>
): Promise<Partial<Records>> {
  const out: Partial<Records> = {};
  await Promise.all(
    DB_KEYS.map(async (db) => {
      const dbId = databases[db];
      if (!dbId) return;
      try {
        const json = await post('/api/query', { db, token, databaseId: dbId });
        (out as any)[db] = json.rows ?? [];
      } catch {
        // Skip databases that fail (wrong schema, no access, etc.)
      }
    })
  );
  return out;
}

export async function parseUpdate(text: string): Promise<ParsedChange & { via?: string }> {
  try {
    return await post('/api/parse', { text });
  } catch {
    // Local regex fallback so the demo never stalls.
    // Normalize first: collapse whitespace and ensure terminal punctuation,
    // so "…to Seminar Hall B" parses the same as "…to Seminar Hall B."
    let t = text.trim().replace(/\s+/g, ' ');
    if (t && !/[.!?]$/.test(t)) t += '.';
    const tm = t.match(/(delay|push(?:\s+back)?|postpone|prepone|bring\s+forward)\D{0,25}?(\d+)\s*(min(?:ute)?s?|hr?s?|hours?)/i);
    if (tm) {
      const n = parseInt(tm[2], 10) * (/hr|hour/i.test(tm[3]) ? 60 : 1);
      return { type: 'time_shift', params: { minutes: /prepone|bring\s+forward/i.test(tm[1]) ? -n : n }, via: 'local' };
    }
    const vm = t.match(/(?:move|shift|relocate|change)\s+(?:all\s+sessions\s+(?:from\s+)?|the\s+)?(.+?)\s+(?:to|into)\s+([A-Za-z0-9 .'\-]+?)(?:\.|$)/i);
    if (vm && !/\d+\s*(min(ute)?s?|hr?s?|hours?)/i.test(t)) return { type: 'venue_change', params: { fromVenueName: vm[1].trim(), toVenueName: vm[2].trim() }, via: 'local' };
    const late = t.match(/(\d+)\s*(min(?:ute)?s?|hr?s?|hours?)\s+late\b/i) || t.match(/\blate\s+by\s+(\d+)\s*(min(?:ute)?s?|hr?s?|hours?)/i);
    if (late) {
      const n = parseInt(late[1], 10) * (/hr|hour/i.test(late[2]) ? 60 : 1);
      return { type: 'time_shift', params: { minutes: n }, via: 'local' };
    }
    // Generic path: action verb + named entities, so free-form updates still act.
    const entities: GeneralChangeParams['entities'] = {
      sessions: [], venues: [], volunteers: [], speakers: [], tasks: [], sponsors: [], attendees: [],
    };
    const seen = new Set<string>();
    const pushName = (name: string) => {
      const n = name.trim().replace(/[.,;:!?]+$/, '');
      if (n.length >= 3 && !seen.has(n.toLowerCase())) { seen.add(n.toLowerCase()); entities.sessions.push(n); }
    };
    const verbRx = /\b(cancel|call off|scrap|add|bring in|onboard|remove|drop|assign|reassign|hand over|update|revise|confirm|reconfirm|verify|announce|notify|escalate|flag|delay|postpone|prepone|reschedule)\b/i;
    for (const m of t.matchAll(/"([^"]{3,60})"|'([^']{3,60})'/g)) pushName(m[1] ?? m[2]);
    for (const m of t.matchAll(/\b([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})+)\b/g)) {
      let phrase = m[1];
      if (m.index === 0) {
        const first = phrase.split(/\s+/)[0];
        if (verbRx.test(first)) phrase = phrase.slice(first.length).trim();
      }
      pushName(phrase);
    }
    const verb = t.match(verbRx);
    const actionMap: Array<[RegExp, GeneralChangeParams['action']]> = [
      [/cancel|call off|scrap/i, 'cancel'], [/add|bring in|onboard/i, 'add'],
      [/remove|drop/i, 'remove'], [/assign|reassign|hand over/i, 'assign'],
      [/update|revise/i, 'update'], [/confirm|reconfirm|verify/i, 'confirm'],
      [/announce|notify/i, 'announce'], [/escalate|flag/i, 'escalate'],
      [/delay|postpone|prepone|reschedule/i, 'delay'],
    ];
    const action = actionMap.find(([rx]) => rx.test(t))?.[1] ?? 'other';
    if (verb || entities.sessions.length > 0) {
      const summary = t.replace(/[.]$/, '');
      return {
        type: 'general',
        params: {
          action, entities,
          summary: summary.charAt(0).toUpperCase() + summary.slice(1),
          detail: verb ? `Detected action: "${verb[1]}" (local fallback).` : 'Parsed from free text (local fallback).',
        },
        via: 'local',
      };
    }
    return { type: 'none', params: {}, via: 'local' };
  }
}

export async function applyPlan(plan: ImpactPlan, archive?: { pageId: string }[]): Promise<{ updated: number; created: { db: string; url: string; id?: string }[]; archived?: string[] }> {
  return post('/api/apply', { plan, archive: archive ?? [] });
}

export async function askQuestion(question: string, records: Records) {
  try {
    return await post('/api/ask', { question, records });
  } catch {
    return { answer: 'Ask service unavailable.', citations: [] };
  }
}
