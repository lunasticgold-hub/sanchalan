// Sanchalan — Notion wiring. Database IDs are injected here later; code must
// read IDs ONLY from DB_IDS. Property names must match the Notion schema exactly.

import type { DbKey } from './lib/types';

export const DB_IDS: Record<DbKey, string> = {
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

export const DB_TITLES: Record<DbKey, string> = {
  venues: 'Sanchalan · Venues',
  events: 'Sanchalan · Events',
  sessions: 'Sanchalan · Sessions',
  volunteers: 'Sanchalan · Volunteers',
  tasks: 'Sanchalan · Tasks',
  comms: 'Sanchalan · Comms Log',
  impactReports: 'Sanchalan · Impact Reports',
  attendees: 'Sanchalan · Attendees',
  speakers: 'Sanchalan · Speakers',
  sponsors: 'Sanchalan · Sponsors',
  risks: 'Sanchalan · Risks',
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
