/**
 * Lookup Component
 * Advanced entity record lookup with table display, search, pagination
 * Uses Modal component with Fluent UI SearchBox and Table
 */

import { Modal } from '../Modal/Modal';
import { ModalButton } from '../Modal/Modal.types';
import type { LookupOptions, LookupResult, EntityMetadata, PreFilter } from './Lookup.types';
import { UILIB } from '../Logger/Logger';
import { getD365ApiMode } from '../../utils/dom';
import { fetchEntityMetadata as directFetchMeta, retrieveMultipleRecords as directRetrieve, fetchOptionSet as directFetchOptionSet } from '../../utils/d365-web-api';

// Metadata cache to avoid repeated API calls
const metadataCache: Map<string, EntityMetadata> = new Map();

// Mock data generator for when Xrm is not available
function generateMockData(entity: string, count: number = 50): any[] {
  const mockData: any[] = [];

  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'William', 'Jennifer'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const companies = ['Acme Corp', 'TechCo', 'Global Industries', 'Innovation Labs', 'Premier Solutions', 'Summit Group', 'Venture Partners', 'Elite Services'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];

  for (let i = 0; i < count; i++) {
    const id = `${i + 1}`.padStart(8, '0') + '-0000-0000-0000-000000000000';

    if (entity === 'account') {
      const company = companies[i % companies.length];
      mockData.push({
        accountid: id,
        name: `${company} ${i > 7 ? i - 7 : ''}`.trim(),
        accountnumber: `ACC-${1000 + i}`,
        telephone1: `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        emailaddress1: `contact@${company.toLowerCase().replace(/\s/g, '')}.com`,
        address1_city: cities[i % cities.length],
        revenue: Math.floor(Math.random() * 10000000),
        websiteurl: `https://www.${company.toLowerCase().replace(/\s/g, '')}.com`,
        createdon: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    } else if (entity === 'contact') {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      mockData.push({
        contactid: id,
        fullname: `${firstName} ${lastName}`,
        name: `${firstName} ${lastName}`,
        firstname: firstName,
        lastname: lastName,
        emailaddress1: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        telephone1: `555-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        jobtitle: ['Manager', 'Director', 'VP', 'Analyst', 'Specialist'][i % 5],
        parentcustomerid: companies[i % companies.length],
        createdon: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    } else {
      // Generic entity
      mockData.push({
        [`${entity}id`]: id,
        name: `${entity.charAt(0).toUpperCase() + entity.slice(1)} Record ${i + 1}`,
        createdon: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
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
      const metadata = await window.Xrm.Utility.getEntityMetadata(entityName);
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

  // ---- Xrm SDK path ----
  if (apiMode === 'xrm' && window.Xrm?.WebApi?.retrieveMultipleRecords) {
    try {
      // Combine columns with search fields to ensure all searchable fields are fetched
      const allColumns = [...new Set([...columns, ...(searchFields || [])])];

      let fetchXml = `<fetch mapping='logical' page='${pageNumber}' count='${pageSize}' returntotalrecordcount='true'>
        <entity name='${entity}'>`;

      allColumns.forEach(col => {
        fetchXml += `<attribute name='${col}' />`;
      });

      // Add search filter if provided
      let combinedFilters = '';
      if (searchTerm && searchFields && searchFields.length > 0) {
        let searchFilter = '<filter type="or">';
        searchFields.forEach(field => {
          // Use 'like' operator for contains behavior
          searchFilter += `<condition attribute='${field}' operator='like' value='%${searchTerm}%' />`;
        });
        searchFilter += '</filter>';

        if (filters) {
          combinedFilters = `<filter type="and">${searchFilter}${filters}</filter>`;
        } else {
          combinedFilters = searchFilter;
        }
      } else if (filters) {
        combinedFilters = filters;
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

      const allColumns = [...new Set([...columns, ...(searchFields || [])])];

      // Build OData query
      let filterParts: string[] = [];

      if (searchTerm && searchFields && searchFields.length > 0) {
        const searchFilter = searchFields
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

// Format value for display
function formatValue(value: any, attributeType?: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (attributeType === 'DateTime' || value instanceof Date || /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    try {
      const date = new Date(value);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return String(value);
    }
  }

  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  if (typeof value === 'object' && value._value !== undefined) {
    // Lookup field
    return value._value || '';
  }

  return String(value);
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

  private options: Required<Omit<LookupOptions, 'preFilters'>> & { preFilters: PreFilter[] };
  private records: any[] = [];
  private filteredRecords: any[] = [];
  private selectedRecords: Set<string> = new Set();
  private searchTerm: string = '';
  private preFilterValues: Map<string, string> = new Map();
  private currentModal: Modal | null = null;

  private constructor(options: LookupOptions) {
    // Set defaults
    this.options = {
      entity: options.entity || 'account',
      columns: options.columns,
      columnLabels: options.columnLabels || {},
      filters: options.filters || '',
      orderBy: options.orderBy || [],
      multiSelect: options.multiSelect ?? false,
      searchFields: options.searchFields || options.columns,
      additionalSearchFields: options.additionalSearchFields || [],
      defaultSearchTerm: options.defaultSearchTerm || '',
      preFilters: options.preFilters || [],
      title: options.title || `Select ${options.entity?.charAt(0).toUpperCase()}${options.entity?.slice(1)}`,
      width: options.width || 900,
      height: options.height || 600,
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
        // Lookup value is a GUID — filter the _value navigation property
        parts.push(`_${attr}_value eq ${val}`);
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
      this.options.columns,
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
        this.options.columns.forEach(col => {
          row[col] = formatValue(record[col]);
        });
        return row;
      });
      this.currentModal.setFieldValue('table', updatedData);
    }
  }

  private createModal(): void {
    const metadata = metadataCache.get(this.options.entity);
    const primaryIdAttr = metadata?.PrimaryIdAttribute || `${this.options.entity}id`;

    // Prepare table columns
    const columns = this.options.columns.map(col => ({
      id: col,
      header: this.options.columnLabels[col] || col,
      visible: true,
      sortable: true
    }));

    // Prepare table data
    const tableData = this.filteredRecords.map(record => {
      const row: any = { _id: record[primaryIdAttr] };
      this.options.columns.forEach(col => {
        row[col] = formatValue(record[col]);
      });
      return row;
    });

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
