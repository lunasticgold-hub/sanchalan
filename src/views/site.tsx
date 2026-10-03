// Shared layout for marketing pages.

import type { ReactNode } from 'react';
import Logo from '../components/Logo';
import { NavLink } from '../lib/nav';

export function SiteNav() {
  return (
    <nav className="border-b border-gray-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <NavLink to="/" className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-[16px] font-bold tracking-tight text-gray-900">Sanchalan</span>
        </NavLink>
        <div className="hidden items-center gap-6 md:flex">
          <NavLink to="/features" className="text-[13px] font-medium text-gray-600 hover:text-gray-900">Features</NavLink>
          <NavLink to="/pricing" className="text-[13px] font-medium text-gray-600 hover:text-gray-900">Pricing</NavLink>
          <NavLink to="/about" className="text-[13px] font-medium text-gray-600 hover:text-gray-900">About</NavLink>
          <NavLink to="/contact" className="text-[13px] font-medium text-gray-600 hover:text-gray-900">Contact</NavLink>
        </div>
        <div className="flex items-center gap-2">
          <NavLink to="/app" className="rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-100">Sign in</NavLink>
          <NavLink to="/app" className="rounded-md bg-gray-900 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-gray-800">Get started</NavLink>
        </div>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50/50 px-6 py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Logo size={22} />
            <span className="text-[13px] font-semibold text-gray-900">Sanchalan</span>
          </div>
          <p className="mt-2 text-[12px] text-gray-500">The operational layer for events running on Notion.</p>
        </div>
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wider text-gray-400">Product</div>
          <div className="mt-2 space-y-1">
            <NavLink to="/features" className="block text-[13px] text-gray-600 hover:text-gray-900">Features</NavLink>
            <NavLink to="/pricing" className="block text-[13px] text-gray-600 hover:text-gray-900">Pricing</NavLink>
            <NavLink to="/app" className="block text-[13px] text-gray-600 hover:text-gray-900">Open app</NavLink>
          </div>
        </div>
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wider text-gray-400">Company</div>
          <div className="mt-2 space-y-1">
            <NavLink to="/about" className="block text-[13px] text-gray-600 hover:text-gray-900">About</NavLink>
            <NavLink to="/contact" className="block text-[13px] text-gray-600 hover:text-gray-900">Contact</NavLink>
            <NavLink to="/faq" className="block text-[13px] text-gray-600 hover:text-gray-900">FAQ</NavLink>
            <NavLink to="/changelog" className="block text-[13px] text-gray-600 hover:text-gray-900">Changelog</NavLink>
          </div>
        </div>
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-wider text-gray-400">Legal</div>
          <div className="mt-2 space-y-1">
            <NavLink to="/privacy" className="block text-[13px] text-gray-600 hover:text-gray-900">Privacy</NavLink>
            <NavLink to="/terms" className="block text-[13px] text-gray-600 hover:text-gray-900">Terms</NavLink>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl border-t border-gray-100 pt-4 text-center text-[12px] text-gray-400">
        Built for Kaun Banega Codepati 2026 (KBC-NOTION-03) · Team larpers
      </div>
    </footer>
  );
}

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-6 py-14">
        <h1 className="text-[32px] font-bold tracking-tight text-gray-900">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] text-gray-600">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
