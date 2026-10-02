// POST /api/ask  { question, records } → { answer, citations: [{label, db, pageId}] }
// Simple keyword RAG over the provided records. No external calls.

import type { Records } from '../src/lib/types';

interface Doc { label: string; db: string; pageId: string; text: string; snippet: string }

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const question = String(req.body?.question ?? '').trim();
  const r = req.body?.records as Records | undefined;
  if (!question || !r) return res.status(400).json({ error: 'Missing question or records' });

  const venueName = (id: string) => r.venues.find((v) => v.id === id)?.name ?? '—';
  const sessionName = (id: string) => r.sessions.find((s) => s.id === id)?.name ?? '—';
  const volName = (id: string) => r.volunteers.find((v) => v.id === id)?.name ?? 'Unassigned';

  const docs: Doc[] = [
    ...r.sessions.map((s) => ({
      label: s.name, db: 'sessions', pageId: s.id,
      text: `${s.name} ${s.speaker} ${s.format} ${s.status} ${venueName(s.venueId)} ${s.starts} ${s.ends}`,
      snippet: `${s.format} · ${venueName(s.venueId)} · ${fmtTime(s.starts)}–${fmtTime(s.ends)} · ${s.status}${s.speaker !== '—' ? ` · ${s.speaker}` : ''}`,
    })),
    ...r.tasks.map((t) => ({
      label: t.title, db: 'tasks', pageId: t.id,
      text: `${t.title} ${t.detail} ${t.status} ${t.priority} ${t.source} ${volName(t.ownerId)} ${sessionName(t.sessionId)}`,
      snippet: `${t.priority} · ${t.status} · owner ${volName(t.ownerId)} · due ${fmtTime(t.due)} — ${t.detail.slice(0, 90)}`,
    })),
    ...r.volunteers.map((v) => ({
      label: v.name, db: 'volunteers', pageId: v.id,
      text: `${v.name} ${v.role} ${v.shift} ${v.skills.join(' ')} ${v.sessionIds.map(sessionName).join(' ')}`,
      snippet: `${v.role} · ${v.shift} shift · skills: ${v.skills.join(', ')} · sessions: ${v.sessionIds.map(sessionName).join('; ') || 'none'}`,
    })),
    ...r.comms.map((c) => ({
      label: c.name, db: 'comms', pageId: c.id,
      text: `${c.name} ${c.audience} ${c.channel} ${c.status} ${c.source} ${c.draft}`,
      snippet: `${c.audience} · ${c.channel} · ${c.status} — ${c.draft.slice(0, 100)}`,
    })),
  ];

  const tokens = question.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  const scored = docs
    .map((d) => {
      const hay = d.text.toLowerCase();
      let score = 0;
      for (const t of tokens) if (hay.includes(t)) score += t.length > 4 ? 2 : 1;
      return { d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (scored.length === 0) {
    return res.status(200).json({
      answer: 'I could not find anything relevant in the current event records. Try asking about sessions, tasks, volunteers, or comms.',
      citations: [],
    });
  }

  const answer = scored.map((x) => `• ${x.d.label} — ${x.d.snippet}`).join('\n');
  const citations = scored.map((x) => ({ label: x.d.label, db: x.d.db, pageId: x.d.pageId }));
  return res.status(200).json({ answer, citations });
}

function fmtTime(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
