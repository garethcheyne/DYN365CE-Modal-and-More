/**
 * Lookup Component
 * Advanced entity record lookup with table display, search, pagination
 * Uses Modal component with Fluent UI SearchBox and Table
 */

import { Modal } from '../Modal/Modal';
import { ModalButton } from '../Modal/Modal.types';
import type { LookupOptions, LookupResult, EntityMetadata } from './Lookup.types';
import { UILIB } from '../Logger/Logger';

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

  // Try to use Xrm API if available
  if (typeof window !== 'undefined' && window.Xrm?.Utility?.getEntityMetadata) {
    try {
      const metadata = await window.Xrm.Utility.getEntityMetadata(entityName);
      metadataCache.set(entityName, metadata);
      return metadata;
    } catch (error) {
      console.debug(...UILIB, `Failed to fetch metadata for ${entityName}:`, error);
    }
  }

  // Return mock metadata if Xrm not available
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

  // Try to use Xrm API if available
  if (typeof window !== 'undefined' && window.Xrm?.WebApi?.retrieveMultipleRecords) {
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

export class Lookup {
  private static activeModal: Modal | null = null;

  private options: Required<LookupOptions>;
  private records: any[] = [];
  private filteredRecords: any[] = [];
  private selectedRecords: Set<string> = new Set();
  private searchTerm: string = '';

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
    this.loadRecords();
  }

  private async loadRecords(): Promise<void> {
    await getEntityMetadata(this.options.entity);
    
    // Fetch records
    const result = await fetchRecords(
      this.options.entity,
      this.options.columns,
      this.options.filters,
      this.options.orderBy,
      1,
      this.options.pageSize
    );

    this.records = result.entities;
    this.filterRecords();
    this.createModal();
  }

  private filterRecords(): void {
    if (!this.searchTerm) {
      this.filteredRecords = [...this.records];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    const searchFields = [...this.options.searchFields, ...this.options.additionalSearchFields];

    this.filteredRecords = this.records.filter(record => {
      return searchFields.some(field => {
        const value = record[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchLower);
      });
    });
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

    // Prepare table data - map records to match column structure
    const tableData = this.filteredRecords.map(record => {
      const row: any = { _id: record[primaryIdAttr] };
      this.options.columns.forEach(col => {
        row[col] = formatValue(record[col]);
      });
      return row;
    });

    // Create modal fields
    const fields = [
      {
        id: 'search',
        type: 'text',
        placeholder: 'Search...',
        value: this.searchTerm,
        label: 'Search',
        labelPosition: 'top' as const
      },
      {
        id: 'table',
        type: 'table',
        tableColumns: columns,
        data: tableData,
        selectionMode: this.options.multiSelect ? 'multiple' as const : 'single' as const,
        onRowSelect: (selectedRows: any[]) => {
          this.selectedRecords = new Set(selectedRows.map(r => r._id));
        }
      }
    ];

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
