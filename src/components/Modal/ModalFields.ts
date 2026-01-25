/**
 * Modal Field Helper Classes
 * Provides convenient constructors for modal fields
 */

import type { FieldConfig } from './Modal.types';

/**
 * Input field helper
 */
export class Input implements FieldConfig {
  id: string;
  label?: string;
  type?: string;
  value?: any;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  divider?: boolean;
  extraAttributes?: Record<string, string | number>;
  showValue?: boolean;
  validation?: any;

  constructor(config: FieldConfig) {
    this.id = config.id;
    this.label = config.label;
    this.type = config.type || 'text';
    this.value = config.value;
    this.placeholder = config.placeholder;
    this.disabled = config.disabled;
    this.required = config.required;
    this.divider = config.divider;
    this.extraAttributes = config.extraAttributes;
    this.showValue = config.showValue;
    this.validation = config.validation;
  }
}

/**
 * MultiLine (textarea) field helper
 */
export class MultiLine implements FieldConfig {
  id: string;
  label?: string;
  type: string = 'textarea';
  value?: any;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  divider?: boolean;

  constructor(config: FieldConfig) {
    this.id = config.id;
    this.label = config.label;
    this.value = config.value;
    this.placeholder = config.placeholder;
    this.disabled = config.disabled;
    this.required = config.required;
    this.rows = config.rows || 4;
    this.divider = config.divider;
  }
}

/**
 * OptionSet (dropdown/select) field helper
 */
export class OptionSet implements FieldConfig {
  id: string;
  label?: string;
  type: string = 'select';
  value?: any;
  disabled?: boolean;
  required?: boolean;
  options?: Array<string | { label: string; value: string }>;
  multiSelect?: boolean;
  divider?: boolean;

  constructor(config: FieldConfig) {
    this.id = config.id;
    this.label = config.label;
    this.value = config.value;
    this.disabled = config.disabled;
    this.required = config.required;
    this.options = config.options || [];
    this.multiSelect = config.multiSelect || false;
    this.divider = config.divider;
  }
}

/**
 * DateRange field helper
 */
export class DateRange implements FieldConfig {
  id: string;
  label?: string;
  type: string = 'daterange';
  startDate?: Date;
  endDate?: Date;
  required?: boolean;
  disabled?: boolean;
  divider?: boolean;

  constructor(config: FieldConfig) {
    this.id = config.id;
    this.label = config.label;
    this.startDate = config.startDate;
    this.endDate = config.endDate;
    this.required = config.required;
    this.disabled = config.disabled;
    this.divider = config.divider;
  }
}

/**
 * Lookup field helper
 */
export class Lookup implements FieldConfig {
  id: string;
  label?: string;
  type: string = 'lookup';
  entityTypes?: string[];
  allowMultiSelect?: boolean;
  callback?: (selected: any[]) => void;
  required?: boolean;
  disabled?: boolean;
  divider?: boolean;

  constructor(config: FieldConfig) {
    this.id = config.id;
    this.label = config.label;
    this.entityTypes = config.entityTypes || [];
    this.allowMultiSelect = config.allowMultiSelect || false;
    this.callback = config.callback;
    this.required = config.required;
    this.disabled = config.disabled;
    this.divider = config.divider;
  }
}

/**
 * Custom field helper
 */
export class Custom implements FieldConfig {
  id: string;
  label?: string;
  type: string = 'custom';
  render?: () => HTMLElement;
  html?: string;
  divider?: boolean;

  constructor(config: FieldConfig) {
    this.id = config.id;
    this.label = config.label;
    this.render = config.render;
    this.html = config.html;
    this.divider = config.divider;
  }
}

/**
 * Group field helper (for organizing fields, optionally as tabs)
 */
export class Group implements FieldConfig {
  id: string;
  label?: string;
  type: string = 'group';
  fields?: FieldConfig[];
  asTabs?: boolean;
  divider?: boolean;

  constructor(config: FieldConfig) {
    this.id = config.id;
    this.label = config.label;
    this.fields = config.fields || [];
    this.asTabs = config.asTabs || false;
    this.divider = config.divider;
  }
}

/**
 * Table field helper (for displaying tabular data with sorting and selection)
 */
export class Table implements FieldConfig {
  id: string;
  label?: string;
  type: string = 'table';
  tableColumns?: Array<{ id: string; header: string; visible?: boolean; sortable?: boolean; width?: string }>;
  data?: any[];
  selectionMode?: 'none' | 'single' | 'multiple';
  onRowSelect?: (selectedRows: any[]) => void;
  divider?: boolean;

  constructor(config: FieldConfig) {
    this.id = config.id;
    this.label = config.label;
    this.tableColumns = config.tableColumns || [];
    this.data = config.data || [];
    this.selectionMode = config.selectionMode || 'none';
    this.onRowSelect = config.onRowSelect;
    this.divider = config.divider;
  }
}

/**
 * File upload field helper (for file uploads with drag-and-drop)
 */
export class File implements FieldConfig {
  id: string;
  label?: string;
  type: string = 'file';
  value?: any;
  required?: boolean;
  disabled?: boolean;
  fileUpload?: {
    accept?: string;
    maxFiles?: number;
    maxSize?: number;
    multiple?: boolean;
    showFileList?: boolean;
    onFilesSelected?: (files: globalThis.File[]) => void;
    dragDropText?: string;
    browseText?: string;
  };
  divider?: boolean;

  constructor(config: FieldConfig) {
    this.id = config.id;
    this.label = config.label;
    this.value = config.value;
    this.required = config.required;
    this.disabled = config.disabled;
    this.fileUpload = config.fileUpload || {};
    this.divider = config.divider;
  }
}
