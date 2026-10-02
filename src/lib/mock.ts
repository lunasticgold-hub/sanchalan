// Demo dataset: "BBSR Founders Meetup #1" — 2026-10-10.
// Used whenever no Notion backend is configured (bannered DEMO DATA in the UI).

import { SRC } from '../config';
import type { Records } from './types';

export const MOCK: Records = {
  venues: [
    { id: 'v-main', name: 'Main Audi', capacity: 300, location: 'KIIT Campus 15, Bhubaneswar', facilities: ['Projector', 'Mic', 'Stage', 'WiFi', 'Parking'] },
    { id: 'v-hallb', name: 'Seminar Hall B', capacity: 120, location: 'KIIT Campus 12, Bhubaneswar', facilities: ['Projector', 'Mic', 'WiFi'] },
    { id: 'v-plaza', name: 'Outdoor Plaza', capacity: 500, location: 'KIIT Campus 6, Bhubaneswar', facilities: ['Stage', 'Parking'] },
  ],
  events: [
    { id: 'e-1', name: 'BBSR Founders Meetup #1', date: '2026-10-10', venueId: 'v-main', status: 'Planning', organizer: 'ContentOra Media' },
  ],
  sessions: [
    { id: 's-1', name: 'Registration & Networking', eventId: 'e-1', venueId: 'v-plaza', starts: '2026-10-10T09:00', ends: '2026-10-10T09:45', speaker: '—', format: 'Networking', status: 'Scheduled' },
    { id: 's-2', name: 'Opening Keynote: Building in Bhubaneswar', eventId: 'e-1', venueId: 'v-main', starts: '2026-10-10T10:00', ends: '2026-10-10T10:45', speaker: 'Abhigyan Rai', format: 'Keynote', status: 'Ready' },
    { id: 's-3', name: 'Panel: Fundraising 101', eventId: 'e-1', venueId: 'v-main', starts: '2026-10-10T11:00', ends: '2026-10-10T12:00', speaker: 'Priya Sharma', format: 'Panel', status: 'Scheduled' },
    { id: 's-4', name: 'Workshop: GTM for Student Founders', eventId: 'e-1', venueId: 'v-hallb', starts: '2026-10-10T13:00', ends: '2026-10-10T14:30', speaker: 'Rohit Das', format: 'Workshop', status: 'Scheduled' },
    { id: 's-5', name: 'Demo Hour & Close', eventId: 'e-1', venueId: 'v-plaza', starts: '2026-10-10T15:00', ends: '2026-10-10T16:30', speaker: '—', format: 'Networking', status: 'Scheduled' },
  ],
  volunteers: [
    { id: 'vol-1', name: 'Tanisha', role: 'Stage', phone: '+91 98765 40001', skills: ['Anchoring', 'Crowd mgmt'], shift: 'Full-day', sessionIds: ['s-2', 's-3'] },
    { id: 'vol-2', name: 'Sneha', role: 'Registration', phone: '+91 98765 40002', skills: ['Crowd mgmt', 'Design'], shift: 'Morning', sessionIds: ['s-1'] },
    { id: 'vol-3', name: 'Aarav', role: 'AV', phone: '+91 98765 40003', skills: ['AV', 'Photography'], shift: 'Full-day', sessionIds: ['s-2', 's-3', 's-4'] },
    { id: 'vol-4', name: 'Meera', role: 'Speaker-care', phone: '+91 98765 40004', skills: ['First-aid', 'Anchoring'], shift: 'Afternoon', sessionIds: ['s-4', 's-5'] },
    { id: 'vol-5', name: 'Kabir', role: 'Crowd', phone: '+91 98765 40005', skills: ['Crowd mgmt', 'First-aid'], shift: 'Morning', sessionIds: ['s-1', 's-2'] },
    { id: 'vol-6', name: 'Ishita', role: 'Comms', phone: '+91 98765 40006', skills: ['Design', 'Photography'], shift: 'Full-day', sessionIds: ['s-5'] },
  ],
  tasks: [
    { id: 't-1', title: 'Print 250 attendee badges', ownerId: 'vol-2', sessionId: 's-1', due: '2026-10-09T18:00', status: 'In progress', priority: 'P0', source: SRC.VERIFIED, detail: 'Badge template final; print at Campus 6 kiosk.' },
    { id: 't-2', title: 'Test projector + clicker in Main Audi', ownerId: 'vol-3', sessionId: 's-2', due: '2026-10-09T17:00', status: 'Todo', priority: 'P0', source: SRC.VERIFIED, detail: 'Keynote deck is 16:9; confirm HDMI + backup laptop in Main Audi.' },
    { id: 't-3', title: 'Confirm keynote speaker slot', ownerId: 'vol-4', sessionId: 's-2', due: '2026-10-08T20:00', status: 'Done', priority: 'P0', source: SRC.VERIFIED, detail: 'Speaker confirmed for 10:00 keynote at Main Audi.' },
    { id: 't-4', title: 'Arrange 4 handheld mics for panel', ownerId: 'vol-3', sessionId: 's-3', due: '2026-10-09T16:00', status: 'Todo', priority: 'P1', source: SRC.AI, detail: 'Panel has 3 guests + moderator; borrow 2 mics from Seminar Hall B inventory.' },
    { id: 't-5', title: 'Set up registration desk at Outdoor Plaza', ownerId: 'vol-2', sessionId: 's-1', due: '2026-10-10T08:00', status: 'Todo', priority: 'P0', source: SRC.VERIFIED, detail: 'Two tables, banner stand, QR check-in sheet for Outdoor Plaza entry.' },
    { id: 't-6', title: 'Share parking map with attendees', ownerId: 'vol-6', sessionId: 's-1', due: '2026-10-09T12:00', status: 'Todo', priority: 'P1', source: SRC.AI, detail: 'WhatsApp broadcast with Campus 6 parking map + entry gate pin.' },
    { id: 't-7', title: 'Print workshop handouts (120)', ownerId: 'vol-4', sessionId: 's-4', due: '2026-10-09T18:00', status: 'Todo', priority: 'P1', source: SRC.VERIFIED, detail: 'GTM worksheet for Seminar Hall B; 120 copies max (hall capacity).' },
    { id: 't-8', title: 'Brief photographers on shot list', ownerId: 'vol-6', sessionId: 's-5', due: '2026-10-09T19:00', status: 'In progress', priority: 'P2', source: SRC.AI, detail: 'Stage wide shots + founder demo close-ups at Outdoor Plaza.' },
    { id: 't-9', title: 'Water + green room for speakers', ownerId: 'vol-4', sessionId: 's-2', due: '2026-10-10T09:00', status: 'Todo', priority: 'P2', source: SRC.VERIFIED, detail: 'Green room behind Main Audi stage; 6 bottles + tea.' },
    { id: 't-10', title: 'Rehearse AV cues with anchor', ownerId: 'vol-3', sessionId: 's-2', due: '2026-10-09T17:30', status: 'Blocked', priority: 'P1', source: SRC.VERIFIED, detail: 'Blocked: waiting on final keynote deck from speaker.' },
    { id: 't-11', title: 'Confirm backup power for Outdoor Plaza', ownerId: 'vol-3', sessionId: 's-5', due: '2026-10-09T15:00', status: 'Todo', priority: 'P1', source: SRC.AI, detail: 'Demo hour runs on outdoor PA + screens; confirm generator backup with campus facilities.' },
  ],
  comms: [
    { id: 'c-1', name: 'Attendee welcome message', eventId: 'e-1', audience: 'Attendees', channel: 'WhatsApp', draft: 'See you tomorrow at BBSR Founders Meetup #1! Gates open 8:45 AM at KIIT Campus 6, Outdoor Plaza. Carry this QR for check-in.', status: 'Approved', source: SRC.VERIFIED },
    { id: 'c-2', name: 'Speaker briefing note', eventId: 'e-1', audience: 'Speakers', channel: 'Email', draft: 'Hi! Quick brief: 40-min slot + 5-min Q&A. Please share your deck by tonight so AV can preload it. Green room opens 9 AM behind Main Audi stage.', status: 'Draft', source: SRC.AI },
  ],
  impactReports: [
    { id: 'ir-1', name: 'Impact report — keynote deck delayed', trigger: 'Speaker shared deck 1 day late', summary: 'AV rehearsal (t-10) blocked; no timing impact on other sessions yet.', affectedSessionIds: ['s-2'], newTaskIds: ['t-10'], source: SRC.VERIFIED },
  ],
};
