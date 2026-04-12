/**
 * Lookup Component
 * Advanced entity record lookup with table display, search, pagination
 * Uses Modal component with Fluent UI SearchBox and Table
 */

import { Modal } from '../Modal/Modal';
import { ModalButton } from '../Modal/Modal.types';
import type { LookupOptions, LookupResult, EntityMetadata, PreFilter } from './Lookup.types';
import type { TableColumn } from '../Modal/Modal.types';
import { UILIB } from '../Logger/Logger';
import { getD365ApiMode } from '../../utils/dom';
import { fetchEntityMetadata as directFetchMeta, retrieveMultipleRecords as directRetrieve, fetchOptionSet as directFetchOptionSet } from '../../utils/d365-web-api';

// Metadata cache to avoid repeated API calls
const metadataCache: Map<string, EntityMetadata> = new Map();

// Mock data generator for when Xrm is not available.
// Each entity intentionally exposes a wide variety of column types
// (string / number / decimal / currency / percent / boolean / date /
// option-set) so the demo harness can exercise every `TableColumn.format`
// override without needing live D365 metadata.
function generateMockData(entity: string, count: number = 50): any[] {
  const mockData: any[] = [];

  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Jennifer'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const companies = ['Acme Corp', 'TechCo', 'Global Industries', 'Innovation Labs', 'Premier Solutions', 'Summit Group', 'Venture Partners', 'Elite Services'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
  const industries = ['Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Finance', 'Energy'];
  const productNames = ['Atlas', 'Beacon', 'Crystal', 'Drift', 'Echo', 'Forge', 'Glacier', 'Harbor', 'Indigo', 'Jewel', 'Kepler', 'Lumen'];
  const productSuffixes = ['Pro', 'Lite', 'Max', 'XL', 'Mini', 'Plus', 'Ultra', 'Edge'];
  const hierarchies = ['Hardware > Networking', 'Hardware > Storage', 'Software > Productivity', 'Software > Security', 'Services > Consulting'];

  // Deterministic-ish pseudo-random helper so demos don't reshuffle on each open.
  // (Switch to Math.random() if you'd rather have noise.)
  const rand = (seed: number, mod: number) => ((seed * 9301 + 49297) % 233280) / 233280 * mod;

  for (let i = 0; i < count; i++) {
    const id = `${i + 1}`.padStart(8, '0') + '-0000-0000-0000-000000000000';

    if (entity === 'account') {
      const company = companies[i % companies.length];
      const revenue = Math.floor(rand(i + 1, 10000000) + 500000);
      const creditLimit = Math.floor(revenue * (0.05 + rand(i + 7, 0.15)));
      const growth = (rand(i + 13, 60) - 20) / 100; // -0.20 .. +0.40
      mockData.push({
        accountid: id,
        name: `${company} ${i > 7 ? i - 7 : ''}`.trim(),
        accountnumber: `ACC-${1000 + i}`,
        telephone1: `555-${Math.floor(rand(i + 2, 900) + 100)}-${Math.floor(rand(i + 3, 9000) + 1000)}`,
        emailaddress1: `contact@${company.toLowerCase().replace(/\s/g, '')}.com`,
        address1_city: cities[i % cities.length],
        industrycode: industries[i % industries.length],
        revenue: revenue,
        creditlimit: creditLimit,
        numberofemployees: Math.floor(rand(i + 5, 5000) + 50),
        yoy_growth: growth,
        is_preferred: i % 3 === 0,
        is_active: i % 7 !== 0,
        websiteurl: `https://www.${company.toLowerCase().replace(/\s/g, '')}.com`,
        lastcontacted: new Date(Date.now() - rand(i + 17, 180) * 24 * 60 * 60 * 1000).toISOString(),
        createdon: new Date(Date.now() - rand(i + 19, 365) * 24 * 60 * 60 * 1000).toISOString()
      });
    } else if (entity === 'contact') {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      const salary = Math.floor(rand(i + 1, 120000) + 40000);
      const commission = (rand(i + 11, 25)) / 100; // 0 .. 0.25
      mockData.push({
        contactid: id,
        fullname: `${firstName} ${lastName}`,
        name: `${firstName} ${lastName}`,
        firstname: firstName,
        lastname: lastName,
        emailaddress1: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        telephone1: `555-${Math.floor(rand(i + 2, 900) + 100)}-${Math.floor(rand(i + 3, 9000) + 1000)}`,
        jobtitle: ['Manager', 'Director', 'VP', 'Analyst', 'Specialist'][i % 5],
        parentcustomerid: companies[i % companies.length],
        annualincome: salary,
        commissionrate: commission,
        vacationdays: Math.floor(rand(i + 7, 25) + 5),
        donotemail: i % 5 === 0,
        is_active: i % 4 !== 0,
        createdon: new Date(Date.now() - rand(i + 19, 365) * 24 * 60 * 60 * 1000).toISOString()
      });
    } else if (entity === 'product') {
      // Rich product entity that mirrors the real-world Lookup demo example —
      // numeric (currency), decimal (percent), boolean, badge, dates.
      const baseName = productNames[i % productNames.length];
      const suffix = productSuffixes[i % productSuffixes.length];
      const baseCost = +(rand(i + 1, 800) + 12).toFixed(2);
      const margin = +((rand(i + 5, 50) + 8) / 100).toFixed(4); // 0.08 .. 0.58
      const stockOnHand = Math.floor(rand(i + 9, 500));
      mockData.push({
        productid: id,
        name: `${baseName} ${suffix} ${i + 1}`,
        hnc_productidpos: `SAP-${(2000 + i).toString()}`,
        hnc_bc_productnumber: `BC-${(5000 + i).toString()}`,
        hnc_hierarchy: hierarchies[i % hierarchies.length],
        hnc_localcorerange: +((rand(i + 3, 100)) / 100).toFixed(4), // 0..1 fraction
        hnc_corestocked: i % 3 !== 0,
        hnc_fx_basecostex: baseCost,
        hnc_margin: margin,
        hnc_stockonhand: stockOnHand,
        hnc_lastreceived: new Date(Date.now() - rand(i + 11, 90) * 24 * 60 * 60 * 1000).toISOString(),
        statuscode: i % 4 === 0 ? 'Discontinued' : 'Active',
        createdon: new Date(Date.now() - rand(i + 19, 365) * 24 * 60 * 60 * 1000).toISOString()
      });
    } else if (entity === 'opportunity') {
      // Existing demo uses opportunity for the preFilters lookup. Add numeric
      // columns so the demo can exercise currency / percent overrides too.
      mockData.push({
        opportunityid: id,
        name: `${companies[i % companies.length]} Renewal ${i + 1}`,
        estimatedvalue: Math.floor(rand(i + 1, 250000) + 5000),
        closeprobability: Math.floor(rand(i + 7, 95) + 5), // 5..100 (whole percent)
        statecode: i % 3 === 0 ? 1 : 0,
        prioritycode: (i % 3) + 1,
        is_won: i % 5 === 0,
        estimatedclosedate: new Date(Date.now() + rand(i + 11, 90) * 24 * 60 * 60 * 1000).toISOString(),
        createdon: new Date(Date.now() - rand(i + 19, 365) * 24 * 60 * 60 * 1000).toISOString()
      });
    } else {
      // Generic entity
      mockData.push({
        [`${entity}id`]: id,
        name: `${entity.charAt(0).toUpperCase() + entity.slice(1)} Record ${i + 1}`,
        createdon: new Date(Date.now() - rand(i + 19, 365) * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  }

  return mockData;
}

// Fetch entity metadata
async function getEntityMetadata(entityName: string): Promise<EntityMetadata | null> {
  // Check cache first
  if (metadataCache.has(entityName)) {
    return metadataCache.get(entityName)!;
  }

  const apiMode = await getD365ApiMode();

  // Try Xrm SDK first
  if (apiMode === 'xrm' && window.Xrm?.Utility?.getEntityMetadata) {
    try {
      const raw = await window.Xrm.Utility.getEntityMetadata(entityName);

      // Xrm returns Attributes as a collection object (._collection / .get()),
      // not a plain array. Convert it so .find() / .filter() work everywhere.
      let attrs: EntityMetadata['Attributes'] = [];
      if (raw.Attributes) {
        if (Array.isArray(raw.Attributes)) {
          attrs = raw.Attributes;
        } else if (raw.Attributes._collection) {
          attrs = Object.values(raw.Attributes._collection).map((a: any) => ({
            LogicalName: a.LogicalName,
            DisplayName: a.DisplayName ?? { UserLocalizedLabel: { Label: a.LogicalName } },
            AttributeType: a.AttributeType
          }));
        } else if (typeof raw.Attributes.get === 'function') {
          attrs = raw.Attributes.get().map((a: any) => ({
            LogicalName: a.LogicalName,
            DisplayName: a.DisplayName ?? { UserLocalizedLabel: { Label: a.LogicalName } },
            AttributeType: a.AttributeType
          }));
        }
      }

      const metadata: EntityMetadata = {
        EntitySetName: raw.EntitySetName,
        PrimaryIdAttribute: raw.PrimaryIdAttribute,
        PrimaryNameAttribute: raw.PrimaryNameAttribute,
        DisplayName: raw.DisplayName ?? { UserLocalizedLabel: { Label: entityName } },
        Attributes: attrs
      };
      metadataCache.set(entityName, metadata);
      return metadata;
    } catch (error) {
      console.debug(...UILIB, `Failed to fetch metadata for ${entityName} via Xrm:`, error);
    }
  }

  // Try direct REST API
  if (apiMode === 'xrm' || apiMode === 'direct') {
    try {
      console.debug(...UILIB, `[Lookup] Using direct Web API for ${entityName} metadata`);
      const meta = await directFetchMeta(entityName);
      const converted: EntityMetadata = {
        EntitySetName: meta.EntitySetName,
        PrimaryIdAttribute: meta.PrimaryIdAttribute,
        PrimaryNameAttribute: meta.PrimaryNameAttribute,
        DisplayName: {
          UserLocalizedLabel: {
            Label: meta.DisplayName?.UserLocalizedLabel?.Label ?? entityName.charAt(0).toUpperCase() + entityName.slice(1)
          }
        },
        Attributes: meta.Attributes?.map(a => ({
          LogicalName: a.LogicalName,
          DisplayName: { UserLocalizedLabel: { Label: a.DisplayName?.UserLocalizedLabel?.Label ?? a.LogicalName } },
          AttributeType: a.AttributeType
        })) ?? []
      };
      metadataCache.set(entityName, converted);
      return converted;
    } catch (error) {
      console.debug(...UILIB, `Failed to fetch metadata for ${entityName} via direct API:`, error);
    }
  }

  // Return mock metadata if no API available
  const mockMetadata: EntityMetadata = {
    EntitySetName: `${entityName}s`,
    PrimaryIdAttribute: `${entityName}id`,
    PrimaryNameAttribute: entityName === 'account' ? 'name' : entityName === 'contact' ? 'fullname' : 'name',
    DisplayName: { UserLocalizedLabel: { Label: entityName.charAt(0).toUpperCase() + entityName.slice(1) } },
    Attributes: []
  };

  metadataCache.set(entityName, mockMetadata);
  return mockMetadata;
}

/**
 * Convert simple OData filter expressions to FetchXML conditions.
 * Handles patterns produced by buildCombinedFilter():
 *   - `attr eq 123`  (numeric)
 *   - `attr eq 'text'`  (string)
 *   - `_attr_value eq guid`  (lookup)
 *   - Multiple conditions joined by ` and `
 * Returns a <filter type="and">...</filter> string, or '' if empty.
 */
function odataFilterToFetchXml(odata: string): string {
  if (!odata || odata.trim() === '') return '';

  // If it already looks like FetchXML, return as-is
  if (odata.includes('<filter') || odata.includes('<condition')) return odata;

  const conditions: string[] = [];
  // Split on ' and ' (case-insensitive, surrounded by spaces)
  const parts = odata.split(/\s+and\s+/i);

  for (const part of parts) {
    const trimmed = part.trim();
    // Match: attribute operator value
    // e.g. "statecode eq 0", "_hnc_x_value eq guid", "name eq 'text'"
    const match = trimmed.match(/^([a-zA-Z0-9_]+)\s+(eq|ne|gt|ge|lt|le)\s+(.+)$/);
    if (match) {
      let [, attr, op, val] = match;

      // Map OData operators to FetchXML operators
      const opMap: Record<string, string> = { eq: 'eq', ne: 'ne', gt: 'gt', ge: 'ge', lt: 'lt', le: 'le' };
      const fetchOp = opMap[op] || 'eq';

      // Strip quotes from string values
      val = val.replace(/^'(.*)'$/, '$1');

      // Convert _xxx_value lookup columns to logical name for FetchXML
      if (isLookupColumn(attr)) {
        attr = lookupToLogicalName(attr);
      }

      conditions.push(`<condition attribute='${attr}' operator='${fetchOp}' value='${val}' />`);
    } else {
      // Unrecognised pattern — skip (will be handled by OData fallback if FetchXML fails)
      console.debug(...UILIB, `[Lookup] Skipping unrecognised filter fragment for FetchXML: ${trimmed}`);
    }
  }

  if (conditions.length === 0) return '';
  return `<filter type="and">${conditions.join('')}</filter>`;
}

// Fetch entity records
async function fetchRecords(
  entity: string,
  columns: string[],
  filters?: string,
  orderBy?: Array<{ attribute: string; descending?: boolean }>,
  pageNumber: number = 1,
  pageSize: number = 50,
  searchTerm?: string,
  searchFields?: string[]
): Promise<{ entities: any[]; totalCount: number }> {

  const apiMode = await getD365ApiMode();

  // Filter searchFields to exclude non-string types AND lookup columns (GUIDs aren't searchable)
  let safeSearchFields = searchFields;
  if (searchFields && searchFields.length > 0) {
    // Always exclude lookup columns (_xxx_value) — they contain GUIDs, not text
    safeSearchFields = searchFields.filter(f => !isLookupColumn(f));

    const meta = metadataCache.get(entity);
    if (meta?.Attributes && meta.Attributes.length > 0) {
      safeSearchFields = safeSearchFields.filter(f => {
        const attr = meta.Attributes!.find(a => a.LogicalName === f);
        // If attribute not found in metadata, INCLUDE it (likely a string custom field)
        // Only exclude attributes we KNOW are non-string types
        return attr ? !NON_STRING_ATTR_TYPES.has(attr.AttributeType) : true;
      });
      // Fall back to primary name attribute if no string fields match
      if (safeSearchFields.length === 0 && meta.PrimaryNameAttribute) {
        safeSearchFields = [meta.PrimaryNameAttribute];
      }
    }
  }

  // ---- Xrm SDK path ----
  if (apiMode === 'xrm' && window.Xrm?.WebApi?.retrieveMultipleRecords) {
    try {
      // Combine columns with search fields to ensure all searchable fields are fetched
      const allColumns = [...new Set([...columns, ...(safeSearchFields || [])])];

      let fetchXml = `<fetch mapping='logical' page='${pageNumber}' count='${pageSize}' returntotalrecordcount='true'>
        <entity name='${entity}'>`;

      allColumns.forEach(col => {
        // Convert _xxx_value → xxx for FetchXML (lookup columns)
        fetchXml += `<attribute name='${toFetchXmlAttr(col)}' />`;
      });

      // Add search filter if provided
      let combinedFilters = '';
      // Convert OData filters to FetchXML conditions
      const fetchXmlFilters = filters ? odataFilterToFetchXml(filters) : '';

      if (searchTerm && safeSearchFields && safeSearchFields.length > 0) {
        let searchFilter = '<filter type="or">';
        safeSearchFields.forEach(field => {
          // Use 'like' operator for contains behavior
          searchFilter += `<condition attribute='${field}' operator='like' value='%${searchTerm}%' />`;
        });
        searchFilter += '</filter>';

        if (fetchXmlFilters) {
          combinedFilters = `<filter type="and">${searchFilter}${fetchXmlFilters}</filter>`;
        } else {
          combinedFilters = searchFilter;
        }
      } else if (fetchXmlFilters) {
        combinedFilters = fetchXmlFilters;
      }

      if (combinedFilters) {
        fetchXml += combinedFilters;
      }

      if (orderBy && orderBy.length > 0) {
        orderBy.forEach(order => {
          fetchXml += `<order attribute='${order.attribute}' ${order.descending ? "descending='true'" : ''} />`;
        });
      }

      fetchXml += `</entity></fetch>`;

      const result = await window.Xrm.WebApi.retrieveMultipleRecords(entity, `?fetchXml=${encodeURIComponent(fetchXml)}`);

      return {
        entities: result.entities || [],
        totalCount: parseInt(result['@Microsoft.Dynamics.CRM.totalrecordcount'] || result.entities?.length || '0', 10)
      };
    } catch (error) {
      console.debug(...UILIB, `Failed to fetch ${entity} records via Xrm.WebApi:`, error);
    }
  }

  // ---- Direct REST API path (pop-out / broken Xrm) ----
  if (apiMode === 'xrm' || apiMode === 'direct') {
    try {
      console.debug(...UILIB, `[Lookup] Using direct Web API for ${entity} records`);

      // Resolve entity set name from metadata
      const meta = await getEntityMetadata(entity);
      const entitySetName = meta?.EntitySetName ?? `${entity}s`;

      const allColumns = [...new Set([...columns, ...(safeSearchFields || [])])];

      // Build OData query
      let filterParts: string[] = [];

      if (searchTerm && safeSearchFields && safeSearchFields.length > 0) {
        const searchFilter = safeSearchFields
          .map(f => `contains(${f}, '${searchTerm}')`)
          .join(' or ');
        filterParts.push(`(${searchFilter})`);
      }

      // Only use filters if they're OData (not FetchXML)
      if (filters && !filters.includes('<filter') && !filters.includes('<condition')) {
        filterParts.push(`(${filters})`);
      }

      let query = `?$select=${allColumns.join(',')}`;
      if (filterParts.length > 0) {
        query += `&$filter=${filterParts.join(' and ')}`;
      }
      query += `&$top=${pageSize}&$count=true`;

      if (orderBy && orderBy.length > 0) {
        const orderStr = orderBy.map(o => `${o.attribute} ${o.descending ? 'desc' : 'asc'}`).join(',');
        query += `&$orderby=${orderStr}`;
      }

      const result = await directRetrieve(entitySetName, query);
      return result;
    } catch (error) {
      console.debug(...UILIB, `Failed to fetch ${entity} records via direct API:`, error);
    }
  }

  // Fall back to mock data
  const allMockData = generateMockData(entity, 100);

  // Apply search filter for mock data (contains)
  let filteredData = allMockData;
  if (searchTerm && searchFields && searchFields.length > 0) {
    const lowerSearch = searchTerm.toLowerCase();
    filteredData = allMockData.filter(record => {
      return searchFields.some(field => {
        const value = record[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowerSearch);
      });
    });
  }

  // Apply ordering
  if (orderBy && orderBy.length > 0) {
    const order = orderBy[0];
    filteredData.sort((a, b) => {
      const aVal = a[order.attribute];
      const bVal = b[order.attribute];
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return order.descending ? -comparison : comparison;
    });
  }

  // Apply pagination
  const start = (pageNumber - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = filteredData.slice(start, end);

  return {
    entities: paginatedData,
    totalCount: filteredData.length
  };
}

// D365 attribute types that are NOT searchable with contains/like
const NON_STRING_ATTR_TYPES = new Set([
  'Money', 'Boolean', 'Picklist', 'State', 'Status',
  'Integer', 'BigInt', 'Decimal', 'Double',
  'DateTime', 'Lookup', 'Customer', 'Owner',
  'Uniqueidentifier', 'Virtual', 'EntityName',
  'ManagedProperty', 'CalendarRules'
]);

/**
 * Detect if a column name is a D365 lookup/navigation property (e.g. _hnc_supplier_value).
 * OData uses `_logicalname_value`, FetchXML uses `logicalname`.
 */
function isLookupColumn(col: string): boolean {
  return col.startsWith('_') && col.endsWith('_value');
}

/** Convert OData lookup column `_hnc_supplier_value` → FetchXML attribute `hnc_supplier` */
function lookupToLogicalName(col: string): string {
  return col.slice(1, -6); // strip leading '_' and trailing '_value'
}

/** Convert FetchXML attribute name to the OData column name used in results */
function toFetchXmlAttr(col: string): string {
  return isLookupColumn(col) ? lookupToLogicalName(col) : col;
}

// D365 attribute types for styled formatting
const MONEY_TYPES = new Set(['Money']);
const BOOLEAN_TYPES = new Set(['Boolean']);
const OPTIONSET_TYPES = new Set(['Picklist', 'State', 'Status']);

// Fixed-width constraints keyed by TableColumnFormat (the unified format string
// used by both Modal tables and Lookups). Columns whose resolved format is in
// this map get a fixed `width` instead of a flexible `minWidth`.
const FIXED_WIDTH_TYPES: Record<string, { min: number; max: number }> = {
  'boolean':        { min: 80, max: 120 },
  'boolean-check':  { min: 70, max: 110 },
  'currency':       { min: 100, max: 160 },
  'percent':        { min: 80, max: 130 },
  'number':         { min: 80, max: 140 },
  'decimal':        { min: 80, max: 140 },
  'integer':        { min: 70, max: 130 },
  'date':           { min: 100, max: 160 },
  'datetime':       { min: 130, max: 200 },
  'badge':          { min: 80, max: 200 },
};

/**
 * Auto-size columns that don't have an explicit `width` or `minWidth`.
 * Mutates the input array — columns that already have sizing are untouched.
 *
 * - Columns with a format in FIXED_WIDTH_TYPES get a fixed `width`
 * - All others get a flexible `minWidth` bounded by header text
 */
function autoSizeColumns(
  tableColumns: TableColumn[],
  tableData: any[],
  metadata: any | undefined
): void {
  const CHAR_WIDTH = 8;
  const PADDING = 32;
  const HEADER_EXTRA = 40;
  const TEXT_FLOOR_MIN = 80;
  const TEXT_FLOOR_MAX = 180;
  const HEADER_FLOOR_PAD = 16;

  for (const col of tableColumns) {
    // Elastic columns always get minWidth (never fixed width) so the
    // TableFluentUi sizing logic can give them all the remaining space.
    // Skip columns that already have explicit sizing (unless elastic).
    if (!col.elastic && (col.width || col.minWidth)) continue;

    // Resolve format (explicit or from metadata)
    const attrMeta = metadata?.Attributes?.find((a: any) => a.LogicalName === col.id);
    const colFormat = resolveColumnFormat(col.format, attrMeta?.AttributeType);

    // Header width
    const headerText = col.header || col.id;
    const headerWidth = (headerText.length * CHAR_WIDTH) + HEADER_EXTRA;

    // Max data content width
    let maxContentLen = 0;
    for (const row of tableData) {
      const val = row[col.id];
      if (val == null || val === '') continue;
      const text = typeof val === 'string' && val.includes('<')
        ? val.replace(/<[^>]*>/g, '')
        : String(val);
      maxContentLen = Math.max(maxContentLen, text.length);
    }
    const contentWidth = (maxContentLen * CHAR_WIDTH) + PADDING;

    // Type-based sizing
    const typeConstraint = colFormat ? FIXED_WIDTH_TYPES[colFormat] : undefined;

    if (col.elastic) {
      // Elastic column: always flexible, never fixed. Use header-based floor.
      const headerFloor = Math.min(TEXT_FLOOR_MAX, headerWidth + HEADER_FLOOR_PAD);
      col.minWidth = `${Math.max(TEXT_FLOOR_MIN, headerFloor)}px`;
      delete col.width; // ensure no fixed width overrides elastic behavior
    } else if (typeConstraint) {
      const ideal = Math.max(headerWidth, contentWidth);
      const clamped = Math.max(typeConstraint.min, Math.min(typeConstraint.max, ideal));
      col.width = `${clamped}px`;
    } else {
      const headerFloor = Math.min(TEXT_FLOOR_MAX, headerWidth + HEADER_FLOOR_PAD);
      const minW = Math.max(TEXT_FLOOR_MIN, headerFloor);
      col.minWidth = `${minW}px`;
    }

    // Also auto-set format if the user didn't provide one but metadata says it should have one
    if (!col.format && colFormat) {
      (col as any).format = colFormat;
    }

    // Auto-align based on format
    if (!col.align && colFormat) {
      const numericFormats = ['currency', 'percent', 'number', 'decimal', 'integer'];
      const centeredFormats = ['boolean', 'boolean-check'];
      if (centeredFormats.indexOf(colFormat) !== -1) {
        col.align = 'center';
      } else if (numericFormats.indexOf(colFormat) !== -1) {
        col.align = 'right';
      }
    }
  }
}

/**
 * Extract a cell value from a D365 record for the lookup table.
 *
 * When the column has an explicit `format` (via `TableColumn.format`), pass the
 * raw value through — `TableFluentUi.formatCellValue` will handle the rendering.
 *
 * When no explicit format is set, use D365's `FormattedValue` annotation if
 * available (it already contains locale-aware formatting for dates, option sets,
 * lookups, etc.). Otherwise fall back to the raw value.
 *
 * This keeps Lookup as a thin data extractor. All visual formatting lives in
 * `TableFluentUi` — one rendering pipeline for both Modal tables and Lookups.
 */
function extractCellValue(
  record: any,
  column: string,
  columnFormat?: string
): any {
  const rawValue = record[column];
  const formattedKey = `${column}@OData.Community.Display.V1.FormattedValue`;
  const formattedValue = record[formattedKey];

  // When the column has an explicit format (e.g. 'currency', 'percent',
  // 'boolean-check'), pass the raw value so TableFluentUi can format it.
  if (columnFormat) {
    return rawValue ?? null;
  }

  // No explicit format — use D365's formatted value when available.
  if (formattedValue != null) {
    return formattedValue;
  }

  // Fallback: raw value as-is. TableFluentUi will render it as text.
  if (rawValue != null && typeof rawValue === 'object' && rawValue._value !== undefined) {
    return rawValue._value || '';
  }

  return rawValue ?? '';
}

/**
 * Resolve the effective format for a column. If the column already has an
 * explicit `format`, return it. Otherwise auto-detect from D365 metadata.
 */
function resolveColumnFormat(
  explicitFormat?: string,
  attributeType?: string
): string | undefined {
  if (explicitFormat) return explicitFormat;

  if (attributeType) {
    if (MONEY_TYPES.has(attributeType))     return 'currency';
    if (BOOLEAN_TYPES.has(attributeType))   return 'boolean';
    if (OPTIONSET_TYPES.has(attributeType)) return 'badge';
    if (attributeType === 'DateTime')       return 'datetime';
    if (attributeType === 'Integer' || attributeType === 'BigInt') return 'integer';
    if (attributeType === 'Decimal' || attributeType === 'Double') return 'number';
  }

  return undefined;
}

// Fetch option set values from D365
async function fetchOptionSetValues(
  entityName: string,
  attributeName: string
): Promise<Array<{ label: string; value: string }>> {
  const apiMode = await getD365ApiMode();

  if (apiMode === 'xrm' && (window as any).Xrm?.Utility?.getEntityMetadata) {
    try {
      const Xrm = (window as any).Xrm;
      const attribute = await Xrm.Utility.getEntityMetadata(entityName, [attributeName]);
      const attrMeta = attribute.Attributes._collection[attributeName];
      if (attrMeta?.OptionSet?.Options) {
        return attrMeta.OptionSet.Options.map((o: any) => ({
          label: o.Label,
          value: o.Value.toString()
        }));
      }
    } catch (error) {
      console.debug(...UILIB, `[Lookup] Could not fetch option set ${entityName}.${attributeName} via Xrm:`, error);
    }
  }

  if (apiMode === 'xrm' || apiMode === 'direct') {
    try {
      return await directFetchOptionSet(entityName, attributeName);
    } catch (error) {
      console.debug(...UILIB, `[Lookup] Could not fetch option set ${entityName}.${attributeName} via direct API:`, error);
    }
  }

  return [];
}

export class Lookup {
  private static activeModal: Modal | null = null;

  private options: Required<Omit<LookupOptions, 'preFilters' | 'size'>> & { preFilters: PreFilter[] };
  /** Column IDs derived from tableColumns — used for OData fetch / search */
  private columnIds: string[];
  private records: any[] = [];
  private filteredRecords: any[] = [];
  private selectedRecords: Set<string> = new Set();
  private searchTerm: string = '';
  private preFilterValues: Map<string, string> = new Map();
  private currentModal: Modal | null = null;

  private constructor(options: LookupOptions) {
    // Derive column ID list from the tableColumns definitions
    this.columnIds = options.tableColumns.map(c => c.id);

    // Set defaults — tableColumns is stored as-is (same shape as Modal tables)
    this.options = {
      entity: options.entity || 'account',
      tableColumns: options.tableColumns.map(c => ({
        ...c,
        visible: c.visible !== false,
        sortable: c.sortable !== false
      })),
      filters: options.filters || '',
      orderBy: options.orderBy || [],
      multiSelect: options.multiSelect ?? false,
      searchFields: options.searchFields || this.columnIds,
      additionalSearchFields: options.additionalSearchFields || [],
      defaultSearchTerm: options.defaultSearchTerm || '',
      preFilters: options.preFilters || [],
      title: options.title || `Select ${options.entity?.charAt(0).toUpperCase()}${options.entity?.slice(1)}`,
      message: options.message || '',
      content: options.content || '',
      width: options.width || (options.size as any)?.width || 900,
      height: options.height || (options.size as any)?.height || 600,
      pageSize: options.pageSize || 50,
      showPagination: options.showPagination ?? true,
      allowClear: options.allowClear ?? false,
      onSelect: options.onSelect,
      onCancel: options.onCancel || (() => { })
    };


    this.searchTerm = this.options.defaultSearchTerm;

    // Set default preFilter values
    for (const pf of this.options.preFilters) {
      if (pf.type !== 'lookup' && pf.defaultValue) {
        this.preFilterValues.set(pf.attribute, pf.defaultValue);
      }
    }

    this.init();
  }

  /** Resolve option-set prefilter options, then load records and create modal */
  private async init(): Promise<void> {
    await getEntityMetadata(this.options.entity);

    // Resolve option-set prefilter options from D365 metadata
    for (const pf of this.options.preFilters) {
      if (pf.type === 'optionset' && !pf.options) {
        const fetched = await fetchOptionSetValues(this.options.entity, pf.attribute);
        (pf as any)._resolvedOptions = fetched;
      }
    }

    await this.loadRecords();
    this.createModal();
  }

  /** Build the combined filter string (base filter + prefilter values) */
  private buildCombinedFilter(): string {
    const parts: string[] = [];

    // Base filter from options
    if (this.options.filters) {
      parts.push(this.options.filters);
    }

    // Add preFilter conditions
    for (const [attr, val] of this.preFilterValues.entries()) {
      if (!val) continue;

      const pf = this.options.preFilters.find(p => p.attribute === attr);
      if (!pf) continue;

      if (pf.type === 'lookup') {
        // Lookup value is a GUID — need _xxx_value format for OData
        // User may pass 'hnc_supplier' or '_hnc_supplier_value' — normalise to OData format
        const odataAttr = isLookupColumn(attr) ? attr : `_${attr}_value`;
        parts.push(`${odataAttr} eq ${val}`);
      } else {
        // Option-set / select — numeric or string equality
        const isNumeric = /^\d+$/.test(val);
        parts.push(isNumeric ? `${attr} eq ${val}` : `${attr} eq '${val}'`);
      }
    }

    return parts.join(' and ');
  }

  private async loadRecords(): Promise<void> {
    const combinedFilter = this.buildCombinedFilter();

    const result = await fetchRecords(
      this.options.entity,
      this.columnIds,
      combinedFilter || undefined,
      this.options.orderBy,
      1,
      this.options.pageSize,
      this.searchTerm || undefined,
      this.searchTerm ? [...this.options.searchFields, ...this.options.additionalSearchFields] : undefined
    );

    this.records = result.entities;
    this.filteredRecords = [...this.records];
  }

  /** Re-fetch records with current prefilter + search state and update the table */
  private async refreshTable(): Promise<void> {
    await this.loadRecords();

    if (this.currentModal) {
      const metadata = metadataCache.get(this.options.entity);
      const primaryIdAttr = metadata?.PrimaryIdAttribute || `${this.options.entity}id`;

      const updatedData = this.filteredRecords.map(record => {
        const row: any = { _id: record[primaryIdAttr] };
        this.options.tableColumns.forEach(col => {
          const colFormat = resolveColumnFormat(col.format,
            metadata?.Attributes?.find(a => a.LogicalName === col.id)?.AttributeType);
          row[col.id] = extractCellValue(record, col.id, colFormat);
        });
        return row;
      });
      this.currentModal.setFieldValue('table', updatedData);
    }
  }

  private createModal(): void {
    const metadata = metadataCache.get(this.options.entity);
    const primaryIdAttr = metadata?.PrimaryIdAttribute || `${this.options.entity}id`;

    // Prepare table data — pass raw values, let TableFluentUi format them.
    const tableData = this.filteredRecords.map(record => {
      const row: any = { _id: record[primaryIdAttr] };
      this.options.tableColumns.forEach(col => {
        const colFormat = resolveColumnFormat(col.format,
          metadata?.Attributes?.find(a => a.LogicalName === col.id)?.AttributeType);
        row[col.id] = extractCellValue(record, col.id, colFormat);
      });
      return row;
    });

    // Deep-copy columns so autoSizeColumns can mutate without touching the
    // original options (which are reused on refreshTable).
    const columns: TableColumn[] = this.options.tableColumns.map(c => ({ ...c }));

    // Auto-size columns that don't have explicit width/minWidth, and auto-set
    // format + align from D365 metadata for columns that don't specify them.
    autoSizeColumns(columns, tableData, metadata);

    const self = this;

    // ---- Build fields array: search → prefilters (in a group) → table ----
    const fields: any[] = [
      {
        id: 'search',
        type: 'search',
        placeholder: 'Search...',
        value: this.searchTerm,
        label: '',
        onChange: (value: string) => {
          self.searchTerm = value;
          self.refreshTable();
        }
      }
    ];

    // Add prefilter fields in a horizontal group
    if (this.options.preFilters.length > 0) {
      const preFilterFields: any[] = [];

      for (const pf of this.options.preFilters) {
        if (pf.type === 'optionset' || pf.type === 'select') {
          // Dropdown prefilter
          let opts: Array<{ label: string; value: string }> = [];

          if (pf.type === 'optionset') {
            opts = pf.options ?? (pf as any)._resolvedOptions ?? [];
          } else {
            opts = pf.options ?? [];
          }

          const includeAll = pf.includeAll !== false; // default: true
          const dropdownOptions = includeAll
            ? [{ label: 'All', value: '' }, ...opts]
            : [...opts];

          preFilterFields.push({
            id: `_pf_${pf.attribute}`,
            type: 'select',
            label: pf.label || pf.attribute,
            options: dropdownOptions,
            value: pf.defaultValue || '',
            onChange: (value: string) => {
              if (value) {
                self.preFilterValues.set(pf.attribute, value);
              } else {
                self.preFilterValues.delete(pf.attribute);
              }
              self.refreshTable();
            }
          });

        } else if (pf.type === 'lookup') {
          // Lookup prefilter (related record picker)
          preFilterFields.push({
            id: `_pf_${pf.attribute}`,
            type: 'lookup',
            label: pf.label || pf.attribute,
            entityName: pf.entityName,
            entityDisplayName: pf.entityDisplayName,
            lookupColumns: pf.lookupColumns || ['name'],
            filters: pf.filters || '',
            placeholder: `Filter by ${pf.label || pf.entityDisplayName || pf.entityName}...`,
            onChange: (selected: any) => {
              if (selected?.id) {
                self.preFilterValues.set(pf.attribute, selected.id);
              } else {
                self.preFilterValues.delete(pf.attribute);
              }
              self.refreshTable();
            }
          });
        }
      }

      // Wrap in a group so they render in a row
      fields.push({
        id: '_prefilters_group',
        type: 'group',
        label: '',
        fields: preFilterFields
      });
    }

    // Table field
    fields.push({
      id: 'table',
      type: 'table',
      tableColumns: columns,
      data: tableData,
      selectionMode: this.options.multiSelect ? 'multiple' as const : 'single' as const,
      onRowSelect: (selectedRows: any[]) => {
        this.selectedRecords = new Set(selectedRows.map(r => r._id));
      },
      onRowDoubleClick: (row: any) => {
        // Open the D365 record in a new tab
        const recordId = row._id;
        if (!recordId) return;
        self.openRecord(recordId);
      }
    });

    // Create modal buttons
    const buttons = [
      new ModalButton('Select', () => this.select(), true, false, false),
      new ModalButton('Cancel', () => this.cancel(), false, false, false)
    ];

    if (this.options.allowClear) {
      buttons.unshift(new ModalButton('Clear', () => this.clear(), false, false, false));
    }

    // Create and show modal
    const modal = new Modal({
      title: this.options.title,
      message: this.options.message || undefined,
      content: this.options.content || undefined,
      fields: fields,
      buttons: buttons,
      size: 'custom',
      width: this.options.width,
      height: this.options.height,
      allowEscapeClose: true
    });

    this.currentModal = modal;
    Lookup.activeModal = modal;
    modal.show();
  }

  private select(): void {
    const metadata = metadataCache.get(this.options.entity);
    const primaryIdAttr = metadata?.PrimaryIdAttribute || `${this.options.entity}id`;
    const primaryNameAttr = metadata?.PrimaryNameAttribute || 'name';

    const selectedResults: LookupResult[] = Array.from(this.selectedRecords).map(id => {
      const record = this.records.find(r => r[primaryIdAttr] === id);
      if (!record) return null;

      return {
        id: record[primaryIdAttr],
        name: record[primaryNameAttr] || record.name || '',
        entityType: this.options.entity,
        attributes: record
      };
    }).filter((r): r is LookupResult => r !== null);

    this.options.onSelect(selectedResults);
    if (Lookup.activeModal) {
      Lookup.activeModal.close();
    }
  }

  private cancel(): void {
    this.options.onCancel();
    if (Lookup.activeModal) {
      Lookup.activeModal.close();
    }
  }

  private openRecord(recordId: string): void {
    const entityName = this.options.entity;
    const Xrm = (window as any).Xrm;

    // Try Xrm.Navigation.openForm (D365 native)
    if (Xrm?.Navigation?.openForm) {
      Xrm.Navigation.openForm({
        entityName,
        entityId: recordId,
        openInNewWindow: true
      });
      return;
    }

    // Fallback: construct D365 URL and open in new tab
    try {
      const baseUrl = Xrm?.Utility?.getGlobalContext?.()?.getClientUrl?.()
        || window.location.origin;
      const url = `${baseUrl}/main.aspx?etn=${entityName}&id=${recordId}&pagetype=entityrecord`;
      window.open(url, '_blank', 'noopener');
    } catch {
      console.warn(...UILIB, '[Lookup] Could not open record — no Xrm context available');
    }
  }

  private clear(): void {
    this.selectedRecords.clear();
    this.options.onSelect([]);
    if (Lookup.activeModal) {
      Lookup.activeModal.close();
    }
  }

  static open(options: LookupOptions): void {
    // Close any existing lookup
    if (Lookup.activeModal) {
      Lookup.activeModal.close();
    }

    new Lookup(options);
  }
}
