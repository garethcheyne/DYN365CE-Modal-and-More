/**
 * Modal Builder Types
 *
 * Field types match the supported types in Modal.types.ts FieldConfig.type
 */

// Core field types supported by Modal component
export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'textarea'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'switch'
  | 'lookup'
  | 'addressLookup'
  | 'table'
  | 'file'
  | 'range'
  | 'group'
  | 'tabs'
  | 'custom';

// Field categories for palette organization
export type FieldCategory = 'text' | 'choice' | 'd365' | 'layout';

export interface FieldTemplate {
  type: FieldType;
  category: FieldCategory;
  label: string;
  description: string;
  defaultConfig: Partial<BuilderFieldConfig>;
  iconOverride?: string;  // Optional icon key to override type-based icon
}

export interface VisibilityCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'truthy' | 'falsy';
  value?: string | number | boolean;
}

export interface AddressLookupConfig {
  provider?: 'google' | 'azure';
  placeholder?: string;
  countryRestriction?: string;  // ISO country codes (e.g., 'nz', 'au')
  // Field IDs to auto-populate
  streetField?: string;
  cityField?: string;
  stateField?: string;
  postalCodeField?: string;
  countryField?: string;
}

export interface BuilderFieldConfig {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  tooltip?: string;

  // Type-specific: Select/Dropdown
  options?: string[];

  // Type-specific: Textarea
  rows?: number;

  // Type-specific: Lookup
  entityName?: string;
  lookupColumns?: string[];

  // Type-specific: Address Lookup
  addressLookup?: AddressLookupConfig;

  // Type-specific: Table
  selectionMode?: 'none' | 'single' | 'multiple';

  // Conditional visibility
  visibleWhen?: VisibilityCondition;
  requiredWhen?: VisibilityCondition;

  // Group/Layout fields
  fields?: BuilderFieldConfig[];
  border?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  asTabs?: boolean;  // Render group children as tabs

  // Custom content
  html?: string;
}

export interface BuilderButtonConfig {
  id: string;
  label: string;
  setFocus?: boolean;
  isDestructive?: boolean;
  preventClose?: boolean;
  requiresValidation?: boolean;
}

export interface WizardStepConfig {
  id: string;
  label: string;
  message?: string;
  content?: string;
  fields: BuilderFieldConfig[];
}

export interface ModalConfig {
  title: string;
  message?: string;
  content?: string;
  size: 'small' | 'medium' | 'large' | 'fullscreen' | 'custom';
  customWidth?: number;
  customHeight?: number;
  draggable?: boolean;
  allowDismiss?: boolean;
  allowEscapeClose?: boolean;
  buttonAlignment?: 'left' | 'center' | 'right' | 'space-between';
  
  // Wizard mode
  isWizard?: boolean;
  steps?: WizardStepConfig[];
  
  // Regular fields (non-wizard)
  fields: BuilderFieldConfig[];
  buttons: BuilderButtonConfig[];
}

export interface BuilderState {
  modalConfig: ModalConfig;
  selectedFieldId: string | null;
  selectedStepId: string | null;
  isDragging: boolean;
}

// Default configurations
export const DEFAULT_MODAL_CONFIG: ModalConfig = {
  title: 'My Modal',
  message: '',
  size: 'medium',
  draggable: true,
  allowDismiss: false,
  allowEscapeClose: true,
  buttonAlignment: 'right',
  isWizard: false,
  steps: [],
  fields: [],
  buttons: [
    { id: 'cancel', label: 'Cancel', setFocus: false },
    { id: 'submit', label: 'Submit', setFocus: true, requiresValidation: true },
  ],
};

export const FIELD_TEMPLATES: FieldTemplate[] = [
  // Text Input fields - for entering text data
  {
    type: 'text',
    category: 'text',
    label: 'Text',
    description: 'Single-line text input',
    defaultConfig: { placeholder: 'Enter text...' },
  },
  {
    type: 'email',
    category: 'text',
    label: 'Email',
    description: 'Email input with validation',
    defaultConfig: { placeholder: 'user@example.com' },
  },
  {
    type: 'number',
    category: 'text',
    label: 'Number',
    description: 'Numeric input',
    defaultConfig: {},
  },
  {
    type: 'textarea',
    category: 'text',
    label: 'Text Area',
    description: 'Multi-line text input',
    defaultConfig: { rows: 4, placeholder: 'Enter description...' },
  },

  // Choice fields - for selecting from options
  {
    type: 'select',
    category: 'choice',
    label: 'Dropdown',
    description: 'Dropdown selection list',
    defaultConfig: { options: ['Option 1', 'Option 2', 'Option 3'] },
  },
  {
    type: 'checkbox',
    category: 'choice',
    label: 'Checkbox',
    description: 'Yes/No checkbox (D365 style)',
    defaultConfig: {},
  },
  {
    type: 'switch',
    category: 'choice',
    label: 'Switch',
    description: 'Toggle switch control',
    defaultConfig: {},
  },
  {
    type: 'date',
    category: 'choice',
    label: 'Date Picker',
    description: 'Calendar date picker',
    defaultConfig: {},
  },
  {
    type: 'range',
    category: 'choice',
    label: 'Slider',
    description: 'Range slider input',
    defaultConfig: {},
  },

  // D365 Integration fields - special D365 components
  {
    type: 'lookup',
    category: 'd365',
    label: 'Lookup',
    description: 'Entity record lookup',
    defaultConfig: { entityName: 'account', lookupColumns: ['name'] },
  },
  {
    type: 'addressLookup',
    category: 'd365',
    label: 'Address',
    description: 'Address autocomplete (Google/Azure)',
    defaultConfig: {},
  },
  {
    type: 'table',
    category: 'd365',
    label: 'Table',
    description: 'Data grid with row selection',
    defaultConfig: {},
  },
  {
    type: 'file',
    category: 'd365',
    label: 'File Upload',
    description: 'Drag & drop file upload',
    defaultConfig: {},
  },

  // Layout fields - for structuring forms
  {
    type: 'group',
    category: 'layout',
    label: 'Field Group',
    description: 'Container for related fields',
    defaultConfig: { border: true, fields: [] },
  },
  {
    type: 'tabs',
    category: 'layout',
    label: 'Tabs',
    description: 'Tabbed container for fields',
    defaultConfig: { asTabs: true, fields: [] },
  },
  {
    type: 'custom',
    category: 'layout',
    label: 'Custom HTML',
    description: 'Raw HTML content block',
    defaultConfig: { html: '<div>Custom content</div>' },
  },
];
