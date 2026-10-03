// POST /api/query  { db } → { rows: flat records }
// Fully self-contained (no cross-file runtime imports — Vercel bundles
// api/ files without their relative imports).

const DB_IDS: Record<string, string> = {
  venues: 'b5f59c32-d08a-41f0-9426-28e5c0421ad9',
  events: '39c01111-d274-46ef-b063-97c998c11d02',
  sessions: 'ce4ac85b-98f0-403e-9e9a-b40d60f3b0c0',
  volunteers: '0e65824d-df42-45e0-9ed6-a00c211ceccf',
  tasks: 'a4c14a38-4b14-45a9-9122-798f10ce0e39',
  comms: 'd7120856-337c-4f0f-a92d-08e789396a03',
  impactReports: '52bb9875-130b-4ede-a36d-2673d4631c64',
  attendees: '3ed9bf2c-3456-810b-914e-d065e84db43b',
  speakers: '3ed9bf2c-3456-8104-a25a-deed18594e07',
  sponsors: '3ed9bf2c-3456-8143-a38b-cdd50a1d098d',
  risks: '3ed9bf2c-3456-81c1-b603-e9df1594e35d',
};

const NAPI = 'https://api.notion.com/v1';

async function nfetch(token: string, path: string, method: string, body?: unknown) {
  const res = await fetch(`${NAPI}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Notion API ${res.status}`);
  return data;
}

const titleOf = (o: any) => (o?.title ?? []).map((t: any) => t.plain_text).join('');
const richOf = (o: any) => (o?.rich_text ?? []).map((t: any) => t.plain_text).join('');
const dateOf = (o: any) => o?.date?.start ?? '';
const selOf = (o: any) => o?.select?.name ?? '';
const msOf = (o: any) => (o?.multi_select ?? []).map((x: any) => x.name);
const relOf = (o: any) => (o?.relation ?? []).map((x: any) => x.id);

function notionRowToFlat(db: string, page: any): Record<string, any> {
  const p = page.properties as Record<string, any>;
  const base = { id: page.id };
  switch (db) {
    case 'venues': return { ...base, name: titleOf(p.Name), capacity: p.Capacity?.number ?? 0, location: richOf(p.Location), facilities: msOf(p.Facilities) };
    case 'events': return { ...base, name: titleOf(p.Name), date: dateOf(p.Date), venueId: relOf(p.Venue)[0] ?? '', status: selOf(p.Status), organizer: richOf(p.Organizer) };
    case 'sessions': return { ...base, name: titleOf(p.Name), eventId: relOf(p.Event)[0] ?? '', venueId: relOf(p.Venue)[0] ?? '', starts: dateOf(p.Starts), ends: dateOf(p.Ends), speaker: richOf(p.Speaker), format: selOf(p.Format), status: selOf(p.Status) };
    case 'volunteers': return { ...base, name: titleOf(p.Name), role: selOf(p.Role), phone: p.Phone?.phone_number ?? '', skills: msOf(p.Skills), shift: selOf(p.Shift), sessionIds: relOf(p.Sessions) };
    case 'tasks': return { ...base, title: titleOf(p.Title), ownerId: relOf(p.Owner)[0] ?? '', sessionId: relOf(p.Session)[0] ?? '', due: dateOf(p.Due), status: selOf(p.Status), priority: selOf(p.Priority), source: selOf(p.Source), detail: richOf(p.Detail) };
    case 'comms': return { ...base, name: titleOf(p.Name), eventId: relOf(p.Event)[0] ?? '', audience: selOf(p.Audience), channel: selOf(p.Channel), draft: richOf(p.Draft), status: selOf(p.Status), source: selOf(p.Source) };
    case 'impactReports': return { ...base, name: titleOf(p.Name), trigger: richOf(p.Trigger), summary: richOf(p.Summary), affectedSessionIds: relOf(p['Affected sessions']), newTaskIds: relOf(p['New tasks']), source: selOf(p.Source) };
    case 'attendees': return { ...base, name: titleOf(p.Name), ticket: selOf(p.Ticket), organization: richOf(p.Organization), checkin: selOf(p['Check-in']), sessionIds: relOf(p.Sessions), eventId: relOf(p.Event)[0] ?? '' };
    case 'speakers': return { ...base, name: titleOf(p.Name), sessionId: relOf(p.Session)[0] ?? '', arrival: selOf(p.Arrival), bio: richOf(p.Bio), avRequirements: richOf(p['AV requirements']), contact: richOf(p.Contact), confirmation: selOf(p.Confirmation) };
    case 'sponsors': return { ...base, company: titleOf(p.Company), tier: selOf(p.Tier), contact: richOf(p.Contact), booth: selOf(p.Booth), deliverables: msOf(p.Deliverables), payment: selOf(p.Payment) };
    case 'risks': return { ...base, name: titleOf(p.Name), severity: selOf(p.Severity), category: selOf(p.Category), description: richOf(p.Description), status: selOf(p.Status), source: selOf(p.Source) };
    default: return { ...base };
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  // Allow per-request token/databaseId (custom workspaces), fallback to server defaults
  const token = req.body?.token || process.env.NOTION_TOKEN;
  if (!token) return res.status(501).json({ error: 'NOTION_TOKEN not configured' });

  const db = req.body?.db as string;
  const databaseId = req.body?.databaseId || (db ? DB_IDS[db] : '');
  if (!db || !databaseId) return res.status(400).json({ error: 'Unknown or unconfigured db' });

  try {
    const rows: Record<string, any>[] = [];
    let cursor: string | undefined;
    do {
      const data: any = await nfetch(token, `/databases/${databaseId}/query`, 'POST', {
        start_cursor: cursor,
        page_size: 100,
      });
      for (const p of data.results ?? []) rows.push(notionRowToFlat(db, p));
      cursor = data.has_more ? data.next_cursor ?? undefined : undefined;
    } while (cursor);
    return res.status(200).json({ rows });
  } catch (e: any) {
    return res.status(502).json({ error: `Notion query failed: ${e?.message ?? e}` });
  }
}
