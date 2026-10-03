// Sanchalan design system primitives.
// Notion-inspired restraint: quiet surfaces, subtle borders, color only for meaning.

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useState } from 'react';

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

const badgeTones: Record<string, string> = {
  gray: 'bg-[#F5F5F3] text-[#6B6B6B] ring-[#E8E8E6]',
  green: 'bg-green-50 text-green-700 ring-green-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  solidRed: 'bg-red-600 text-white',
  solidAmber: 'bg-amber-500 text-white',
  solidGray: 'bg-gray-400 text-white',
  solidGreen: 'bg-green-600 text-white',
  solidBlue: 'bg-blue-600 text-white',
  solidBlack: 'bg-[#191919] text-white',
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
        'inline-flex shrink-0 items-center rounded-[6px] px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset',
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
    primary: 'bg-[#191919] text-white hover:bg-[#2e2e2e] border-[#191919]',
    secondary: 'bg-white text-[#191919] hover:bg-[#F5F5F3] border-[#E8E8E6]',
    danger: 'bg-red-600 text-white hover:bg-red-500 border-red-600',
    ghost: 'bg-transparent text-[#6B6B6B] hover:bg-[#F5F5F3] hover:text-[#191919] border-transparent',
  }[variant];
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-[6px] border px-3 py-1.5 text-[13px] font-medium transition-quiet disabled:cursor-not-allowed disabled:opacity-40',
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
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6B6B6B]">{children}</h2>
      {action}
    </div>
  );
}

/* Page header: title + metadata + primary action. Replaces oversized hero headers. */
export function PageHeader({
  title,
  meta,
  action,
  back,
}: {
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  back?: { label: string; onClick: () => void };
}) {
  return (
    <div className="mb-5">
      {back && (
        <button onClick={back.onClick} className="mb-2 flex items-center gap-1 text-[13px] text-[#6B6B6B] hover:text-[#191919] transition-quiet">
          <span aria-hidden>←</span> {back.label}
        </button>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-[#191919]">{title}</h1>
          {meta && <div className="mt-1 text-[13px] text-[#6B6B6B]">{meta}</div>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

/* Skeleton rows for loading states */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton', className)} aria-hidden />;
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[10px] border border-[#E8E8E6] bg-white px-4 py-3">
      <div className="text-[20px] font-semibold tracking-tight text-[#191919] tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.04em] text-[#9B9B9B]">{label}</div>
      {sub && <div className="mt-0.5 text-[12px] text-[#6B6B6B]">{sub}</div>}
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
    <div className="rounded-[10px] border border-dashed border-[#E8E8E6] bg-white px-6 py-10 text-center">
      <div className="text-[14px] font-medium text-[#191919]">{title}</div>
      <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-[#6B6B6B]">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Dense table cell/header class helpers — Notion-like restraint
export const th =
  'px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[0.04em] text-[#9B9B9B] whitespace-nowrap border-b border-[#E8E8E6]';
export const td = 'px-3 py-2.5 text-[13px] text-[#191919] align-top';
export const tr = 'border-b border-[#F0EFEC] hover:bg-[#F5F5F3] transition-quiet';

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

// QuickAdd: generic add-record button + modal for custom events.
// fields: [{key, label, type}] — renders a simple form.
export function QuickAdd({
  title,
  fields,
  onAdd,
}: {
  title: string;
  fields: { key: string; label: string; type?: string }[];
  onAdd: (vals: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState<Record<string, string>>({});
  return (
    <>
      <button
        onClick={() => { setVals({}); setOpen(true); }}
        className="rounded-md bg-gray-900 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-gray-800"
      >
        + Add {title}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-[15px] font-semibold text-gray-900">Add {title}</div>
            <div className="mt-3 space-y-2.5">
              {fields.map((f) => (
                <input
                  key={f.key}
                  value={vals[f.key] ?? ''}
                  onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.label}
                  type={f.type ?? 'text'}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none"
                />
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:bg-gray-100">Cancel</button>
              <button
                onClick={() => { onAdd(vals); setOpen(false); }}
                disabled={!vals[fields[0]?.key]?.trim()}
                className="rounded-md bg-gray-900 px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
