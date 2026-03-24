# API Reference

Complete reference for all classes, methods, properties, and return types exposed by `uiLib`.

---

## Global Namespace

The library exposes everything under `window.uiLib` (and `window.err403` for backward compatibility).

### Top-Level Functions

#### `uiLib.init(executionContext?)`

Initialize the library. Call once in D365 form OnLoad.

| Param | Type | Description |
|-------|------|-------------|
| `executionContext` | `any` (optional) | D365 execution context from form event |

**Returns:** `HealthState`

```typescript
interface HealthState {
  loaded: boolean;        // Library initialized successfully
  inWindow: boolean;      // Available as window.uiLib / window.err403
  version: string;        // e.g. "2026.03.02.01"
  timestamp: string;      // ISO timestamp of initialization
  instance?: any;         // Reference to library object
}
```

#### `uiLib.findInstance()`

Find library instance in current or parent windows (iframe support). Checks `uiLib` then `err403` in current → top → parent windows.

**Returns:** Library object or `null`.

---

## Toast (`uiLib.Toast`)

### Static Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `success` | `(options \| title, message?, duration?)` | Green success notification |
| `error` | `(options \| title, message?, duration?)` | Red error notification |
| `warn` | `(options \| title, message?, duration?)` | Yellow warning notification |
| `info` | `(options \| title, message?, duration?)` | Blue info notification |
| `default` | `(options \| title, message?, duration?)` | Neutral notification |

### Toast Options (Object Syntax)

```typescript
interface ToastOptions {
  title: string;       // Required — toast heading
  message?: string;    // Optional body text (default: '')
  duration?: number;   // Auto-dismiss ms (default: 6000, 0 = manual close)
  sound?: boolean;     // Play notification sound (default: false)
}
```

### Toast Instance

All methods return a `ToastInstance`:

```typescript
interface ToastInstance {
  close(): void;  // Programmatically dismiss the toast
}
```

### Usage Patterns

```javascript
// Object syntax (recommended)
uiLib.Toast.success({ title: 'Saved!', message: 'Record updated', duration: 6000, sound: true });

// Shorthand syntax
uiLib.Toast.error('Error', 'Failed to save', 5000);

// Persistent toast (must close manually)
const t = uiLib.Toast.info({ title: 'Processing...', duration: 0 });
// later...
t.close();
```

---

## Modal (`uiLib.Modal`)

### Constructor

```javascript
const modal = new uiLib.Modal(options: ModalOptions);
```

### ModalOptions

```typescript
interface ModalOptions {
  // Identity & content
  id?: string;                          // Unique modal ID
  title: string;                        // Required — modal heading
  message?: string;                     // Plain text below title
  content?: string;                     // HTML content (innerHTML)
  customContent?: HTMLElement;          // DOM element
  icon?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'QUESTION';

  // Sizing
  size?: 'small' | 'medium' | 'large' | 'fullscreen' | { width, height };
  width?: number | string;
  height?: number | string;
  padding?: number;

  // Behavior
  preventClose?: boolean;              // Prevent close via buttons (default: false)
  allowDismiss?: boolean;              // Click backdrop to close (default: false)
  allowEscapeClose?: boolean;          // Escape key closes (default: true)
  draggable?: boolean;                 // Drag by header (default: true)
  buttonAlignment?: 'left' | 'center' | 'right' | 'space-between';

  // Auto-save
  autoSave?: boolean;
  autoSaveKey?: string;

  // Debug
  debug?: boolean;

  // Wizard
  progress?: ProgressConfig;

  // Side panel
  sideCart?: SideCartConfig;

  // Form content
  fields?: FieldConfig[];
  buttons?: ModalButton[];
}
```

### Instance Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `show` | `()` | `Promise<void>` | Display the modal |
| `showAsync` | `()` | `Promise<ModalResponse>` | Show and wait for close |
| `close` | `()` | `void` | Close the modal |
| `getFieldValue` | `(fieldId: string)` | `any` | Get a single field's current value |
| `getFieldValues` | `()` | `Record<string, any>` | Get all field values as `{ id: value }` |
| `setFieldValue` | `(fieldId: string, value: any)` | `void` | Update a field's value programmatically |
| `validateCurrentStep` | `()` | `boolean` | Validate current wizard step |
| `validateAllFields` | `()` | `boolean` | Validate every field |
| `nextStep` | `()` | `void` | Navigate to next wizard step |
| `previousStep` | `()` | `void` | Navigate to previous wizard step |
| `goToStep` | `(stepId: string)` | `void` | Navigate to step by ID |
| `updateProgress` | `(step: number, skipValidation?: boolean)` | `void` | Update progress indicator |
| `getButton` | `(idOrLabelOrIndex)` | `ButtonInstance \| null` | Get button by ID (preferred), label, or 0-based index |
| `setLoading` | `(loading: boolean, message?: string \| LoadingOptions)` | `void` | Show/hide loading overlay |
| `updateSideCart` | `(content: string \| { imageUrl: string })` | `void` | Update side panel content |
| `clearAutoSave` | `()` | `void` | Clear persisted form data |
| `getElement` | `(selector?: string)` | `HTMLElement \| HTMLElement[] \| null` | Access DOM elements |
| `showWebResource` | `(path: string, options?)` | `void` | Embed D365 web resource in modal |

#### Chainable Property Setters

```javascript
modal.title('New Title').message('New msg').width(800).height(600);
```

### Static Convenience Methods

| Method | Signature | Returns | Description |
|--------|-----------|---------|-------------|
| `Modal.alert` | `(title, message, options?)` | `Promise<void>` | Simple alert |
| `Modal.confirm` | `(title, message, options?)` | `Promise<boolean>` | Yes/No dialog |
| `Modal.open` | `(options)` | `Modal` | Create, show, and return instance |

### Loading Overlay

```javascript
// Spinner mode (indeterminate)
modal.setLoading(true, 'Processing...');

// Progress bar mode (determinate)
modal.setLoading(true, { message: 'Importing 3/10...', progress: 30 });

// Hide
modal.setLoading(false);
```

### showAsync Response

```typescript
interface ModalResponse {
  button: ModalButton;           // Which button was clicked
  data: Record<string, any>;     // All field values
}
```

---

## ModalHelpers (`uiLib.ModalHelpers`)

Enhanced alert/confirm/prompt with icon support.

| Method | Signature | Returns |
|--------|-----------|---------|
| `alert` | `(title, message, type?, options?)` | `Promise<void>` |
| `confirm` | `(title, message, type?, options?)` | `Promise<boolean>` |
| `prompt` | `(title, message, type?, options?)` | `Promise<string \| null>` |

**`type` parameter:** `'success'`, `'warning'`, `'error'`, `'info'`, `'default'` — adds an icon to the dialog.

```javascript
await uiLib.ModalHelpers.alert('Saved!', '<b>Record saved</b>', 'success');
const yes = await uiLib.ModalHelpers.confirm('Delete?', 'Are you sure?', 'warning');
const name = await uiLib.ModalHelpers.prompt('Name', 'Enter your name', 'default');
```

---

## Button (`uiLib.Button` / `uiLib.ModalButton`)

`uiLib.Button` is an alias for `uiLib.ModalButton`. Both refer to the same class.

### Constructor (Object Style — Recommended)

```javascript
new uiLib.Button({
  label: 'Save',                    // Required — button text
  callback: () => true,             // Required — return true to close, false to keep open
  setFocus: true,                   // Makes button primary/blue (default: false)
  preventClose: false,              // Keep modal open on click (default: false)
  isDestructive: false,             // Red danger style (default: false)
  requiresValidation: true,         // Auto-disable until all required fields valid (default: false)
  validateAllSteps: false,          // Wizards: false = current step only, true = all steps (default: false)
  id: 'saveBtn'                     // Unique ID — STRONGLY RECOMMENDED
});
```

### Constructor (Positional Style — Backward Compatible)

```javascript
new uiLib.Button(label, callback, setFocus, preventClose, isDestructive, id, requiresValidation, validateAllSteps)
```

### Button Instance Methods (from `modal.getButton()`)

All methods are **chainable** (return `this`):

| Method | Description |
|--------|-------------|
| `setLabel(text)` | Change button text |
| `setDisabled(bool)` | Enable or disable |
| `setVisible(bool)` | Show or hide |
| `enable()` | Shorthand for `setDisabled(false)` |
| `disable()` | Shorthand for `setDisabled(true)` |
| `show()` | Shorthand for `setVisible(true)` |
| `hide()` | Shorthand for `setVisible(false)` |

```javascript
modal.getButton('saveBtn').setLabel('Saving...').disable();
// later...
modal.getButton('saveBtn').setLabel('Save').enable();
```

---

## Lookup (`uiLib.Lookup`)

Full-screen modal lookup for selecting D365 records.

### Constructor

```javascript
new uiLib.Lookup(options: LookupOptions);
```

### LookupOptions

```typescript
interface LookupOptions {
  entity: string;                                   // Entity logical name
  columns: string[];                                // Columns to display in table
  columnLabels?: Record<string, string>;            // Custom column headers
  filters?: string;                                 // OData filter
  orderBy?: { attribute: string; descending: boolean }[];
  searchFields?: string[];                          // Fields to search (defaults to columns)
  additionalSearchFields?: string[];                // Extra non-displayed search fields
  defaultSearchTerm?: string;                       // Pre-populate search
  preFilters?: PreFilter[];                         // Dropdown/lookup filters between search and table
  multiSelect?: boolean;                            // Allow multi-selection (default: false)
  pageSize?: number;                                // Records per page (default: 50)
  showPagination?: boolean;                         // Show pagination (default: true)
  allowClear?: boolean;                             // Show clear button (default: true)
  title?: string;                                   // Modal title
  width?: number;                                   // Modal width
  height?: number;                                  // Modal height
  onSelect?: (records: LookupResult[]) => void;     // Selection callback
  onCancel?: () => void;                            // Cancel callback
}
```

### PreFilter

```typescript
// Option set — auto-populated from D365 entity metadata
interface PreFilterOptionSet {
  type: 'optionset';
  attribute: string;         // Attribute on the main entity (e.g. 'statecode')
  label?: string;            // Display label
  includeAll?: boolean;      // Include blank "All" option (default: true)
  defaultValue?: string;     // Default selection
  options?: { label: string; value: string }[];  // Manual options (skips metadata fetch)
}

// Static dropdown with manual options
interface PreFilterSelect {
  type: 'select';
  attribute: string;
  label?: string;
  options: { label: string; value: string }[];
  includeAll?: boolean;      // default: true
  defaultValue?: string;
}

// Lookup — filter by related record
interface PreFilterLookup {
  type: 'lookup';
  attribute: string;         // e.g. 'parentaccountid'
  label?: string;
  entityName: string;        // Related entity (e.g. 'account')
  entityDisplayName?: string;
  lookupColumns?: string[];  // Columns in the lookup dropdown
  filters?: string;          // OData filter for lookup records
}

type PreFilter = PreFilterOptionSet | PreFilterSelect | PreFilterLookup;
```

### LookupResult

```typescript
interface LookupResult {
  id: string;                          // Record GUID
  name: string;                        // Primary name value
  entityType: string;                  // Entity logical name
  attributes: Record<string, any>;     // All fetched column values
}
```

### Usage

```javascript
new uiLib.Lookup({
  entity: 'account',
  columns: ['name', 'telephone1', 'emailaddress1'],
  columnLabels: { name: 'Account Name', telephone1: 'Phone' },
  filters: 'statecode eq 0',
  multiSelect: true,
  onSelect: (records) => console.debug(records)
}).show();

// With preFilters
new uiLib.Lookup({
  entity: 'opportunity',
  columns: ['name', 'estimatedvalue'],
  preFilters: [
    { type: 'optionset', attribute: 'statecode', label: 'Status' },
    { type: 'lookup', attribute: 'parentaccountid', label: 'Account',
      entityName: 'account', lookupColumns: ['name'] }
  ],
  onSelect: (records) => console.debug(records)
}).show();
```

---

## QueryBuilder (`uiLib.QueryBuilder`)

Visual FetchXML/OData filter builder component.

### Usage

```javascript
uiLib.QueryBuilder.open({
  title: 'Filter Accounts',
  entityName: 'account',
  entitySetName: 'accounts',
  fields: [
    { id: 'name', label: 'Name', dataType: 'string' },
    { id: 'revenue', label: 'Revenue', dataType: 'number' },
    { id: 'createdon', label: 'Created On', dataType: 'datetime' },
    { id: 'statecode', label: 'Status', dataType: 'optionset',
      options: [{ label: 'Active', value: 0 }, { label: 'Inactive', value: 1 }] }
  ],
  onApply: (result) => {
    console.debug(result.fetchXml);
    console.debug(result.odataFilter);
  }
});
```

### QueryBuilderApplyResult

```typescript
interface QueryBuilderApplyResult {
  state: QueryBuilderState;       // Internal state object
  fetchXmlFilter: string;         // <filter> fragment
  fetchXml: string;               // Complete <fetch> XML
  odataFilter: string;            // OData $filter string
  odataQuery?: string;            // Full OData query URL
}
```

---

## Logger (`uiLib.Logger`)

Styled console logging with purple `[ui-Lib]` badge.

### Log Prefix Arrays

| Prefix | Use With | Example |
|--------|----------|---------|
| `uiLib.TRACE` | `console.debug` | `console.debug(...uiLib.TRACE, 'message')` |
| `uiLib.WAR` | `console.warn` | `console.warn(...uiLib.WAR, 'warning')` |
| `uiLib.ERR` | `console.error` | `console.error(...uiLib.ERR, 'error')` |
| `uiLib.UILIB` | `console.debug` | `console.debug(...uiLib.UILIB, 'lib event')` |

Also available via `uiLib.Logger`:

```javascript
const { TRACE, WAR, ERR, UILIB } = uiLib.Logger;
console.debug(...TRACE, 'Debug info');
```

---

## ProgressConfig (Wizard)

```typescript
interface ProgressConfig {
  enabled: boolean;                              // Required: true to enable
  type?: 'bar' | 'steps-left' | 'steps-right' | 'step';
  currentStep?: number;                          // Starting step (1-based)
  totalSteps?: number;
  steps?: StepConfig[];
  allowStepNavigation?: boolean;                 // Click step indicators to navigate
}

interface StepConfig {
  id?: string;              // Step identifier
  label?: string;           // Step indicator label
  name?: string;            // Step name
  description?: string;     // Step description
  message?: string;         // Text below step indicator (changes per step)
  content?: string;         // HTML below step indicator (changes per step)
  width?: number | string;  // Per-step modal width
  height?: number | string; // Per-step modal height
  size?: { width?, height? }; // Object format for size
  completed?: boolean;
  fields?: FieldConfig[];   // Form fields for this step
  validate?: () => boolean; // Custom validation function
}
```

**Step Indicator Colors:**
- **Blue circle (number)** — current step
- **Green circle (✓)** — completed, all required fields filled
- **Red circle (!)** — completed, missing required fields
- **Gray circle (number)** — not yet visited

---

## SideCartConfig

```typescript
interface SideCartConfig {
  enabled: boolean;
  attached?: boolean;           // Attached to modal edge
  position?: 'left' | 'right';
  width?: number;
  content?: string;             // HTML content
  imageUrl?: string;
  backgroundColor?: string;
}
```

---

## ValidationConfig

```typescript
interface ValidationConfig {
  rules?: ValidationRule[];
  showErrors?: boolean;          // Display error messages below field
}

interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;                   // For minLength/maxLength/pattern
  message: string;               // Error message to display
  validate?: (value: any) => boolean;  // For type: 'custom'
}
```

```javascript
{
  id: 'email', type: 'email', label: 'Email',
  validation: {
    rules: [
      { type: 'required', message: 'Email is required' },
      { type: 'email', message: 'Invalid email address' },
      { type: 'maxLength', value: 100, message: 'Max 100 characters' }
    ],
    showErrors: true
  }
}
```

---

## VisibilityCondition / RequiredCondition

Both use the same interface:

```typescript
interface VisibilityCondition {
  field: string;          // ID of the field to watch
  operator?: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'truthy' | 'falsy';
  value?: any;            // Comparison value (not needed for truthy/falsy)
}
```

```javascript
// Show when accountType === 'Business'
visibleWhen: { field: 'accountType', operator: 'equals', value: 'Business' }

// Show when toggle is on
visibleWhen: { field: 'showAdvanced', operator: 'truthy' }

// Required when method is 'Email'
requiredWhen: { field: 'contactMethod', operator: 'equals', value: 'Email' }
```

---

## TableColumn

```typescript
interface TableColumn {
  id: string;                      // Column identifier (matches data key)
  header: string;                  // Display header text
  visible?: boolean;               // Show/hide column (default: true)
  sortable?: boolean;              // Allow sorting (default: false)
  width?: string;                  // Fixed width ('120px', '20%')
  minWidth?: string;               // Minimum width, allows stretch
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'number' | 'percent' | 'date';  // Auto-format values
}
```

**Format behaviors:**
- `currency` → `$1,234.56` (USD, 2 decimals)
- `number` → `1,234` (thousands separator)
- `percent` → `12.34%` (input should be decimal: `0.1234`)
- `date` → `MM/DD/YYYY` (accepts Date objects or ISO strings)
