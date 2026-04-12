/**
 * Lookup Component Type Definitions
 *
 * The Lookup uses the same `TableColumn` shape as Modal `type: 'table'` fields.
 * One rendering pipeline (TableFluentUi) handles both — same format types,
 * same width handling, same cell renderer.
 */

import type { TableColumn } from '../Modal/Modal.types';

export interface LookupResult {
  id: string;
  name: string;
  entityType: string;
  attributes: Record<string, any>;
}

export interface OrderByOption {
  attribute: string;
  descending?: boolean;
}

/**
 * PreFilter: option-set dropdown auto-populated from D365 entity metadata
 */
export interface PreFilterOptionSet {
  type: 'optionset';
  /** The attribute logical name on the main entity (e.g. 'statecode') */
  attribute: string;
  /** Display label shown above the dropdown */
  label?: string;
  /** Include a blank "All" option at the top (default: true) */
  includeAll?: boolean;
  /** Default selected value */
  defaultValue?: string;
  /** Manually provided options (skips D365 metadata fetch) */
  options?: Array<{ label: string; value: string }>;
}

/**
 * PreFilter: lookup field for filtering by a related record
 */
export interface PreFilterLookup {
  type: 'lookup';
  /** The attribute logical name on the main entity (e.g. '_parentaccountid_value') */
  attribute: string;
  /** Display label shown above the lookup */
  label?: string;
  /** Related entity logical name (e.g. 'account') */
  entityName: string;
  /** Display name override for the lookup header */
  entityDisplayName?: string;
  /** Columns to show in the lookup dropdown */
  lookupColumns?: string[];
  /** Optional OData filter for the lookup records */
  filters?: string;
}

/**
 * PreFilter: static dropdown with manually provided options
 */
export interface PreFilterSelect {
  type: 'select';
  /** The attribute logical name on the main entity to filter */
  attribute: string;
  /** Display label shown above the dropdown */
  label?: string;
  /** Dropdown options */
  options: Array<{ label: string; value: string }>;
  /** Include a blank "All" option at the top (default: true) */
  includeAll?: boolean;
  /** Default selected value */
  defaultValue?: string;
}

export type PreFilter = PreFilterOptionSet | PreFilterLookup | PreFilterSelect;

export interface LookupOptions {
  /** D365 entity logical name (e.g. 'product', 'account') */
  entity: string;
  /**
   * Column definitions — same shape as Modal `type: 'table'` fields.
   *
   * `id` is the D365 attribute logical name (used for both OData fetch and display).
   * `header` is the column label. `format` controls rendering (currency, percent,
   * boolean-check, badge, etc.). `width` / `minWidth` control sizing. `align`
   * controls text alignment. `sortable` enables click-to-sort.
   *
   * Columns without an explicit `width` or `minWidth` get auto-sized based on
   * header text width and D365 attribute type.
   *
   * ```js
   * tableColumns: [
   *   { id: 'name', header: 'Product Name', sortable: true },
   *   { id: 'hnc_productidpos', header: 'Code (SAP)', sortable: true, width: '120px' },
   *   { id: 'hnc_fx_basecostex', header: 'Base Cost Ex', format: 'currency', align: 'right' },
   *   { id: 'hnc_corestocked', header: 'Core Stocked', format: 'boolean-check', align: 'center' }
   * ]
   * ```
   */
  tableColumns: TableColumn[];
  /** OData filter expression */
  filters?: string;
  /** Order-by clauses */
  orderBy?: OrderByOption[];
  /** Allow multi-selection (default: false) */
  multiSelect?: boolean;
  /** Fields to search (defaults to all tableColumns ids) */
  searchFields?: string[];
  /** Additional fields to search but not display */
  additionalSearchFields?: string[];
  /** Pre-populate search box */
  defaultSearchTerm?: string;
  /** PreFilter dropdowns/lookups displayed between search and table */
  preFilters?: PreFilter[];
  /** Modal title */
  title?: string;
  /** Plain-text message rendered above the search box */
  message?: string;
  /** HTML content rendered above the search box (renders via innerHTML) */
  content?: string;
  /**
   * Modal size. Numbers are pixels; strings accept any CSS unit ('98%', '90vw').
   * Viewport-relative units (%, vw, vh) bypass the default 95vw/90vh safety cap.
   */
  size?: { width?: number | string; height?: number | string };
  width?: number | string;
  height?: number | string;
  /** Records per page (default: 50) */
  pageSize?: number;
  /** Show pagination controls (default: true) */
  showPagination?: boolean;
  /** Show clear/deselect button (default: false) */
  allowClear?: boolean;
  /** Called when user confirms selection */
  onSelect: (records: LookupResult[]) => void;
  /** Called when user cancels */
  onCancel?: () => void;
}

export interface EntityMetadata {
  EntitySetName: string;
  PrimaryIdAttribute: string;
  PrimaryNameAttribute: string;
  DisplayName: { UserLocalizedLabel: { Label: string } };
  Attributes?: Array<{
    LogicalName: string;
    DisplayName: { UserLocalizedLabel: { Label: string } };
    AttributeType: string;
  }>;
}
