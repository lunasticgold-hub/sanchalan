// Per-account storage scoping.
//
// Custom events, their records, and Notion connections are stored in the
// browser. Without scoping, logging in as a different account on the same
// browser would show the first account's events. Every key below is
// namespaced to the signed-in account's email.

let scopeEmail: string | null = null;

export function setScopeEmail(email: string | null) {
  scopeEmail = email;
}

function tag(): string {
  if (!scopeEmail) return 'anon';
  return scopeEmail.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

/** Namespaced storage key, e.g. scopedKey('custom_events'). */
export function scopedKey(base: string): string {
  return `sanchalan_u_${tag()}_${base}`;
}

/**
 * One-time migration: if the namespaced key is empty but a legacy unscoped
 * `sanchalan_<base>` key has data, copy it over so existing users don't
 * lose their events/connections after this change ships.
 */
export function migrateLegacyKey(base: string) {
  if (!scopeEmail) return;
  try {
    const scoped = scopedKey(base);
    if (!localStorage.getItem(scoped)) {
      const old = localStorage.getItem(`sanchalan_${base}`);
      if (old) localStorage.setItem(scoped, old);
    }
  } catch {
    /* storage unavailable */
  }
}
