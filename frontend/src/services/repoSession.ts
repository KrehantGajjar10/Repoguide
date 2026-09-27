/**
 * Minimal in-memory store for the current repository ID.
 *
 * Used to carry the real backend UUID from the Connect Repository page
 * to the Repository Analysis page without introducing a full state manager.
 *
 * The value is set when the user submits a URL and cleared once the analysis
 * page is done with it.
 */

let _currentRepoId: string | null = null;

export const repoSession = {
  set(id: string): void {
    _currentRepoId = id;
  },
  get(): string | null {
    return _currentRepoId;
  },
  clear(): void {
    _currentRepoId = null;
  },
};
