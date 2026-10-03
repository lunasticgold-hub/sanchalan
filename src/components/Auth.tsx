// Auth page: sign in / sign up with Supabase.

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [newPw, setNewPw] = useState(false);

  // Listen for password recovery link clicks
  useEffect(() => {
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setNewPw(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const friendlyError = (msg: string) => {
    if (/rate limit|security purposes|after \d+ seconds/i.test(msg)) {
      const s = msg.match(/after (\d+) seconds/i);
      return `Too many attempts — please wait ${s ? s[1] : 'a few'} seconds and try again.`;
    }
    if (/already registered|already exists/i.test(msg)) return 'This email is already registered. Try signing in instead.';
    return msg;
  };

  const submit = async () => {
    if (!supabase) return;
    setErr('');
    setBusy(true);
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onDone();
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        // If email confirmation is on, there'll be no session yet
        if (!data.session) {
          setCheckEmail(true);
        } else {
          onDone();
        }
      }
    } catch (e: any) {
      setErr(friendlyError(e?.message ?? 'Something went wrong'));
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async () => {
    if (!supabase || !email.trim()) return;
    setErr('');
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (e: any) {
      setErr(friendlyError(e?.message ?? 'Something went wrong'));
    } finally {
      setBusy(false);
    }
  };

  const updatePassword = async () => {
    if (!supabase || !password) return;
    setErr('');
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setNewPw(false);
      onDone();
    } catch (e: any) {
      setErr(friendlyError(e?.message ?? 'Something went wrong'));
    } finally {
      setBusy(false);
    }
  };

  if (newPw) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-[18px] font-bold tracking-tight text-gray-900">Sanchalan</div>
          <div className="mt-0.5 text-[13px] text-gray-500">Set a new password</div>
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            onKeyDown={(e) => e.key === 'Enter' && updatePassword()}
            className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none"
          />
          {err && <p className="mt-3 text-[13px] font-medium text-red-700">{err}</p>}
          <button
            onClick={updatePassword}
            disabled={busy || !password}
            className="mt-4 w-full rounded-md bg-gray-900 px-4 py-2 text-[14px] font-medium text-white disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Save new password'}
          </button>
        </div>
      </div>
    );
  }

  if (resetMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-[18px] font-bold tracking-tight text-gray-900">Sanchalan</div>
          <div className="mt-0.5 text-[13px] text-gray-500">Reset your password</div>
          {resetSent ? (
            <div className="mt-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-[20px]">✉</div>
              <p className="mt-3 text-[13px] text-gray-600">
                If an account exists for <span className="font-medium text-gray-900">{email.trim()}</span>, you'll get a reset link shortly.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-3 text-[13px] text-gray-600">Enter your email and we'll send you a reset link.</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                onKeyDown={(e) => e.key === 'Enter' && sendReset()}
                className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-[14px] focus:border-gray-900 focus:outline-none"
              />
            </>
          )}
          {err && <p className="mt-3 text-[13px] font-medium text-red-700">{err}</p>}
          {!resetSent && (
            <button
              onClick={sendReset}
              disabled={busy || !email.trim()}
              className="mt-4 w-full rounded-md bg-gray-900 px-4 py-2 text-[14px] font-medium text-white disabled:opacity-40"
            >
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          )}
          <button
            onClick={() => { setResetMode(false); setResetSent(false); setErr(''); }}
            className="mt-2 w-full rounded-md px-4 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (checkEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4">
        <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
          <div className="text-[18px] font-bold tracking-tight text-gray-900">Sanchalan</div>
          <div className="mt-0.5 text-[13px] text-gray-500">Event Command Center</div>
          <div className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-[20px]">✉</div>
          <h2 className="mt-3 text-[15px] font-semibold text-gray-900">Check your email</h2>
          <p className="mt-1 text-[13px] text-gray-600">
            We sent a confirmation link to <span className="font-medium text-gray-900">{email.trim()}</span>. Click it to finish signing up, then come back here to sign in.
          </p>
          <button
            onClick={() => { setCheckEmail(false); setMode('in'); setErr(''); }}
            className="mt-4 w-full rounded-md bg-gray-900 px-4 py-2 text-[14px] font-medium text-white"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

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

        {mode === 'in' && (
          <button
            onClick={() => { setResetMode(true); setErr(''); setResetSent(false); }}
            className="mt-2 w-full text-center text-[13px] font-medium text-gray-500 hover:text-gray-800"
          >
            Forgot password?
          </button>
        )}

        <p className="mt-4 text-center text-[12px] text-gray-500">
          Your event data stays in Notion. Sanchalan only uses your login to know who approved what.
        </p>
      </div>
    </div>
  );
}
