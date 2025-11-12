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
  title?: string;
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
