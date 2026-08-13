// Central registry for every dynamic import in the app.
//
// Why it lives in its own module: the SAME loader function backs both
// React.lazy() and the prefetchers below. Calling a loader a second time is
// free — the module is already resolved and cached — so warming a chunk on
// hover makes the later navigation resolve without a network round-trip. That
// round-trip was the visible dead pause when opening /work: the route swapped
// instantly, then sat on an empty Suspense fallback until the chunk landed,
// and only then did the entrance animation start.
export const loadProjects    = () => import('./components/Projects');
export const loadGitHub      = () => import('./components/GitHubActivity');
export const loadContact     = () => import('./components/Contact');
export const loadFooter      = () => import('./components/Footer');
export const loadWorkArchive = () => import('./pages/WorkArchive');
export const loadPaperLab    = () => import('./pages/PaperLab');

let workWarmed = false;

/**
 * Warm the /work route (the archive page + the footer it renders).
 * Idempotent and safe to call from a hover handler on every mouseenter.
 */
export function prefetchWork() {
  if (workWarmed) return;
  workWarmed = true;
  loadWorkArchive();
  loadFooter();
}

let homeWarmed = false;

/**
 * Warm the below-the-fold home sections during the first idle gap, so the
 * first scroll never hits a Suspense boundary.
 */
export function prefetchHome() {
  if (homeWarmed) return;
  homeWarmed = true;
  loadProjects();
  loadGitHub();
  loadContact();
  loadFooter();
}

/** Run `fn` when the browser is next idle (with a timeout fallback). */
export function onIdle(fn, timeout = 2000) {
  if (typeof window === 'undefined') return () => {};
  if (window.requestIdleCallback) {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback?.(id);
  }
  const id = setTimeout(fn, 400);
  return () => clearTimeout(id);
}
