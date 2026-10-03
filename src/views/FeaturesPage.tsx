import { PageShell } from './site';
import { NavLink } from '../lib/nav';

const DETAILS = [
  {
    title: 'Blast radius analysis',
    body: 'Describe any operational change in plain English — "move all sessions from Seminar Hall B to the Auditorium" — and Sanchalan computes the full impact: every affected session, task, volunteer, communication, and venue. No more missed knock-on effects.',
  },
  {
    title: 'Risk detection',
    body: 'Capacity overflows, double-booked volunteers, speaker conflicts, tasks due after their session starts. Sanchalan runs P0–P3 risk checks on every proposed change and surfaces them before you approve.',
  },
  {
    title: 'Human approval gate',
    body: 'Nothing writes to Notion without your explicit approval. The loop is always analyze → review → approve → execute → audit. You can acknowledge a risk and proceed, or discard the whole change.',
  },
  {
    title: 'What-if simulation',
    body: 'Ask "what if the main hall floods?" or "what if 500 people show up?" Simulate any scenario against your live data without touching a single record. Discard it, or convert it into a real change proposal.',
  },
  {
    title: 'Live operations',
    body: 'On event day, open Live Ops: what\'s happening now, what\'s next, who\'s checked in, which volunteers are where. One screen, zero tab-switching.',
  },
  {
    title: 'Pre-flight checklist',
    body: 'The night before, run Pre-flight: venues confirmed, speakers arrived, tasks complete, comms approved, risks closed. Green across the board or you know exactly what to fix.',
  },
  {
    title: 'Impact reports',
    body: 'After the event, auto-generate the debrief: what changed, what broke, what worked, and what to fix next time. Your retrospective writes itself.',
  },
  {
    title: 'Notion is the system of record',
    body: 'All data lives in your Notion workspace — 11 databases, fully yours. Sanchalan reads and writes through the official API. Unplug us and your data is exactly where you left it.',
  },
];

export default function FeaturesPage() {
  return (
    <PageShell title="Features" subtitle="Everything you need to run an event on Notion — without the chaos.">
      <div className="space-y-6">
        {DETAILS.map((d) => (
          <div key={d.title} className="rounded-lg border border-gray-200 p-5">
            <div className="text-[16px] font-semibold text-gray-900">{d.title}</div>
            <p className="mt-2 text-[14px] leading-relaxed text-gray-600">{d.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <NavLink to="/app" className="inline-block rounded-md bg-gray-900 px-6 py-2.5 text-[15px] font-medium text-white hover:bg-gray-800">Try it free</NavLink>
      </div>
    </PageShell>
  );
}
