// POST /api/parse  { text } → { type, params }
// Parses a natural-language ops update into a structured change.
// Uses Gemini 2.5 Flash when GEMINI_API_KEY is set; otherwise a deterministic
// keyword fallback. Never fails: returns { type: 'none' } if unparseable.

import type { ParsedChange } from '../src/lib/types';

function fallbackParse(text: string): ParsedChange {
  const t = text.trim();

  const tm = t.match(/(delay|push(?:\s+back)?|postpone|prepone|bring\s+forward|shift\s+by|move\s+by)\D{0,25}?(\d+)\s*(min(?:ute)?s?|hr?s?|hours?)/i);
  if (tm) {
    const n = parseInt(tm[2], 10) * (/hr|hour/i.test(tm[3]) ? 60 : 1);
    const neg = /prepone|bring\s+forward/i.test(tm[1]);
    return { type: 'time_shift', params: { minutes: neg ? -n : n } };
  }

  const vm = t.match(/(?:move|shift|relocate|change)\s+(?:all\s+sessions\s+(?:from\s+)?|the\s+)?(.+?)\s+(?:to|into)\s+([A-Za-z0-9 .'\-]+?)(?:\.|$)/i);
  if (vm && !/min|hour/i.test(t)) {
    return { type: 'venue_change', params: { fromVenueName: vm[1].trim(), toVenueName: vm[2].trim() } };
  }

  return { type: 'none', params: {} };
}

async function geminiParse(text: string): Promise<ParsedChange | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const prompt =
      'Parse the event ops update into JSON. Respond with ONLY this JSON, no other text: ' +
      '{"type":"venue_change"|"time_shift"|"none","params":{}}. ' +
      'For venue_change, params = {"fromVenueName": string, "toVenueName": string}. ' +
      'For time_shift, params = {"minutes": number} (positive = delay/push back, negative = prepone/bring forward). ' +
      'If it is not an ops change, type = "none" and params = {}. ' +
      `Update: """${text.slice(0, 500)}"""`;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
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
    if (parsed.type === 'venue_change' && parsed.params?.fromVenueName && parsed.params?.toVenueName) return parsed;
    if (parsed.type === 'time_shift' && typeof parsed.params?.minutes === 'number') return parsed;
    return { type: 'none', params: {} };
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const text = String(req.body?.text ?? '');
  if (!text.trim()) return res.status(200).json({ type: 'none', params: {} });

  const viaGemini = await geminiParse(text);
  const out: ParsedChange = viaGemini ?? fallbackParse(text);
  return res.status(200).json({ ...out, via: viaGemini ? 'gemini' : 'fallback' });
}
