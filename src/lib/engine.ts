// Sanchalan dependency engine — PURE functions, no I/O.
// Given current records + an ops change, computes the full blast radius:
// Notion writes (updates + creates), risks, and a human-readable summary.

import { SRC } from '../config';
import type {
  CommsDraft, GeneralChangeParams, ImpactDraft, ImpactPlan, PlannedWrite, Records, Risk, TaskDraft,
} from './types';

export const EST_ATTENDEES = 200;

// Volunteer shift windows (24h): [startHour, endHour)
const SHIFT_WINDOWS: Record<string, [number, number]> = {
  'Morning': [8, 12],
  'Afternoon': [12, 17],
  'Full-day': [8, 20],
};

const ci = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const containsCI = (hay: string, needle: string) =>
  hay.toLowerCase().includes(needle.toLowerCase());

function emptyPlan(summary: string): ImpactPlan {
  return { updates: [], newTasks: [], newComms: [], newImpactReports: [], risks: [], summary };
}

function shiftISO(iso: string, minutes: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function hourOf(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}

export function applyVenueChange(
  r: Records,
  opts: { fromVenueName: string; toVenueName: string },
): ImpactPlan {
  const from = r.venues.find((v) => ci(v.name, opts.fromVenueName.trim()));
  const to = r.venues.find((v) => ci(v.name, opts.toVenueName.trim()));
  const risks: Risk[] = [];
  const updates: PlannedWrite[] = [];
  const newTasks: TaskDraft[] = [];
  const newComms: CommsDraft[] = [];
  const newImpactReports: ImpactDraft[] = [];

  if (!from || !to) {
    const missing = [!from && `"${opts.fromVenueName}"`, !to && `"${opts.toVenueName}"`]
      .filter(Boolean).join(' / ');
    const plan = emptyPlan(`Unknown venue ${missing} — no changes computed.`);
    plan.risks.push({ level: 'P0', text: `Venue not found: ${missing}. Verify the venue name.` });
    return plan;
  }

  const moved = r.sessions.filter((s) => s.venueId === from.id);
  if (moved.length === 0) {
    const plan = emptyPlan(`No sessions are currently at ${from.name} — nothing to move.`);
    plan.risks.push({ level: 'P2', text: `No sessions found at ${from.name}; check the venue name.` });
    return plan;
  }

  // 1. Move sessions
  for (const s of moved) {
    updates.push({ db: 'sessions', pageId: s.id, props: { Venue: { rel: to.id } } });
  }

  // 2. Capacity check → P0 risk + task
  if (to.capacity < EST_ATTENDEES) {
    risks.push({
      level: 'P0',
      text: `${to.name} capacity ${to.capacity} < expected ${EST_ATTENDEES} attendees — overflow risk.`,
    });
    newTasks.push({
      title: `Overflow plan: ${to.name} holds ${to.capacity}, need ~${EST_ATTENDEES}`,
      ownerId: '', sessionId: moved[0].id, due: moved[0].starts,
      status: 'Todo', priority: 'P0', source: SRC.AI,
      detail: `AI-generated: ${to.name} fits ${to.capacity} but ~${EST_ATTENDEES} RSVPs expected. Options: cap registrations, add overflow viewing at ${from.name}, or split sessions.`,
    });
  }

  // 3. Rewrite tasks that mention the old venue
  for (const t of r.tasks) {
    if (containsCI(t.detail, from.name) || containsCI(t.title, from.name)) {
      const rx = new RegExp(from.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      updates.push({
        db: 'tasks', pageId: t.id,
        props: {
          Title: t.title.replace(rx, to.name),
          Detail: t.detail.replace(rx, to.name),
        },
      });
    }
  }

  // 4. Volunteers on moved sessions
  const movedIds = new Set(moved.map((s) => s.id));
  const flaggedVols = r.volunteers.filter((v) => v.sessionIds.some((id) => movedIds.has(id)));
  if (flaggedVols.length > 0) {
    risks.push({
      level: 'P1',
      text: `${flaggedVols.length} volunteer(s) assigned to moved sessions need reconfirmation: ${flaggedVols.map((v) => v.name).join(', ')}.`,
    });
  }

  // 5. Auto comms draft
  const sessionList = moved.map((s) => `• ${s.name}`).join('\n');
  newComms.push({
    name: 'Venue change announcement',
    eventId: moved[0].eventId,
    audience: 'Attendees', channel: 'WhatsApp', status: 'Draft', source: SRC.AI,
    draft: `Update: the following sessions move from ${from.name} to ${to.name}:\n${sessionList}\nTimings unchanged. New venue: ${to.location}. Please share with your teams.`,
  });

  const summary =
    `Moved ${moved.length} session(s) from ${from.name} → ${to.name}. ` +
    `${updates.length - moved.length} task(s) rewritten. ` +
    `${flaggedVols.length} volunteer(s) flagged. ` +
    `1 comms draft created.`;

  newImpactReports.push({
    name: `Impact report — venue change ${from.name} → ${to.name}`,
    trigger: `Ops update: move all sessions from ${from.name} to ${to.name}`,
    summary,
    affectedSessionIds: moved.map((s) => s.id),
    newTaskIds: [],
    source: SRC.AI,
  });

  return { updates, newTasks, newComms, newImpactReports, risks, summary };
}

export function applyTimeShift(r: Records, opts: { minutes: number }): ImpactPlan {
  const { minutes } = opts;
  const updates: PlannedWrite[] = [];
  const newTasks: TaskDraft[] = [];
  const risks: Risk[] = [];
  const dir = minutes > 0 ? 'delayed' : 'preponed';

  for (const s of r.sessions) {
    updates.push({
      db: 'sessions', pageId: s.id,
      props: { Starts: shiftISO(s.starts, minutes), Ends: shiftISO(s.ends, minutes) },
    });
  }

  // Volunteer shift conflicts
  const byId = new Map(r.sessions.map((s) => [s.id, s]));
  for (const v of r.volunteers) {
    const win = SHIFT_WINDOWS[v.shift];
    if (!win) continue;
    for (const sid of v.sessionIds) {
      const s = byId.get(sid);
      if (!s) continue;
      const ns = hourOf(shiftISO(s.starts, minutes));
      const ne = hourOf(shiftISO(s.ends, minutes));
      if (ns < win[0] || ne > win[1]) {
        risks.push({
          level: 'P1',
          text: `${v.name} (${v.shift} shift) conflicts: "${s.name}" now runs outside ${v.shift} hours.`,
        });
        newTasks.push({
          title: `Reconfirm ${v.name} for "${s.name}"`,
          ownerId: v.id, sessionId: sid, due: shiftISO(s.starts, minutes),
          status: 'Todo', priority: 'P1', source: SRC.AI,
          detail: `AI-generated: session ${dir} by ${Math.abs(minutes)} min; volunteer's ${v.shift} shift no longer covers it. Reconfirm or reassign.`,
        });
        break; // one task per volunteer
      }
    }
  }

  const summary =
    `Shifted ${r.sessions.length} session(s) ${dir} by ${Math.abs(minutes)} min. ` +
    `${risks.length} volunteer shift conflict(s) detected.`;

  const newImpactReports: ImpactDraft[] = [{
    name: `Impact report — schedule ${dir} ${Math.abs(minutes)} min`,
    trigger: `Ops update: ${dir} all sessions by ${Math.abs(minutes)} min`,
    summary,
    affectedSessionIds: r.sessions.map((s) => s.id),
    newTaskIds: [],
    source: SRC.AI,
  }];

  return { updates, newTasks, newComms: [], newImpactReports, risks, summary };
}

// ---------- general change ----------
// Acts on the change as described: match every named entity against the
// Notion records, flag the people/sessions involved, surface risks, and
// generate follow-up tasks + a comms draft for human approval. The engine
// never guesses field-level writes for a change it can't model precisely.

type EntityKind = 'sessions' | 'venues' | 'volunteers' | 'speakers' | 'tasks' | 'sponsors' | 'attendees';

const ENTITY_LABEL: Record<EntityKind, string> = {
  sessions: 'session', venues: 'venue', volunteers: 'volunteer', speakers: 'speaker',
  tasks: 'task', sponsors: 'sponsor', attendees: 'attendee',
};

function recordName(db: EntityKind, rec: any): string {
  if (db === 'tasks') return String(rec.title ?? '');
  if (db === 'sponsors') return String(rec.company ?? '');
  return String(rec.name ?? '');
}

// Match quality: exact name > whole-word mention > loose substring.
function matchScore(record: string, name: string): number {
  const r = record.toLowerCase();
  const n = name.toLowerCase().trim();
  if (!n || !r) return 0;
  if (r === n) return 3;
  if (new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(r)) return 2;
  if (r.includes(n) || n.includes(r)) return 1;
  return 0;
}

function findBest(records: any[], db: EntityKind, name: string): any | null {
  let best: any = null;
  let bestScore = 0;
  for (const rec of records) {
    const s = matchScore(recordName(db, rec), name);
    if (s > bestScore) { bestScore = s; best = rec; }
  }
  return best;
}

export function applyGeneralChange(r: Records, params: GeneralChangeParams): ImpactPlan {
  const { action, summary, entities, detail } = params;
  const updates: PlannedWrite[] = [];
  const newTasks: TaskDraft[] = [];
  const newComms: CommsDraft[] = [];
  const risks: Risk[] = [];

  const matched: Record<EntityKind, { id: string; name: string }[]> = {
    sessions: [], venues: [], volunteers: [], speakers: [], tasks: [], sponsors: [], attendees: [],
  };
  const missing: string[] = [];

  const seenIds = new Set<string>();
  const kinds = Object.keys(ENTITY_LABEL) as EntityKind[];
  for (const kind of kinds) {
    const names = (entities[kind] ?? []).map((n) => n.trim()).filter(Boolean);
    for (const name of names) {
      // Search every record kind: the parser buckets names loosely, so a
      // venue name may arrive in the sessions bucket and vice versa.
      let best: { kind: EntityKind; id: string; name: string; score: number } | null = null;
      for (const k of kinds) {
        const rec = findBest(r[k] as any[], k, name);
        if (rec) {
          const score = matchScore(recordName(k, rec), name);
          if (best === null || score > best.score) best = { kind: k, id: rec.id, name: recordName(k, rec), score };
        }
      }
      if (best !== null && !seenIds.has(best.id)) {
        seenIds.add(best.id);
        matched[best.kind].push({ id: best.id, name: best.name });
      } else if (best === null) {
        missing.push(name);
      }
    }
  }

  const affectedSessionIds = matched.sessions.map((s) => s.id);
  const affectedSessions = r.sessions.filter((s) => affectedSessionIds.includes(s.id));

  // 1. Unknown entities → P2 risks (verify before acting)
  for (const m of missing) {
    risks.push({ level: 'P2', text: `Named "${m}" was not found in Notion — verify the name before acting.` });
  }

  // 2. Volunteers on affected sessions need reconfirmation
  const movedIds = new Set(affectedSessionIds);
  const flaggedVols = r.volunteers.filter((v) => v.sessionIds.some((id) => movedIds.has(id)));
  const extraVols = matched.volunteers.filter((v) => !flaggedVols.some((f) => f.id === v.id));
  if (flaggedVols.length > 0 || extraVols.length > 0) {
    const names = [...flaggedVols.map((v) => v.name), ...extraVols.map((v) => v.name)];
    risks.push({
      level: 'P1',
      text: `${names.length} volunteer(s) involved — reconfirm: ${names.join(', ')}.`,
    });
  }

  // 3. Capacity sanity check on mentioned venues
  for (const v of matched.venues) {
    const rec = r.venues.find((x) => x.id === v.id);
    if (rec && rec.capacity < EST_ATTENDEES) {
      risks.push({
        level: 'P1',
        text: `${rec.name} capacity ${rec.capacity} < expected ~${EST_ATTENDEES} attendees — confirm it can host the affected sessions.`,
      });
    }
  }

  // 4. Action-specific risks
  if (action === 'cancel' && affectedSessions.length > 0) {
    risks.push({
      level: 'P0',
      text: `Cancelling ${affectedSessions.length} session(s) affects registered attendees — announce before removing from the schedule.`,
    });
  }
  if (action === 'escalate') {
    risks.push({ level: 'P1', text: 'Escalated change — needs organizer sign-off before anything is applied.' });
  }

  // 5. Follow-up tasks (AI-generated, human approves)
  const actionVerb: Record<string, string> = {
    cancel: 'Cancel', add: 'Add', remove: 'Remove', assign: 'Assign', update: 'Update',
    confirm: 'Confirm', announce: 'Announce', escalate: 'Escalate', delay: 'Reschedule', other: 'Handle',
  };
  const pastTense: Record<string, string> = {
    cancel: 'Cancelled', add: 'Added', remove: 'Removed', assign: 'Assigned', update: 'Updated',
    confirm: 'Confirmed', announce: 'Announced', escalate: 'Escalated', delay: 'Rescheduled', other: 'Handled',
  };
  const verb = actionVerb[action] ?? 'Handle';
  const verbPast = pastTense[action] ?? 'Handled';
  for (const s of affectedSessions) {
    const owner = r.volunteers.find((v) => v.sessionIds.includes(s.id));
    newTasks.push({
      title: `${verb} "${s.name}" — ${summary}`,
      ownerId: owner?.id ?? '', sessionId: s.id, due: s.starts,
      status: 'Todo', priority: action === 'cancel' ? 'P0' : 'P1', source: SRC.AI,
      detail: `AI-generated from ops update: "${summary}". ${detail ? 'Details: ' + detail + '. ' : ''}Verify in Notion, then mark done.`,
    });
  }
  for (const v of matched.volunteers) {
    if (!newTasks.some((t) => t.ownerId === v.id)) {
      newTasks.push({
        title: `${verb} — brief ${v.name}: ${summary}`,
        ownerId: v.id, sessionId: affectedSessionIds[0] ?? '', due: affectedSessions[0]?.starts ?? '',
        status: 'Todo', priority: 'P1', source: SRC.AI,
        detail: `AI-generated from ops update: "${summary}". ${detail ? 'Details: ' + detail : ''}`,
      });
    }
  }
  if (affectedSessions.length === 0 && matched.volunteers.length === 0 && missing.length > 0) {
    newTasks.push({
      title: `Verify change details: ${summary}`,
      ownerId: '', sessionId: '', due: '',
      status: 'Todo', priority: 'P2', source: SRC.AI,
      detail: `AI-generated: named entities could not be matched to Notion records. ${detail}`,
    });
  }

  // 6. Comms draft
  const who: string[] = [];
  if (affectedSessions.length) who.push(`${affectedSessions.length} session(s): ${affectedSessions.map((s) => s.name).join(', ')}`);
  if (matched.venues.length) who.push(`venue(s): ${matched.venues.map((v) => v.name).join(', ')}`);
  newComms.push({
    name: 'Operational update',
    eventId: affectedSessions[0]?.eventId ?? r.events[0]?.id ?? '',
    audience: 'Attendees', channel: 'WhatsApp', status: 'Draft', source: SRC.AI,
    draft: `Update: ${summary}${who.length ? `\nAffected: ${who.join('; ')}.` : ''}${detail ? `\n${detail}` : ''}\n— Team`,
  });

  const entityCount = (Object.keys(matched) as EntityKind[]).reduce((n, k) => n + matched[k].length, 0);
  const summaryText =
    `${verbPast} change: ${summary} ` +
    `Matched ${entityCount} entit${entityCount === 1 ? 'y' : 'ies'} in Notion` +
    (missing.length ? ` (${missing.length} unmatched)` : '') + '. ' +
    `${newTasks.length} follow-up task(s), 1 comms draft created. ` +
    `${risks.length} risk(s) flagged for review.`;

  const newImpactReports: ImpactDraft[] = [{
    name: `Impact report — ${summary.slice(0, 60)}`,
    trigger: `Ops update: ${summary}`,
    summary: summaryText,
    affectedSessionIds,
    newTaskIds: [],
    source: SRC.AI,
  }];

  return { updates, newTasks, newComms, newImpactReports, risks, summary: summaryText };
}
