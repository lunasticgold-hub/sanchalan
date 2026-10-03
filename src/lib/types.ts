// Flat record types shared by the frontend, engine, and API layer.

export type DbKey =
  | 'venues'
  | 'events'
  | 'sessions'
  | 'volunteers'
  | 'tasks'
  | 'comms'
  | 'impactReports'
  | 'attendees'
  | 'speakers'
  | 'sponsors'
  | 'risks';

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
export interface Attendee {
  id: string; name: string; ticket: string; organization: string;
  checkin: string; sessionIds: string[]; eventId: string;
}
export interface Speaker {
  id: string; name: string; sessionId: string; arrival: string;
  bio: string; avRequirements: string; contact: string; confirmation: string;
}
export interface Sponsor {
  id: string; company: string; tier: string; contact: string;
  booth: string; deliverables: string[]; payment: string;
}
export interface RiskRec {
  id: string; name: string; severity: string; category: string;
  description: string; status: string; source: string;
}

export interface Records {
  venues: Venue[];
  events: EventRec[];
  sessions: Session[];
  volunteers: Volunteer[];
  tasks: Task[];
  comms: Comms[];
  impactReports: ImpactReport[];
  attendees: Attendee[];
  speakers: Speaker[];
  sponsors: Sponsor[];
  risks: RiskRec[];
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
  | { type: 'general'; params: GeneralChangeParams }
  | { type: 'none'; params: Record<string, never> };

// A change the engine can't model precisely, but can still act on:
// named entities are matched against Notion records, risks are flagged,
// and follow-up tasks + comms drafts are generated for human approval.
export interface GeneralChangeParams {
  action:
    | 'cancel' | 'add' | 'remove' | 'assign' | 'update' | 'confirm'
    | 'announce' | 'escalate' | 'delay' | 'other';
  summary: string;
  entities: {
    sessions: string[];
    venues: string[];
    volunteers: string[];
    speakers: string[];
    tasks: string[];
    sponsors: string[];
    attendees: string[];
  };
  detail: string;
}

// A submitted operational change moving through the approval pipeline.
export type ChangeStatus = 'draft' | 'analyzed' | 'applying' | 'applied' | 'cancelled' | 'undone';

export interface ChangeRequest {
  id: string;
  input: string;
  parsed: (ParsedChange & { via?: string }) | null;
  plan: ImpactPlan | null;
  status: ChangeStatus;
  createdAt: string; // ISO
  requestedBy: string;
  eventId?: string; // event the change was analyzed against (for correct Notion creds at apply)
  approvedBy?: string;
  appliedAt?: string;
  applyResult?: { updated: number; created: { db: string; url: string }[] };
  applyError?: string;
  cancelNote?: string;
  // Rollback data captured at apply time for Undo
  rollback?: {
    updates: { db: string; pageId: string; props: Record<string, any> }[];
    createdIds: { db: string; pageId: string }[];
  };
  undoneAt?: string;
  riskAcknowledged?: boolean;
}
