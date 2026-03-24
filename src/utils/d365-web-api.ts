/**
 * Direct D365 Web API client via fetch().
 *
 * When the Xrm client-side SDK is unavailable or broken (pop-out windows,
 * certain iframes), this module talks to the same OData REST endpoints
 * using the browser's existing session cookie. No extra authentication
 * is needed — the user is already signed in.
 */

import { UILIB } from '../components/Logger/Logger';

// ---------------------------------------------------------------------------
// Org URL resolution
// ---------------------------------------------------------------------------

let cachedClientUrl: string | null = null;

/**
 * Resolve the D365 org base URL (e.g. "https://org.crm.dynamics.com").
 * Tries several sources in priority order.
 */
export function getClientUrl(): string | null {
  if (cachedClientUrl) return cachedClientUrl;

  // 1. Xrm.Utility.getGlobalContext().getClientUrl()
  try {
    const xrm = (window as any).Xrm;
    const ctx =
      xrm?.Utility?.getGlobalContext?.() ??
      (window as any).GetGlobalContext?.();
    if (ctx?.getClientUrl) {
      const url = ctx.getClientUrl();
      if (url) {
        cachedClientUrl = url.replace(/\/+$/, '');
        return cachedClientUrl;
      }
    }
  } catch { /* ignore */ }

  // 2. Try parent/top window Xrm (iframe scenario)
  for (const w of [window.parent, window.top]) {
    try {
      if (w && w !== window) {
        const xrm = (w as any).Xrm;
        const ctx =
          xrm?.Utility?.getGlobalContext?.() ??
          (w as any).GetGlobalContext?.();
        if (ctx?.getClientUrl) {
          const url = ctx.getClientUrl();
          if (url) {
            cachedClientUrl = url.replace(/\/+$/, '');
            return cachedClientUrl;
          }
        }
      }
    } catch { /* cross-origin, ignore */ }
  }

  // 3. Infer from current page URL (works in pop-outs that are still on the D365 domain)
  try {
    const loc = window.location;
    if (loc.hostname.includes('.dynamics.com') || loc.hostname.includes('.crm')) {
      cachedClientUrl = `${loc.protocol}//${loc.host}`;
      return cachedClientUrl;
    }
  } catch { /* ignore */ }

  return null;
}

/**
 * Reset cached org URL (e.g. after navigation).
 */
export function resetClientUrlCache(): void {
  cachedClientUrl = null;
}

// ---------------------------------------------------------------------------
// Low-level fetch wrapper
// ---------------------------------------------------------------------------

const API_VERSION = 'v9.2';

async function apiFetch(path: string): Promise<any> {
  const base = getClientUrl();
  if (!base) {
    throw new Error('Could not determine D365 org URL');
  }

  const url = `${base}/api/data/${API_VERSION}/${path}`;
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',            // send session cookies
    headers: {
      'Accept': 'application/json',
      'OData-MaxVersion': '4.0',
      'OData-Version': '4.0',
      'Prefer': 'odata.include-annotations="*"',
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`D365 API ${res.status}: ${body}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Entity metadata
// ---------------------------------------------------------------------------

export interface D365EntityMeta {
  PrimaryIdAttribute: string;
  PrimaryNameAttribute: string;
  EntitySetName: string;
  DisplayName: {
    UserLocalizedLabel?: { Label: string };
    LocalizedLabels?: Array<{ Label: string }>;
  };
  Attributes: Array<{
    LogicalName: string;
    AttributeType: string;
    DisplayName?: {
      UserLocalizedLabel?: { Label: string };
    };
    OptionSet?: {
      Options: Array<{ Label: { UserLocalizedLabel?: { Label: string } }; Value: number }>;
    };
  }>;
}

const metaCache = new Map<string, D365EntityMeta>();

/**
 * Fetch entity metadata via the REST API.
 * Includes attributes so we can validate column names.
 */
export async function fetchEntityMetadata(entityName: string): Promise<D365EntityMeta> {
  if (metaCache.has(entityName)) return metaCache.get(entityName)!;

  const data = await apiFetch(
    `EntityDefinitions(LogicalName='${entityName}')`
    + `?$select=PrimaryIdAttribute,PrimaryNameAttribute,EntitySetName,DisplayName`
    + `&$expand=Attributes($select=LogicalName,AttributeType,DisplayName)`
  );

  const meta: D365EntityMeta = {
    PrimaryIdAttribute: data.PrimaryIdAttribute,
    PrimaryNameAttribute: data.PrimaryNameAttribute,
    EntitySetName: data.EntitySetName,
    DisplayName: data.DisplayName ?? {},
    Attributes: (data.Attributes ?? []).map((a: any) => ({
      LogicalName: a.LogicalName,
      AttributeType: a.AttributeType,
      DisplayName: a.DisplayName,
      OptionSet: undefined, // separate call if needed
    })),
  };

  metaCache.set(entityName, meta);
  return meta;
}

// ---------------------------------------------------------------------------
// Option set metadata
// ---------------------------------------------------------------------------

/**
 * Fetch picklist / option-set values for a specific attribute.
 */
export async function fetchOptionSet(
  entityName: string,
  attributeName: string,
): Promise<Array<{ label: string; value: string }>> {
  const data = await apiFetch(
    `EntityDefinitions(LogicalName='${entityName}')`
    + `/Attributes(LogicalName='${attributeName}')`
    + `/Microsoft.Dynamics.CRM.PicklistAttributeMetadata`
    + `?$select=LogicalName`
    + `&$expand=OptionSet($select=Options)`,
  );

  const rawOptions = data?.OptionSet?.Options;
  if (!Array.isArray(rawOptions)) return [];

  return rawOptions.map((o: any) => ({
    label: o.Label?.UserLocalizedLabel?.Label ?? `${o.Value}`,
    value: String(o.Value),
  }));
}

// ---------------------------------------------------------------------------
// Record retrieval
// ---------------------------------------------------------------------------

export interface D365RecordResult {
  entities: any[];
  totalCount: number;
}

/**
 * Retrieve records using an OData query string.
 */
export async function retrieveMultipleRecords(
  entitySetName: string,
  odataQuery: string,
): Promise<D365RecordResult> {
  const sep = odataQuery.startsWith('?') ? '' : '?';
  const data = await apiFetch(`${entitySetName}${sep}${odataQuery}`);

  return {
    entities: data.value ?? [],
    totalCount:
      data['@odata.count'] ??
      data['@Microsoft.Dynamics.CRM.totalrecordcount'] ??
      (data.value?.length ?? 0),
  };
}

/**
 * Retrieve records using a FetchXML query.
 */
export async function retrieveWithFetchXml(
  entitySetName: string,
  fetchXml: string,
): Promise<D365RecordResult> {
  return retrieveMultipleRecords(
    entitySetName,
    `?fetchXml=${encodeURIComponent(fetchXml)}`,
  );
}

// ---------------------------------------------------------------------------
// High-level availability check
// ---------------------------------------------------------------------------

let directApiHealthy: boolean | null = null;

/**
 * Check whether direct Web API calls work (org URL resolvable + authenticated).
 * Caches the result for the page lifetime.
 */
export async function isDirectApiAvailable(): Promise<boolean> {
  if (directApiHealthy !== null) return directApiHealthy;

  if (!getClientUrl()) {
    directApiHealthy = false;
    return false;
  }

  try {
    // Lightweight probe
    await apiFetch('systemusers?$top=1&$select=systemuserid');
    directApiHealthy = true;
  } catch (e) {
    console.debug(...UILIB, '[DirectAPI] Health probe failed:', e);
    directApiHealthy = false;
  }

  return directApiHealthy;
}

/**
 * Reset the direct API health cache.
 */
export function resetDirectApiHealthCache(): void {
  directApiHealthy = null;
}
