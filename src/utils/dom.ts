/**
 * DOM utility functions for D365 compatibility
 */

/**
 * Get the target document for rendering
 * Supports D365 iframes by checking parent window
 */
export function getTargetDocument(): Document {
  try {
    // Check if we're in an iframe and can access parent
    if (window.self !== window.top && window.top) {
      return window.top.document;
    }
  } catch (e) {
    // Cross-origin iframe, can't access parent
  }
  
  return document;
}

/**
 * Get the target window for rendering
 */
export function getTargetWindow(): Window {
  return (window.parent || window) as Window;
}

/**
 * Cached Xrm health status.
 * null = not tested yet, true = functional, false = present but broken (e.g., pop-out windows)
 */
let xrmWebApiHealthy: boolean | null = null;

/**
 * Check whether Xrm.WebApi is present AND functional.
 * In D365 pop-out windows `window.Xrm` exists but internal services
 * are not initialized, so API calls fail. This function does a single
 * lightweight probe and caches the result for the page lifetime.
 */
export async function isXrmWebApiAvailable(): Promise<boolean> {
  // Return cached result
  if (xrmWebApiHealthy !== null) return xrmWebApiHealthy;

  // Quick structural check
  const xrm = (window as any).Xrm;
  if (!xrm?.WebApi?.retrieveMultipleRecords) {
    xrmWebApiHealthy = false;
    return false;
  }

  // Probe with a minimal call to confirm the API is actually functional
  try {
    await xrm.WebApi.retrieveMultipleRecords('systemuser', '?$top=1&$select=systemuserid');
    xrmWebApiHealthy = true;
  } catch {
    xrmWebApiHealthy = false;
  }

  return xrmWebApiHealthy;
}

/**
 * Reset the cached Xrm health status (useful after navigation or context change).
 */
export function resetXrmHealthCache(): void {
  xrmWebApiHealthy = null;
}

export type D365ApiMode = 'xrm' | 'direct' | 'none';

/**
 * Determine the best available D365 API strategy:
 *  - 'xrm'    → Xrm.WebApi is functional (normal D365 context)
 *  - 'direct'  → Xrm.WebApi broken but direct REST fetch works (pop-out / broken iframe)
 *  - 'none'   → No D365 API available (standalone / dev)
 *
 * The result is cached for the page lifetime.
 */
let cachedApiMode: D365ApiMode | null = null;

export async function getD365ApiMode(): Promise<D365ApiMode> {
  if (cachedApiMode) return cachedApiMode;

  // Prefer Xrm client SDK
  if (await isXrmWebApiAvailable()) {
    cachedApiMode = 'xrm';
    return cachedApiMode;
  }

  // Fall back to direct REST calls
  const { isDirectApiAvailable } = await import('./d365-web-api');
  if (await isDirectApiAvailable()) {
    cachedApiMode = 'direct';
    return cachedApiMode;
  }

  cachedApiMode = 'none';
  return cachedApiMode;
}

export function resetApiModeCache(): void {
  xrmWebApiHealthy = null;
  cachedApiMode = null;
}
