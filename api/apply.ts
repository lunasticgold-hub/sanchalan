// POST /api/apply  { plan } → { updated, created: [{db, url}] }
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
};

const SRC_AI = '🤖 AI-generated';

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

type NType = 'title' | 'number' | 'rich_text' | 'date' | 'select' | 'multi_select' | 'relation' | 'phone_number';

const PROP_TYPES: Record<string, Record<string, NType>> = {
  venues: { Name: 'title', Capacity: 'number', Location: 'rich_text', Facilities: 'multi_select' },
  events: { Name: 'title', Date: 'date', Venue: 'relation', Status: 'select', Organizer: 'rich_text' },
  sessions: { Name: 'title', Event: 'relation', Venue: 'relation', Starts: 'date', Ends: 'date', Speaker: 'rich_text', Format: 'select', Status: 'select' },
  volunteers: { Name: 'title', Role: 'select', Phone: 'phone_number', Skills: 'multi_select', Shift: 'select', Sessions: 'relation' },
  tasks: { Title: 'title', Owner: 'relation', Session: 'relation', Due: 'date', Status: 'select', Priority: 'select', Source: 'select', Detail: 'rich_text' },
  comms: { Name: 'title', Event: 'relation', Audience: 'select', Channel: 'select', Draft: 'rich_text', Status: 'select', Source: 'select' },
  impactReports: { Name: 'title', Trigger: 'rich_text', Summary: 'rich_text', 'Affected sessions': 'relation', 'New tasks': 'relation', Source: 'select' },
};

const DRAFT_MAP: Record<string, Record<string, string>> = {
  venues: { name: 'Name', capacity: 'Capacity', location: 'Location', facilities: 'Facilities' },
  events: { name: 'Name', date: 'Date', venueId: 'Venue', status: 'Status', organizer: 'Organizer' },
  sessions: { name: 'Name', eventId: 'Event', venueId: 'Venue', starts: 'Starts', ends: 'Ends', speaker: 'Speaker', format: 'Format', status: 'Status' },
  volunteers: { name: 'Name', role: 'Role', phone: 'Phone', skills: 'Skills', shift: 'Shift', sessionIds: 'Sessions' },
  tasks: { title: 'Title', ownerId: 'Owner', sessionId: 'Session', due: 'Due', status: 'Status', priority: 'Priority', source: 'Source', detail: 'Detail' },
  comms: { name: 'Name', eventId: 'Event', audience: 'Audience', channel: 'Channel', draft: 'Draft', status: 'Status', source: 'Source' },
  impactReports: { name: 'Name', trigger: 'Trigger', summary: 'Summary', affectedSessionIds: 'Affected sessions', newTaskIds: 'New tasks', source: 'Source' },
};

function toNotionProps(db: string, props: Record<string, any>): Record<string, any> {
  const types = PROP_TYPES[db] || {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    switch (types[k]) {
      case 'title': out[k] = { title: [{ text: { content: String(v) } }] }; break;
      case 'rich_text': out[k] = { rich_text: [{ text: { content: String(v) } }] }; break;
      case 'number': out[k] = { number: Number(v) }; break;
      case 'date': out[k] = { date: { start: String(v) } }; break;
      case 'select': out[k] = { select: { name: String(v) } }; break;
      case 'multi_select': out[k] = { multi_select: (v as string[]).map((name) => ({ name })) }; break;
      case 'phone_number': out[k] = { phone_number: String(v) }; break;
      case 'relation':
        if (typeof v === 'object' && v !== null && 'rel' in v) out[k] = { relation: [{ id: (v as any).rel }] };
        else if (Array.isArray(v)) out[k] = { relation: v.map((id) => ({ id })) };
        else out[k] = { relation: [{ id: String(v) }] };
        break;
      default: break;
    }
  }
  return out;
}

function draftToNotionProps(db: string, draft: Record<string, any>): Record<string, any> {
  const map = DRAFT_MAP[db] || {};
  const props: Record<string, any> = {};
  for (const [field, value] of Object.entries(draft)) {
    if (field === 'id' || value === '' || value === null || value === undefined) continue;
    const prop = map[field];
    if (!prop) continue;
    const t = (PROP_TYPES[db] || {})[prop];
    if (t === 'relation') {
      props[prop] = Array.isArray(value) ? value.filter(Boolean) : { rel: String(value) };
    } else {
      props[prop] = value;
    }
  }
  return toNotionProps(db, props);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(501).json({ error: 'NOTION_TOKEN not configured' });

  const plan = req.body?.plan as any;
  if (!plan) return res.status(400).json({ error: 'Missing plan' });

  const created: { db: string; url: string }[] = [];
  let updated = 0;

  try {
    for (const u of plan.updates ?? []) {
      if (!DB_IDS[u.db]) continue;
      await nfetch(token, `/pages/${u.pageId}`, 'PATCH', { properties: toNotionProps(u.db, u.props ?? {}) });
      updated++;
    }
    const creates: { db: string; draft: Record<string, any> }[] = [
      ...(plan.newTasks ?? []).map((d: any) => ({ db: 'tasks', draft: d })),
      ...(plan.newComms ?? []).map((d: any) => ({ db: 'comms', draft: d })),
      ...(plan.newImpactReports ?? []).map((d: any) => ({ db: 'impactReports', draft: d })),
    ];
    for (const c of creates) {
      if (!DB_IDS[c.db]) continue;
      const props = draftToNotionProps(c.db, { ...c.draft, source: c.draft.source || SRC_AI });
      const page: any = await nfetch(token, '/pages', 'POST', {
        parent: { database_id: DB_IDS[c.db] },
        properties: props,
      });
      created.push({ db: c.db, url: page.url ?? '' });
    }
    return res.status(200).json({ updated, created });
  } catch (e: any) {
    return res.status(502).json({ error: `Notion write failed: ${e?.message ?? e}`, updated, created });
  }
}
