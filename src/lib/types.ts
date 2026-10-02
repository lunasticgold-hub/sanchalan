// Flat record types shared by the frontend, engine, and API layer.

export type DbKey =
  | 'venues'
  | 'events'
  | 'sessions'
  | 'volunteers'
  | 'tasks'
  | 'comms'
  | 'impactReports';

export interface Venue { id: string; name: string; capacity: number; location: string; facilities: string[] }
export interface EventRec { id: string; name: string; date: string; venueId: string; status: string; organizer: string }
export interface Session {
  id: string; name: string; eventId: string; venueId: string;
  starts: string; ends: string; speaker: string; format: string; status: string;
}
export interface Volunteer {
  id: string; name: string; role: string; phone: string;
  skills: string[]; shift: string; sessionIds: string[];
}
export interface Task {
  id: string; title: string; ownerId: string; sessionId: string;
  due: string; status: string; priority: string; source: string; detail: string;
}
export interface Comms {
  id: string; name: string; eventId: string; audience: string;
  channel: string; draft: string; status: string; source: string;
}
export interface ImpactReport {
  id: string; name: string; trigger: string; summary: string;
  affectedSessionIds: string[]; newTaskIds: string[]; source: string;
}

export interface Records {
  venues: Venue[];
  events: EventRec[];
  sessions: Session[];
  volunteers: Volunteer[];
  tasks: Task[];
  comms: Comms[];
  impactReports: ImpactReport[];
}

// A single relation reference inside update props: { rel: '<pageId>' }.
// Everything else is keyed by exact Notion property name.
export type PropValue = string | number | string[] | null | { rel: string };

export interface PlannedWrite { db: DbKey; pageId: string; props: Record<string, PropValue> }

// Flat drafts for creates (relation targets stay as page ids; apply.ts maps them).
export type TaskDraft = Omit<Task, 'id'>;
export type CommsDraft = Omit<Comms, 'id'>;
export type ImpactDraft = Omit<ImpactReport, 'id'>;

export interface Risk { level: 'P0' | 'P1' | 'P2'; text: string }

export interface ImpactPlan {
  updates: PlannedWrite[];
  newTasks: TaskDraft[];
  newComms: CommsDraft[];
  newImpactReports: ImpactDraft[];
  risks: Risk[];
  summary: string;
}

export type ParsedChange =
  | { type: 'venue_change'; params: { fromVenueName: string; toVenueName: string } }
  | { type: 'time_shift'; params: { minutes: number } }
  | { type: 'none'; params: Record<string, never> };

// A submitted operational change moving through the approval pipeline.
export type ChangeStatus = 'draft' | 'analyzed' | 'applying' | 'applied' | 'cancelled';

export interface ChangeRequest {
  id: string;
  input: string;
  parsed: (ParsedChange & { via?: string }) | null;
  plan: ImpactPlan | null;
  status: ChangeStatus;
  createdAt: string; // ISO
  requestedBy: string;
  approvedBy?: string;
  appliedAt?: string;
  applyResult?: { updated: number; created: { db: string; url: string }[] };
  applyError?: string;
  cancelNote?: string;
  riskAcknowledged?: boolean;
}
