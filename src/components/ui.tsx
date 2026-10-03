// Small shared primitives: badges, buttons, section headers, stats, empty states.
// Neutral enterprise styling — color only for meaning.

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

const badgeTones: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-700 ring-gray-200',
  green: 'bg-green-50 text-green-700 ring-green-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  solidRed: 'bg-red-600 text-white',
  solidAmber: 'bg-amber-500 text-white',
  solidGray: 'bg-gray-400 text-white',
  solidGreen: 'bg-green-600 text-white',
  solidBlue: 'bg-blue-600 text-white',
  solidBlack: 'bg-gray-900 text-white',
};

export function Badge({
  tone = 'gray',
  children,
  className,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status: string): keyof typeof badgeTones {
  switch (status) {
    case 'Done':
    case 'Ready':
    case 'Live':
    case 'Sent':
    case 'Approved':
      return 'green';
    case 'In progress':
      return 'blue';
    case 'Blocked':
      return 'red';
    case 'Draft':
      return 'amber';
    case 'Planning':
      return 'blue';
    default:
      return 'gray';
  }
}

export function prioTone(p: string): keyof typeof badgeTones {
  if (p === 'P0') return 'solidRed';
  if (p === 'P1') return 'solidAmber';
  return 'solidGray';
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

export function Btn({ variant = 'secondary', className, ...rest }: BtnProps) {
  const styles = {
    primary: 'bg-gray-900 text-white hover:bg-gray-700 border-gray-900',
    secondary: 'bg-white text-gray-800 hover:bg-gray-50 border-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-500 border-red-600',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 border-transparent',
  }[variant];
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        styles,
        className,
      )}
      {...rest}
    />
  );
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('mb-3 flex items-center justify-between', className)}>
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gray-500">{children}</h2>
      {action}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="text-[22px] font-semibold tracking-tight text-gray-900">{value}</div>
      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</div>
      {sub && <div className="mt-0.5 text-[12px] text-gray-500">{sub}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-8 text-center">
      <div className="text-[14px] font-semibold text-gray-800">{title}</div>
      <p className="mx-auto mt-1 max-w-md text-[13px] text-gray-500">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

// Dense table cell/header class helpers
export const th =
  'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap';
export const td = 'px-3 py-2 text-[13px] text-gray-800 align-top';
export const tr = 'border-t border-gray-100 hover:bg-gray-50';

export function fmtTime(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fmtDateTime(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  );
}

export function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// Linkify: turns URLs in plain text into clickable, highlighted links.
export function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)>\]]+|(?:www\.|notion\.so)[^\s)>\]]*)/gi);
  return (
    <>
      {parts.map((p, i) => {
        const isUrl = /^(https?:\/\/|www\.|notion\.so)/i.test(p);
        if (!isUrl) return <span key={i}>{p}</span>;
        const href = /^https?:\/\//i.test(p) ? p : `https://${p}`;
        return (
          <a
            key={i}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900 hover:decoration-blue-500"
            onClick={(e) => e.stopPropagation()}
          >
            {p}
          </a>
        );
      })}
    </>
  );
}
