// Auth page: sign in / sign up with Supabase.

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!supabase) return;
    setErr('');
    setBusy(true);
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
      }
      onDone();
    } catch (e: any) {
      setErr(e?.message ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-[18px] font-bold tracking-tight text-gray-900">Sanchalan</div>
        <div className="mt-0.5 text-[13px] text-gray-500">Event Command Center</div>

        <div className="mt-5 flex rounded-md bg-gray-100 p-0.5">
          {(['in', 'up'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setErr(''); }}
              className={`flex-1 rounded px-3 py-1.5 text-[13px] font-medium ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              {m === 'in' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none"
          />
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-[14px] focus:border-gray-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-[12px] font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              title={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {err && <p className="mt-3 text-[13px] font-medium text-red-700">{err}</p>}

        <button
          onClick={submit}
          disabled={busy || !email.trim() || !password}
          className="mt-4 w-full rounded-md bg-gray-900 px-4 py-2 text-[14px] font-medium text-white disabled:opacity-40"
        >
          {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>

        <p className="mt-4 text-center text-[12px] text-gray-500">
          Your event data stays in Notion. Sanchalan only uses your login to know who approved what.
        </p>
      </div>
    </div>
  );
}
