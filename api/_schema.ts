// Shared Notion property-type map + converters between flat records and
// Notion API payloads. Property names match src/config.ts exactly.

import type { DbKey, PropValue } from '../src/lib/types';

type NType = 'title' | 'number' | 'rich_text' | 'date' | 'select' | 'multi_select' | 'relation' | 'phone_number';

export const PROP_TYPES: Record<DbKey, Record<string, NType>> = {
  venues: { Name: 'title', Capacity: 'number', Location: 'rich_text', Facilities: 'multi_select' },
  events: { Name: 'title', Date: 'date', Venue: 'relation', Status: 'select', Organizer: 'rich_text' },
  sessions: { Name: 'title', Event: 'relation', Venue: 'relation', Starts: 'date', Ends: 'date', Speaker: 'rich_text', Format: 'select', Status: 'select' },
  volunteers: { Name: 'title', Role: 'select', Phone: 'phone_number', Skills: 'multi_select', Shift: 'select', Sessions: 'relation' },
  tasks: { Title: 'title', Owner: 'relation', Session: 'relation', Due: 'date', Status: 'select', Priority: 'select', Source: 'select', Detail: 'rich_text' },
  comms: { Name: 'title', Event: 'relation', Audience: 'select', Channel: 'select', Draft: 'rich_text', Status: 'select', Source: 'select' },
  impactReports: { Name: 'title', Trigger: 'rich_text', Summary: 'rich_text', 'Affected sessions': 'relation', 'New tasks': 'relation', Source: 'select' },
};

const P = (page: any) => page.properties as Record<string, any>;
const titleOf = (o: any) => (o?.title ?? []).map((t: any) => t.plain_text).join('');
const richOf = (o: any) => (o?.rich_text ?? []).map((t: any) => t.plain_text).join('');
const dateOf = (o: any) => o?.date?.start ?? '';
const selOf = (o: any) => o?.select?.name ?? '';
const msOf = (o: any) => (o?.multi_select ?? []).map((x: any) => x.name);
const relOf = (o: any) => (o?.relation ?? []).map((x: any) => x.id);

export function notionRowToFlat(db: DbKey, page: any): Record<string, any> {
  const p = P(page);
  const base = { id: page.id };
  switch (db) {
    case 'venues': return { ...base, name: titleOf(p.Name), capacity: p.Capacity?.number ?? 0, location: richOf(p.Location), facilities: msOf(p.Facilities) };
    case 'events': return { ...base, name: titleOf(p.Name), date: dateOf(p.Date), venueId: relOf(p.Venue)[0] ?? '', status: selOf(p.Status), organizer: richOf(p.Organizer) };
    case 'sessions': return { ...base, name: titleOf(p.Name), eventId: relOf(p.Event)[0] ?? '', venueId: relOf(p.Venue)[0] ?? '', starts: dateOf(p.Starts), ends: dateOf(p.Ends), speaker: richOf(p.Speaker), format: selOf(p.Format), status: selOf(p.Status) };
    case 'volunteers': return { ...base, name: titleOf(p.Name), role: selOf(p.Role), phone: p.Phone?.phone_number ?? '', skills: msOf(p.Skills), shift: selOf(p.Shift), sessionIds: relOf(p.Sessions) };
    case 'tasks': return { ...base, title: titleOf(p.Title), ownerId: relOf(p.Owner)[0] ?? '', sessionId: relOf(p.Session)[0] ?? '', due: dateOf(p.Due), status: selOf(p.Status), priority: selOf(p.Priority), source: selOf(p.Source), detail: richOf(p.Detail) };
    case 'comms': return { ...base, name: titleOf(p.Name), eventId: relOf(p.Event)[0] ?? '', audience: selOf(p.Audience), channel: selOf(p.Channel), draft: richOf(p.Draft), status: selOf(p.Status), source: selOf(p.Source) };
    case 'impactReports': return { ...base, name: titleOf(p.Name), trigger: richOf(p.Trigger), summary: richOf(p.Summary), affectedSessionIds: relOf(p['Affected sessions']), newTaskIds: relOf(p['New tasks']), source: selOf(p.Source) };
  }
}

// Convert flat draft fields (camelCase) to Notion props keyed by property name.
const DRAFT_MAP: Record<DbKey, Record<string, string>> = {
  venues: { name: 'Name', capacity: 'Capacity', location: 'Location', facilities: 'Facilities' },
  events: { name: 'Name', date: 'Date', venueId: 'Venue', status: 'Status', organizer: 'Organizer' },
  sessions: { name: 'Name', eventId: 'Event', venueId: 'Venue', starts: 'Starts', ends: 'Ends', speaker: 'Speaker', format: 'Format', status: 'Status' },
  volunteers: { name: 'Name', role: 'Role', phone: 'Phone', skills: 'Skills', shift: 'Shift', sessionIds: 'Sessions' },
  tasks: { title: 'Title', ownerId: 'Owner', sessionId: 'Session', due: 'Due', status: 'Status', priority: 'Priority', source: 'Source', detail: 'Detail' },
  comms: { name: 'Name', eventId: 'Event', audience: 'Audience', channel: 'Channel', draft: 'Draft', status: 'Status', source: 'Source' },
  impactReports: { name: 'Name', trigger: 'Trigger', summary: 'Summary', affectedSessionIds: 'Affected sessions', newTaskIds: 'New tasks', source: 'Source' },
};

export function draftToNotionProps(db: DbKey, draft: Record<string, any>): Record<string, any> {
  const map = DRAFT_MAP[db];
  const props: Record<string, PropValue> = {};
  for (const [field, value] of Object.entries(draft)) {
    if (field === 'id' || value === '' || value === null || value === undefined) continue;
    const prop = map[field];
    if (!prop) continue;
    const t = PROP_TYPES[db][prop];
    if (t === 'relation') {
      props[prop] = Array.isArray(value) ? value.filter(Boolean) : { rel: String(value) };
    } else {
      props[prop] = value as PropValue;
    }
  }
  return toNotionProps(db, props);
}

export function toNotionProps(db: DbKey, props: Record<string, PropValue>): Record<string, any> {
  const types = PROP_TYPES[db];
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
        if (typeof v === 'object' && v !== null && 'rel' in v) out[k] = { relation: [{ id: (v as { rel: string }).rel }] };
        else if (Array.isArray(v)) out[k] = { relation: v.map((id) => ({ id })) };
        else out[k] = { relation: [{ id: String(v) }] };
        break;
    }
  }
  return out;
}
