// Sanchalan dependency engine — PURE functions, no I/O.
// Given current records + an ops change, computes the full blast radius:
// Notion writes (updates + creates), risks, and a human-readable summary.

import { SRC } from '../config';
import type {
  CommsDraft, ImpactDraft, ImpactPlan, PlannedWrite, Records, Risk, TaskDraft,
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
