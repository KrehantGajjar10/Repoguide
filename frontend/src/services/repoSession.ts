/**
 * Persistent repository session using sessionStorage.
 *
 * Survives page refresh within the same browser tab.
 * Cleared when the tab is closed, or explicitly via repoSession.clear().
 *
 * Falls back silently to an in-memory value when sessionStorage is unavailable
 * (e.g. in certain test environments).
 */

const SESSION_KEY = 'repoguide_repo_id';

let _memFallback: string | null = null;

function _canUseSessionStorage(): boolean {
  try {
    sessionStorage.setItem('__rg_test__', '1');
    sessionStorage.removeItem('__rg_test__');
    return true;
  } catch {
    return false;
  }
}

export const repoSession = {
  set(id: string): void {
    _memFallback = id;
    if (_canUseSessionStorage()) sessionStorage.setItem(SESSION_KEY, id);
  },
  get(): string | null {
    if (_canUseSessionStorage()) return sessionStorage.getItem(SESSION_KEY);
    return _memFallback;
  },
  clear(): void {
    _memFallback = null;
    if (_canUseSessionStorage()) sessionStorage.removeItem(SESSION_KEY);
  },
};
