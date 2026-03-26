/**
 * Lookup Component Type Definitions
 */

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
 * PreFilter: option-set dropdown auto-populated from D365 metadata
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
  entity: string;
  columns: string[];
  columnLabels?: Record<string, string>;
  filters?: string;
  orderBy?: OrderByOption[];
  multiSelect?: boolean;
  searchFields?: string[]; // Fields to search (defaults to columns if not specified)
  additionalSearchFields?: string[]; // Additional fields to search but not display
  defaultSearchTerm?: string;
  /** PreFilter dropdowns/lookups displayed in a horizontal row between search and table */
  preFilters?: PreFilter[];
  title?: string;
  size?: { width?: number; height?: number };
  width?: number;
  height?: number;
  pageSize?: number;
  showPagination?: boolean;
  allowClear?: boolean;
  onSelect: (records: LookupResult[]) => void;
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
