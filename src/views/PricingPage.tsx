import { PageShell } from './site';

export default function PricingPage() {
  return (
    <PageShell title="Pricing" subtitle="Free while we're in beta. Simple plans when we launch.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-[14px] font-semibold text-gray-900">Starter</div>
          <div className="mt-2"><span className="text-[28px] font-bold text-gray-900">Free</span></div>
          <p className="mt-1 text-[13px] text-gray-500">For small meetups and first-time organizers.</p>
          <ul className="mt-4 space-y-2 text-[13px] text-gray-600">
            <li>✓ 1 event</li>
            <li>✓ All 11 Notion databases</li>
            <li>✓ Change analysis & approvals</li>
            <li>✓ Risk detection</li>
            <li>✓ Community support</li>
          </ul>
          <a href="/app" className="mt-6 block rounded-md border border-gray-300 px-4 py-2 text-center text-[14px] font-medium text-gray-700 hover:bg-gray-50">Start free</a>
        </div>
        <div className="rounded-lg border-2 border-gray-900 bg-white p-6">
          <div className="text-[14px] font-semibold text-gray-900">Pro</div>
          <div className="mt-2"><span className="text-[28px] font-bold text-gray-900">₹499</span><span className="text-[13px] text-gray-500">/event</span></div>
          <p className="mt-1 text-[13px] text-gray-500">For conferences and recurring organizers.</p>
          <ul className="mt-4 space-y-2 text-[13px] text-gray-600">
            <li>✓ Unlimited events</li>
            <li>✓ Team roles & approvals</li>
            <li>✓ Automated email & WhatsApp</li>
            <li>✓ What-if simulations</li>
            <li>✓ Priority support</li>
          </ul>
          <a href="/app" className="mt-6 block rounded-md bg-gray-900 px-4 py-2 text-center text-[14px] font-medium text-white hover:bg-gray-800">Join waitlist</a>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="text-[14px] font-semibold text-gray-900">Enterprise</div>
          <div className="mt-2"><span className="text-[28px] font-bold text-gray-900">Custom</span></div>
          <p className="mt-1 text-[13px] text-gray-500">For event agencies and institutions.</p>
          <ul className="mt-4 space-y-2 text-[13px] text-gray-600">
            <li>✓ Everything in Pro</li>
            <li>✓ SSO & audit logs</li>
            <li>✓ Dedicated onboarding</li>
            <li>✓ SLA & data residency</li>
          </ul>
          <a href="/contact" className="mt-6 block rounded-md border border-gray-300 px-4 py-2 text-center text-[14px] font-medium text-gray-700 hover:bg-gray-50">Talk to us</a>
        </div>
      </div>
      <p className="mt-6 text-center text-[13px] text-gray-500">Prices in INR, taxes included. Cancel anytime — your Notion data stays yours.</p>
    </PageShell>
  );
}
