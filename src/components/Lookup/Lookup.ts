/**
 * Lookup Component
 * Advanced entity record lookup with table display, search, pagination
 */

import { theme } from '../../styles/theme';
import type { LookupOptions, LookupResult, EntityMetadata } from './Lookup.types';
import { getTargetDocument } from '../../utils/dom';

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
      console.warn(`Failed to fetch metadata for ${entityName}:`, error);
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
      console.warn(`Failed to fetch ${entity} records via Xrm.WebApi:`, error);
    }
  }
  
  // Fall back to mock data
  console.log(`Using mock data for entity: ${entity}`);
  const allMockData = generateMockData(entity, 100);
  
  // Apply search filter for mock data (contains)
  let filteredData = allMockData;
  if (searchTerm && searchFields && searchFields.length > 0) {
    const lowerSearch = searchTerm.toLowerCase();
    filteredData = allMockData.filter(record => {
      return searchFields.some(field => {
        const value = record[field];
        if (value === null || value === undefined) return false;
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
  private static activeInstance: Lookup | null = null;
  
  private options: Required<LookupOptions>;
  private container: HTMLDivElement;
  private overlay: HTMLDivElement;
  private modal: HTMLDivElement;
  private tableContainer: HTMLDivElement | null = null;
  private tableBody: HTMLTableSectionElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private paginationInfo: HTMLSpanElement | null = null;
  
  private currentPage: number = 1;
  private totalRecords: number = 0;
  private records: any[] = [];
  private allLoadedRecords: any[] = []; // Store all loaded records for infinite scroll
  private selectedRecords: Set<string> = new Set();
  private searchDebounceTimer: number = 0;
  private columnLabels: Map<string, string> = new Map();
  private sortColumn: string | null = null;
  private sortDescending: boolean = false;
  private isLoadingMore: boolean = false;
  private hasMoreRecords: boolean = true;
  
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
      onCancel: options.onCancel || (() => {})
    };
    
    const doc = getTargetDocument();
    
    // Create overlay
    this.overlay = doc.createElement('div');
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${theme.colors.modal.overlay};
      z-index: ${theme.zIndex.modal - 1};
      animation: fadeIn 0.2s ease-out;
    `;
    
    // Create modal container
    this.container = doc.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: ${theme.zIndex.modal};
      animation: fadeInScale 0.3s ease-out;
    `;
    
    // Create modal
    this.modal = doc.createElement('div');
    this.modal.style.cssText = `
      background: ${theme.colors.modal.background};
      border-radius: ${theme.borderRadius.medium};
      box-shadow: ${theme.shadows.modal};
      width: ${this.options.width}px;
      max-width: 95vw;
      height: ${this.options.height}px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    
    this.container.appendChild(this.modal);
    
    this.render();
  }
  
  private async render(): Promise<void> {
    // Header
    const header = this.createHeader();
    this.modal.appendChild(header);
    
    // Search bar
    const searchBar = this.createSearchBar();
    this.modal.appendChild(searchBar);
    
    // Table container
    const tableContainer = this.createTableContainer();
    this.modal.appendChild(tableContainer);
    
    // Pagination
    if (this.options.showPagination) {
      const pagination = this.createPagination();
      this.modal.appendChild(pagination);
    }
    
    // Footer
    const footer = this.createFooter();
    this.modal.appendChild(footer);
    
    // Load column labels and initial data
    await this.loadColumnLabels();
    await this.loadData();
  }
  
  private createHeader(): HTMLDivElement {
    const header = getTargetDocument().createElement('div');
    header.style.cssText = `
      padding: ${theme.spacing.l};
      border-bottom: 1px solid ${theme.colors.modal.divider};
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    `;
    
    const title = getTargetDocument().createElement('h2');
    title.textContent = this.options.title;
    title.style.cssText = `
      margin: 0;
      font-size: ${theme.typography.fontSize.title};
      font-weight: ${theme.typography.fontWeight.semibold};
      color: ${theme.colors.modal.text};
    `;
    
    const closeButton = getTargetDocument().createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 32px;
      line-height: 1;
      color: ${theme.colors.modal.textSecondary};
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    `;
    closeButton.onmouseover = () => closeButton.style.color = theme.colors.modal.text;
    closeButton.onmouseout = () => closeButton.style.color = theme.colors.modal.textSecondary;
    closeButton.onclick = () => this.cancel();
    
    header.appendChild(title);
    header.appendChild(closeButton);
    
    return header;
  }
  
  private createSearchBar(): HTMLDivElement {
    const searchBar = getTargetDocument().createElement('div');
    searchBar.style.cssText = `
      padding: ${theme.spacing.m} ${theme.spacing.l};
      border-bottom: 1px solid ${theme.colors.modal.divider};
      flex-shrink: 0;
    `;
    
    // Create wrapper for animated border effect
    const inputWrapper = getTargetDocument().createElement('div');
    inputWrapper.style.cssText = `
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
    `;
    
    // Add Fluent UI magnifying glass icon
    const searchIcon = getTargetDocument().createElement('span');
    searchIcon.innerHTML = '🔍';
    searchIcon.style.cssText = `
      position: absolute;
      left: ${theme.spacing.s};
      top: 50%;
      transform: translateY(-50%);
      font-size: 16px;
      color: ${theme.colors.modal.textSecondary};
      pointer-events: none;
      z-index: 1;
    `;
    
    this.searchInput = getTargetDocument().createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Search...';
    this.searchInput.value = this.options.defaultSearchTerm;
    this.searchInput.style.cssText = `
      width: 100%;
      padding: ${theme.spacing.s} ${theme.spacing.m};
      padding-left: 36px;
      background-color: ${theme.colors.modal.inputBackground};
      border: none;
      border-bottom: 1px solid ${theme.colors.modal.inputBorderBottom};
      border-radius: ${theme.borderRadius.small};
      font-size: ${theme.typography.fontSize.body};
      font-family: ${theme.typography.fontFamily};
      color: ${theme.colors.modal.inputText};
      outline: none;
      min-height: 32px;
      box-sizing: border-box;
    `;
    
    // Create animated bottom border element
    const borderElement = getTargetDocument().createElement('div');
    borderElement.style.cssText = `
      content: "";
      position: absolute;
      right: -1px;
      left: -1px;
      bottom: 0;
      height: 2px;
      background-color: ${theme.colors.modal.inputBorderFocus};
      transform: scaleX(0);
      transition: transform 0.01ms;
      transition-delay: 0.01ms;
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
      pointer-events: none;
    `;
    
    this.searchInput.onfocus = () => {
      borderElement.style.transform = 'scaleX(1)';
      borderElement.style.transitionDuration = '0.15s';
      borderElement.style.transitionDelay = '0s';
    };
    
    this.searchInput.onblur = () => {
      borderElement.style.transform = 'scaleX(0)';
      borderElement.style.transitionDuration = '0.01ms';
      borderElement.style.transitionDelay = '0.01ms';
    };
    
    this.searchInput.oninput = () => this.handleSearch();
    
    inputWrapper.appendChild(searchIcon);
    inputWrapper.appendChild(this.searchInput);
    inputWrapper.appendChild(borderElement);
    searchBar.appendChild(inputWrapper);
    
    return searchBar;
  }
  
  private createTableContainer(): HTMLDivElement {
    this.tableContainer = getTargetDocument().createElement('div');
    this.tableContainer.style.cssText = `
      flex: 1;
      overflow: auto;
      padding: ${theme.spacing.m} ${theme.spacing.l};
    `;
    
    // Add infinite scroll listener
    this.tableContainer.onscroll = () => this.handleScroll();
    
    const table = getTargetDocument().createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      font-size: ${theme.typography.fontSize.body};
    `;
    
    // Table header
    const thead = getTargetDocument().createElement('thead');
    const headerRow = getTargetDocument().createElement('tr');
    
    // Checkbox column for multi-select
    if (this.options.multiSelect) {
      const th = getTargetDocument().createElement('th');
      th.style.cssText = `
        padding: ${theme.spacing.s};
        text-align: left;
        border-bottom: 2px solid ${theme.colors.modal.divider};
        font-weight: ${theme.typography.fontWeight.semibold};
        color: ${theme.colors.modal.text};
        width: 40px;
      `;
      headerRow.appendChild(th);
    }
    
    // Data columns
    this.options.columns.forEach(column => {
      const th = getTargetDocument().createElement('th');
      th.style.cssText = `
        padding: ${theme.spacing.s};
        text-align: left;
        border-bottom: 2px solid ${theme.colors.modal.divider};
        font-weight: ${theme.typography.fontWeight.semibold};
        color: ${theme.colors.modal.text};
        cursor: pointer;
        user-select: none;
      `;
      
      th.onclick = () => this.handleSort(column);
      th.onmouseover = () => th.style.background = theme.colors.neutralLighter;
      th.onmouseout = () => th.style.background = 'transparent';
      
      const label = this.columnLabels.get(column) || column;
      th.textContent = label;
      
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Table body
    this.tableBody = getTargetDocument().createElement('tbody');
    table.appendChild(this.tableBody);
    
    this.tableContainer.appendChild(table);
    
    return this.tableContainer;
  }
  
  private createPagination(): HTMLDivElement {
    const pagination = getTargetDocument().createElement('div');
    pagination.style.cssText = `
      padding: ${theme.spacing.m} ${theme.spacing.l};
      border-top: 1px solid ${theme.colors.modal.divider};
      display: flex;
      justify-content: center;
      align-items: center;
      gap: ${theme.spacing.m};
      flex-shrink: 0;
    `;
    
    // Just show record count for infinite scroll
    this.paginationInfo = getTargetDocument().createElement('span');
    this.paginationInfo.style.cssText = `
      color: ${theme.colors.modal.textSecondary};
      font-size: ${theme.typography.fontSize.body};
    `;
    
    pagination.appendChild(this.paginationInfo);
    
    return pagination;
  }
  
  private createFooter(): HTMLDivElement {
    const footer = getTargetDocument().createElement('div');
    footer.style.cssText = `
      padding: ${theme.spacing.l};
      border-top: 1px solid ${theme.colors.modal.divider};
      display: flex;
      justify-content: flex-end;
      gap: ${theme.spacing.m};
      flex-shrink: 0;
    `;
    
    // Cancel button
    const cancelButton = getTargetDocument().createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      padding: ${theme.spacing.s} ${theme.spacing.l};
      background: ${theme.colors.modal.secondary};
      border: 1px solid ${theme.colors.modal.secondaryBorder};
      border-radius: ${theme.borderRadius.small};
      color: ${theme.colors.modal.secondaryText};
      font-size: ${theme.typography.fontSize.body};
      font-weight: ${theme.typography.fontWeight.semibold};
      font-family: ${theme.typography.fontFamily};
      cursor: pointer;
      transition: all 0.2s;
    `;
    cancelButton.onmouseover = () => cancelButton.style.background = theme.colors.modal.secondaryHover;
    cancelButton.onmouseout = () => cancelButton.style.background = theme.colors.modal.secondary;
    cancelButton.onclick = () => this.cancel();
    
    footer.appendChild(cancelButton);
    
    // Clear button (if multi-select and allowClear)
    if (this.options.multiSelect && this.options.allowClear) {
      const clearButton = getTargetDocument().createElement('button');
      clearButton.textContent = 'Clear Selection';
      clearButton.style.cssText = `
        padding: ${theme.spacing.s} ${theme.spacing.l};
        background: ${theme.colors.modal.secondary};
        border: 1px solid ${theme.colors.modal.secondaryBorder};
        border-radius: ${theme.borderRadius.small};
        color: ${theme.colors.modal.secondaryText};
        font-size: ${theme.typography.fontSize.body};
        font-weight: ${theme.typography.fontWeight.semibold};
        font-family: ${theme.typography.fontFamily};
        cursor: pointer;
        transition: all 0.2s;
      `;
      clearButton.onmouseover = () => clearButton.style.background = theme.colors.modal.secondaryHover;
      clearButton.onmouseout = () => clearButton.style.background = theme.colors.modal.secondary;
      clearButton.onclick = () => this.clearSelection();
      
      footer.appendChild(clearButton);
    }
    
    // Select button
    const selectButton = getTargetDocument().createElement('button');
    selectButton.textContent = 'Select';
    selectButton.style.cssText = `
      padding: ${theme.spacing.s} ${theme.spacing.l};
      background: ${theme.colors.modal.primary};
      border: none;
      border-radius: ${theme.borderRadius.small};
      color: ${theme.colors.modal.primaryText};
      font-size: ${theme.typography.fontSize.body};
      font-weight: ${theme.typography.fontWeight.semibold};
      font-family: ${theme.typography.fontFamily};
      cursor: pointer;
      transition: all 0.2s;
    `;
    selectButton.onmouseover = () => selectButton.style.background = theme.colors.modal.primaryHover;
    selectButton.onmouseout = () => selectButton.style.background = theme.colors.modal.primary;
    selectButton.onclick = () => this.select();
    
    footer.appendChild(selectButton);
    
    return footer;
  }
  
  private async loadColumnLabels(): Promise<void> {
    const metadata = await getEntityMetadata(this.options.entity);
    
    // Use provided labels first
    if (this.options.columnLabels) {
      Object.entries(this.options.columnLabels).forEach(([key, value]) => {
        this.columnLabels.set(key, value);
      });
    }
    
    // Fill in missing labels from metadata or use logical name
    this.options.columns.forEach(column => {
      if (!this.columnLabels.has(column)) {
        const attr = metadata?.Attributes?.find(a => a.LogicalName === column);
        const label = attr?.DisplayName?.UserLocalizedLabel?.Label || column;
        this.columnLabels.set(column, label);
      }
    });
  }
  
  private handleScroll(): void {
    if (!this.tableContainer || this.isLoadingMore || !this.hasMoreRecords) return;
    
    const { scrollTop, scrollHeight, clientHeight } = this.tableContainer;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    // Load more when scrolled 80% down
    if (scrollPercentage > 0.8) {
      this.loadMoreRecords();
    }
  }
  
  private async loadMoreRecords(): Promise<void> {
    if (this.isLoadingMore || !this.hasMoreRecords) return;
    
    this.isLoadingMore = true;
    this.currentPage++;
    
    try {
      const orderBy = this.sortColumn 
        ? [{ attribute: this.sortColumn, descending: this.sortDescending }]
        : this.options.orderBy;
      
      const searchTerm = this.searchInput?.value.trim() || '';
      const allSearchFields = [
        ...this.options.searchFields,
        ...this.options.additionalSearchFields
      ];
      
      const result = await fetchRecords(
        this.options.entity,
        this.options.columns,
        this.options.filters,
        orderBy,
        this.currentPage,
        this.options.pageSize,
        searchTerm,
        allSearchFields
      );
      
      if (result.entities.length === 0) {
        this.hasMoreRecords = false;
      } else {
        this.allLoadedRecords.push(...result.entities);
        this.records = this.allLoadedRecords;
        this.renderTableRows();
      }
    } catch (error) {
      console.error('Failed to load more records:', error);
    } finally {
      this.isLoadingMore = false;
    }
  }
  
  private async loadData(): Promise<void> {
    try {
      // Reset for fresh load
      this.currentPage = 1;
      this.allLoadedRecords = [];
      this.hasMoreRecords = true;
      
      const orderBy = this.sortColumn 
        ? [{ attribute: this.sortColumn, descending: this.sortDescending }]
        : this.options.orderBy;
      
      const searchTerm = this.searchInput?.value.trim() || '';
      const allSearchFields = [
        ...this.options.searchFields,
        ...this.options.additionalSearchFields
      ];
      
      const result = await fetchRecords(
        this.options.entity,
        this.options.columns,
        this.options.filters,
        orderBy,
        this.currentPage,
        this.options.pageSize,
        searchTerm,
        allSearchFields
      );
      
      this.allLoadedRecords = result.entities;
      this.records = this.allLoadedRecords;
      this.totalRecords = result.totalCount;
      
      this.renderTableRows();
      this.updatePagination();
    } catch (error) {
      console.error('Failed to load lookup data:', error);
    }
  }
  
  private renderTableRows(): void {
    if (!this.tableBody) return;
    
    this.tableBody.innerHTML = '';
    
    const metadata = metadataCache.get(this.options.entity);
    const primaryIdAttr = metadata?.PrimaryIdAttribute || `${this.options.entity}id`;
    
    this.records.forEach((record, index) => {
      const row = getTargetDocument().createElement('tr');
      row.style.cssText = `
        cursor: pointer;
        transition: background 0.2s;
      `;
      
      const recordId = record[primaryIdAttr];
      const isSelected = this.selectedRecords.has(recordId);
      
      if (isSelected) {
        row.style.background = theme.colors.neutralLighter;
      }
      
      row.onmouseover = () => {
        if (!isSelected) {
          row.style.background = theme.colors.neutralLighterAlt;
        }
      };
      
      row.onmouseout = () => {
        if (!isSelected) {
          row.style.background = index % 2 === 0 ? 'white' : theme.colors.neutralLighterAlt;
        }
      };
      
      row.onclick = (e) => {
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
          this.toggleSelection(recordId);
        }
      };
      
      // Checkbox column
      if (this.options.multiSelect) {
        const td = getTargetDocument().createElement('td');
        td.style.cssText = `
          padding: ${theme.spacing.s};
          border-bottom: 1px solid ${theme.colors.modal.divider};
        `;
        
        const checkbox = getTargetDocument().createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isSelected;
        checkbox.onchange = () => this.toggleSelection(recordId);
        
        td.appendChild(checkbox);
        row.appendChild(td);
      }
      
      // Data columns
      this.options.columns.forEach(column => {
        const td = getTargetDocument().createElement('td');
        td.style.cssText = `
          padding: ${theme.spacing.s};
          border-bottom: 1px solid ${theme.colors.modal.divider};
          color: ${theme.colors.modal.text};
        `;
        
        const value = record[column];
        td.textContent = formatValue(value);
        
        row.appendChild(td);
      });
      
      this.tableBody!.appendChild(row);
    });
    
    // Empty state
    if (this.records.length === 0) {
      const row = getTargetDocument().createElement('tr');
      const td = getTargetDocument().createElement('td');
      td.colSpan = this.options.columns.length + (this.options.multiSelect ? 1 : 0);
      td.style.cssText = `
        padding: ${theme.spacing.xl};
        text-align: center;
        color: ${theme.colors.modal.textSecondary};
      `;
      td.textContent = 'No records found';
      row.appendChild(td);
      this.tableBody!.appendChild(row);
    }
  }
  
  private toggleSelection(recordId: string): void {
    if (this.options.multiSelect) {
      if (this.selectedRecords.has(recordId)) {
        this.selectedRecords.delete(recordId);
      } else {
        this.selectedRecords.add(recordId);
      }
    } else {
      this.selectedRecords.clear();
      this.selectedRecords.add(recordId);
    }
    
    this.renderTableRows();
  }
  
  private clearSelection(): void {
    this.selectedRecords.clear();
    this.options.onSelect([]);
    this.close();
  }
  
  private handleSearch(): void {
    clearTimeout(this.searchDebounceTimer);
    
    this.searchDebounceTimer = window.setTimeout(() => {
      this.currentPage = 1;
      this.loadData();
    }, 300);
  }
  
  private handleSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDescending = !this.sortDescending;
    } else {
      this.sortColumn = column;
      this.sortDescending = false;
    }
    
    this.loadData();
  }
  
  private updatePagination(): void {
    if (!this.options.showPagination) return;
    
    if (this.paginationInfo) {
      const loadedCount = this.allLoadedRecords.length;
      if (this.hasMoreRecords) {
        this.paginationInfo.textContent = `Showing ${loadedCount} of ${this.totalRecords} records (scroll for more)`;
      } else {
        this.paginationInfo.textContent = `Showing all ${loadedCount} records`;
      }
    }
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
    this.close();
  }
  
  private cancel(): void {
    this.options.onCancel();
    this.close();
  }
  
  private close(): void {
    // Animate out
    this.modal.style.animation = 'fadeOutScale 0.2s ease-in';
    this.overlay.style.animation = 'fadeOut 0.2s ease-in';
    
    setTimeout(() => {
      if (this.container.parentElement) {
        this.container.parentElement.removeChild(this.container);
      }
      if (this.overlay.parentElement) {
        this.overlay.parentElement.removeChild(this.overlay);
      }
      
      Lookup.activeInstance = null;
    }, 200);
  }
  
  private show(): void {
    const doc = getTargetDocument();
    doc.body.appendChild(this.overlay);
    doc.body.appendChild(this.container);
  }
  
  static open(options: LookupOptions): void {
    // Close any existing lookup
    if (Lookup.activeInstance) {
      Lookup.activeInstance.close();
    }
    
    const lookup = new Lookup(options);
    Lookup.activeInstance = lookup;
    lookup.show();
  }
}
