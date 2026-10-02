// POST /api/parse  { text } → { type, params }
// Parses a natural-language ops update into a structured change.
// Uses Gemini 2.5 Flash when GEMINI_API_KEY is set; otherwise a deterministic
// keyword fallback. Never fails: returns { type: 'none' } if unparseable.

import type { GeneralChangeParams, ParsedChange } from '../src/lib/types';

// Normalize raw input so parsers see a consistent shape regardless of how
// the user typed it: collapse whitespace, and ensure terminal punctuation
// (a missing trailing period otherwise makes parsing punctuation-sensitive).
function normalizeInput(text: string): string {
  let t = String(text ?? '').trim().replace(/\s+/g, ' ');
  if (t && !/[.!?]$/.test(t)) t += '.';
  return t;
}

// Exported for unit tests; the Vercel handler below is the only server entrypoint.
export function fallbackParse(text: string): ParsedChange {
  const t = text.trim();

  // Precise patterns first (same as before).
  const tm = t.match(/(delay|push(?:\s+back)?|postpone|prepone|bring\s+forward|shift\s+by|move\s+by)\D{0,25}?(\d+)\s*(min(?:ute)?s?|hr?s?|hours?)/i);
  if (tm) {
    const n = parseInt(tm[2], 10) * (/hr|hour/i.test(tm[3]) ? 60 : 1);
    const neg = /prepone|bring\s+forward/i.test(tm[1]);
    return { type: 'time_shift', params: { minutes: neg ? -n : n } };
  }

  // "running 20 minutes late" / "late by 30 min" → delay
  const late = t.match(/(\d+)\s*(min(?:ute)?s?|hr?s?|hours?)\s+late\b/i) || t.match(/\blate\s+by\s+(\d+)\s*(min(?:ute)?s?|hr?s?|hours?)/i);
  if (late) {
    const n = parseInt(late[1], 10) * (/hr|hour/i.test(late[2]) ? 60 : 1);
    return { type: 'time_shift', params: { minutes: n } };
  }

  const vm = t.match(/(?:move|shift|relocate|change)\s+(?:all\s+sessions\s+(?:from\s+)?|the\s+)?(.+?)\s+(?:to|into)\s+([A-Za-z0-9 .'\-]+?)(?:\.|$)/i);
  // Guard against time-phrasing ("move it by 30 minutes to Hall B" is a
  // time_shift, caught above). NOTE: plain /min|hour/i would false-positive
  // on venue names like "Seminar Hall", so require a number before the unit.
  if (vm && !/\d+\s*(min(ute)?s?|hr?s?|hours?)/i.test(t)) {
    return { type: 'venue_change', params: { fromVenueName: vm[1].trim(), toVenueName: vm[2].trim() } };
  }

  // Generic path: pull an action verb + named entities out of free text,
  // so anything that reads like an ops instruction still acts on the change.
  const verbRx = /\b(cancel|call off|scrap|add|bring in|onboard|remove|drop|assign|reassign|hand over|update|revise|confirm|reconfirm|verify|announce|notify|escalate|flag|delay|postpone|prepone|reschedule)\b/i;
  const vm2 = t.match(verbRx);
  const actionMap: Array<[RegExp, string]> = [
    [/cancel|call off|scrap/i, 'cancel'], [/add|bring in|onboard/i, 'add'],
    [/remove|drop/i, 'remove'], [/assign|reassign|hand over/i, 'assign'],
    [/update|revise/i, 'update'], [/confirm|reconfirm|verify/i, 'confirm'],
    [/announce|notify/i, 'announce'], [/escalate|flag/i, 'escalate'],
    [/delay|postpone|prepone|reschedule/i, 'delay'],
  ];
  const action = (actionMap.find(([rx]) => rx.test(t))?.[1] ?? 'other') as GeneralChangeParams['action'];

  // Quoted names first ("Main Audi"), then Title-Case phrases (2+ words).
  const entities: GeneralChangeParams['entities'] = {
    sessions: [], venues: [], volunteers: [], speakers: [], tasks: [], sponsors: [], attendees: [],
  };
  const seen = new Set<string>();
  const pushName = (name: string) => {
    const n = name.trim().replace(/[.,;:!?]+$/, '');
    if (n.length >= 3 && !seen.has(n.toLowerCase())) {
      seen.add(n.toLowerCase());
      entities.sessions.push(n); // engine re-matches against every record kind
    }
  };
  for (const m of t.matchAll(/"([^"]{3,60})"|'([^']{3,60})'/g)) pushName(m[1] ?? m[2]);
  // Title-Case phrases (2+ words). If the phrase starts the sentence with an
  // action verb ("Assign Priya Sharma…"), strip the verb so the name survives.
  for (const m of t.matchAll(/\b([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]{2,})+)\b/g)) {
    let phrase = m[1];
    if (m.index === 0) {
      const first = phrase.split(/\s+/)[0];
      if (verbRx.test(first)) phrase = phrase.slice(first.length).trim();
    }
    pushName(phrase);
  }

  const hasSignal = vm2 !== null || entities.sessions.length > 0;
  if (!hasSignal) return { type: 'none', params: {} };

  const summary = t.replace(/[.]$/, '');
  return {
    type: 'general',
    params: {
      action,
      summary: summary.charAt(0).toUpperCase() + summary.slice(1),
      entities,
      detail: vm2 ? `Detected action: "${vm2[1]}".` : 'Parsed from free text (fallback).',
    },
  };
}

async function geminiParse(text: string): Promise<ParsedChange | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const prompt =
      'You parse event-operations updates for a hackathon event-ops tool. ' +
      'Handle ANY ops change the operator describes — not just a fixed list of templates. ' +
      'Respond with ONLY one JSON object, no other text.\n' +
      'Schema: {"type":"venue_change"|"time_shift"|"general"|"none","params":{}}.\n' +
      '- venue_change (sessions moved between venues): params={"fromVenueName":string,"toVenueName":string}.\n' +
      '- time_shift (whole schedule delayed/preponed): params={"minutes":number} (positive=delay, negative=prepone).\n' +
      '- general (everything else that IS an ops change — cancellations, additions, reassignments, speaker/volunteer updates, announcements, escalations, …): ' +
      'params={"action":"cancel"|"add"|"remove"|"assign"|"update"|"confirm"|"announce"|"escalate"|"delay"|"other", ' +
      '"summary":string (one-line description, ≤140 chars), ' +
      '"entities":{"sessions":[names],"venues":[names],"volunteers":[names],"speakers":[names],"tasks":[names],"sponsors":[names],"attendees":[names]} (every named thing you can extract, verbatim), ' +
      '"detail":string (extra specifics: who/what/when)}.\n' +
      '- none ONLY if the text is not an ops change at all (greetings, questions about the weather, …). ' +
      'When in doubt, prefer "general" over "none" — the operator typed it as an update for a reason.\n' +
      `Update: """${text.slice(0, 500)}"""`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0 } }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]);
    if (parsed.type === 'venue_change' && parsed.params?.fromVenueName && parsed.params?.toVenueName) {
      parsed.params.fromVenueName = String(parsed.params.fromVenueName).trim();
      parsed.params.toVenueName = String(parsed.params.toVenueName).trim().replace(/[.\s]+$/, '');
      if (parsed.params.fromVenueName && parsed.params.toVenueName) return parsed;
    }
    if (parsed.type === 'time_shift' && typeof parsed.params?.minutes === 'number') return parsed;
    if (parsed.type === 'general' && parsed.params?.summary) {
      const p = parsed.params;
      const cleanArr = (a: any) => (Array.isArray(a) ? a.map(String).map((s) => s.trim()).filter(Boolean).slice(0, 12) : []);
      return {
        type: 'general',
        params: {
          action: typeof p.action === 'string' ? p.action : 'other',
          summary: String(p.summary).trim().slice(0, 200),
          entities: {
            sessions: cleanArr(p.entities?.sessions), venues: cleanArr(p.entities?.venues),
            volunteers: cleanArr(p.entities?.volunteers), speakers: cleanArr(p.entities?.speakers),
            tasks: cleanArr(p.entities?.tasks), sponsors: cleanArr(p.entities?.sponsors),
            attendees: cleanArr(p.entities?.attendees),
          },
          detail: String(p.detail ?? '').trim().slice(0, 400),
        },
      };
    }
    return { type: 'none', params: {} };
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const text = normalizeInput(req.body?.text);
  if (!text) return res.status(200).json({ type: 'none', params: {} });

  const viaGemini = await geminiParse(text);
  // If Gemini says 'none' (or errors), try the deterministic fallback before
  // giving up — a parseable change should never fail because of the LLM.
  const useGemini = viaGemini && viaGemini.type !== 'none';
  const out: ParsedChange = useGemini ? viaGemini : fallbackParse(text);
  return res.status(200).json({ ...out, via: useGemini ? 'gemini' : 'fallback' });
}
