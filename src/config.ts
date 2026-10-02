// Sanchalan — Notion wiring. Database IDs are injected here later; code must
// read IDs ONLY from DB_IDS. Property names must match the Notion schema exactly.

import type { DbKey } from './lib/types';

export const DB_IDS: Record<DbKey, string> = {
  venues: 'a52e6af1-5725-4640-9d84-9867bf2f0695',
  events: '0cdea88c-0bf5-4f9c-9a51-eaa19a6a20d6',
  sessions: 'a304ae30-325e-4c41-9ff7-1088bb095146',
  volunteers: '57b8b612-78c9-471f-90ad-cc113db22699',
  tasks: '06b35b94-42d2-4fa5-b975-605132b660b9',
  comms: 'bf5a286c-67c3-4fae-9926-a9338fa7b161',
  impactReports: '7f70df02-aa65-47d5-8f9e-c2eb9709573d',
};

export const DB_TITLES: Record<DbKey, string> = {
  venues: 'Sanchalan · Venues',
  events: 'Sanchalan · Events',
  sessions: 'Sanchalan · Sessions',
  volunteers: 'Sanchalan · Volunteers',
  tasks: 'Sanchalan · Tasks',
  comms: 'Sanchalan · Comms Log',
  impactReports: 'Sanchalan · Impact Reports',
};

// Exact property names per database (must match Notion)
export const PROPS = {
  venues: { Name: 'Name', Capacity: 'Capacity', Location: 'Location', Facilities: 'Facilities' },
  events: { Name: 'Name', Date: 'Date', Venue: 'Venue', Status: 'Status', Organizer: 'Organizer' },
  sessions: { Name: 'Name', Event: 'Event', Venue: 'Venue', Starts: 'Starts', Ends: 'Ends', Speaker: 'Speaker', Format: 'Format', Status: 'Status' },
  volunteers: { Name: 'Name', Role: 'Role', Phone: 'Phone', Skills: 'Skills', Shift: 'Shift', Sessions: 'Sessions' },
  tasks: { Title: 'Title', Owner: 'Owner', Session: 'Session', Due: 'Due', Status: 'Status', Priority: 'Priority', Source: 'Source', Detail: 'Detail' },
  comms: { Name: 'Name', Event: 'Event', Audience: 'Audience', Channel: 'Channel', Draft: 'Draft', Status: 'Status', Source: 'Source' },
  impactReports: { Name: 'Name', Trigger: 'Trigger', Summary: 'Summary', AffectedSessions: 'Affected sessions', NewTasks: 'New tasks', Source: 'Source' },
} as const;

export const SRC = { AI: '🤖 AI-generated', VERIFIED: '✅ Verified' } as const;

export const SESSION_FORMATS = ['Keynote', 'Talk', 'Panel', 'Workshop', 'Networking'] as const;
export const SESSION_STATUSES = ['Scheduled', 'Ready', 'Blocked', 'Done'] as const;
export const VOL_ROLES = ['Registration', 'Stage', 'AV', 'Speaker-care', 'Comms', 'Crowd'] as const;
export const VOL_SHIFTS = ['Morning', 'Afternoon', 'Full-day'] as const;
export const VOL_SKILLS = ['Crowd mgmt', 'AV', 'Design', 'Anchoring', 'First-aid', 'Photography'] as const;
export const TASK_STATUSES = ['Todo', 'In progress', 'Blocked', 'Done'] as const;
export const TASK_PRIORITIES = ['P0', 'P1', 'P2'] as const;
export const EVENT_STATUSES = ['Planning', 'Live', 'Wrapped'] as const;
export const COMMS_AUDIENCE = ['Attendees', 'Speakers', 'Volunteers'] as const;
export const COMMS_CHANNELS = ['WhatsApp', 'Email', 'On-stage'] as const;
export const COMMS_STATUSES = ['Draft', 'Approved', 'Sent'] as const;

export const isNotionConfigured = () => Object.values(DB_IDS).every((id) => id.trim().length > 0);
