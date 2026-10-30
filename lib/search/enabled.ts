/**
 * Client-safe flag for whether the search UI should be shown (ADR 0018). Mirrors
 * the server's `isSearchEnabled()` via a public build-time env var, so the browser
 * can decide to render the search box without importing the server-only index
 * module. When the engine is configured but unreachable, the box still shows and
 * a failed query falls back to the list (handled in the dashboard).
 */
export function searchUiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SEARCH_ENABLED === '1';
}
