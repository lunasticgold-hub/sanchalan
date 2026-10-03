import { PageShell } from './site';

export default function TermsPage() {
  return (
    <PageShell title="Terms of Service" subtitle="Last updated: October 2026">
      <div className="space-y-5 text-[14px] leading-relaxed text-gray-700">
        <p>By using Sanchalan you agree to these terms. We're in beta — things may break, and we'll fix them fast.</p>
        <h2 className="text-[16px] font-semibold text-gray-900">The service</h2>
        <p>Sanchalan provides an operational layer over your Notion workspace: change analysis, risk detection, approval workflows, and writes to Notion via the official API. You are responsible for the Notion workspace you connect and the changes you approve.</p>
        <h2 className="text-[16px] font-semibold text-gray-900">Approvals are yours</h2>
        <p>Every write to your Notion requires your explicit approval in the app. You acknowledge that approved changes modify your workspace, and that undo is provided on a best-effort basis.</p>
        <h2 className="text-[16px] font-semibold text-gray-900">Acceptable use</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Don't use Sanchalan to spam, harass, or mislead attendees.</li>
          <li>Don't attempt to access other users' workspaces or data.</li>
          <li>Don't abuse the AI parsing endpoints with automated bulk requests.</li>
        </ul>
        <h2 className="text-[16px] font-semibold text-gray-900">Beta disclaimer</h2>
        <p>Sanchalan is provided "as is" during beta, without warranties. We may change or discontinue features with notice. Paid plans, when launched, will carry an SLA.</p>
        <h2 className="text-[16px] font-semibold text-gray-900">Contact</h2>
        <p>Legal questions: <span className="font-medium">team@sanchalan.app</span></p>
      </div>
    </PageShell>
  );
}
