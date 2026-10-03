import { PageShell } from './site';

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" subtitle="Last updated: October 2026">
      <div className="space-y-5 text-[14px] leading-relaxed text-gray-700">
        <p>Sanchalan is built on a simple principle: <strong>your data is yours</strong>. This policy explains what we collect and why.</p>
        <h2 className="text-[16px] font-semibold text-gray-900">What we store</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Account data:</strong> your email address, used for sign-in via Supabase Auth.</li>
          <li><strong>Event data:</strong> lives in <em>your</em> Notion workspace, not ours. We read and write it through the Notion API on your behalf.</li>
          <li><strong>Local data:</strong> events you create in the app are stored in your browser's local storage until connected to Notion.</li>
        </ul>
        <h2 className="text-[16px] font-semibold text-gray-900">What we don't do</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>We don't sell your data. Ever.</li>
          <li>We don't share your Notion content with third parties except the AI provider needed to parse your requests (Gemini), and only the text you submit.</li>
          <li>We don't track you across the web. No ad pixels, no data brokers.</li>
        </ul>
        <h2 className="text-[16px] font-semibold text-gray-900">Your rights</h2>
        <p>Delete your account anytime from settings — your Supabase profile is removed and your browser data can be cleared. Your Notion workspace is untouched; revoke the integration there whenever you like.</p>
        <h2 className="text-[16px] font-semibold text-gray-900">Contact</h2>
        <p>Questions about privacy: <span className="font-medium">team@sanchalan.app</span></p>
      </div>
    </PageShell>
  );
}
