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
  tableColumns: TableColumn[];                      // Columns to display (same shape as Modal table fields)
  filters?: string;                                 // OData filter
  orderBy?: { attribute: string; descending: boolean }[];
  searchFields?: string[];                          // Fields to search (defaults to tableColumns ids)
  additionalSearchFields?: string[];                // Extra non-displayed search fields
  defaultSearchTerm?: string;                       // Pre-populate search
  preFilters?: PreFilter[];                         // Dropdown/lookup filters between search and table
  multiSelect?: boolean;                            // Allow multi-selection (default: false)
  pageSize?: number;                                // Records per page (default: 50)
  showPagination?: boolean;                         // Show pagination (default: true)
  allowClear?: boolean;                             // Show clear button (default: true)
  title?: string;                                   // Modal title
  message?: string;                                 // Plain text displayed above the search box
  content?: string;                                 // HTML displayed above the search box
  size?: { width?: number | string; height?: number | string };  // Accepts px, %, vw, vh
  width?: number | string;                          // Shorthand for size.width
  height?: number | string;                         // Shorthand for size.height
  onSelect?: (records: LookupResult[]) => void;     // Selection callback
  onCancel?: () => void;                            // Cancel callback
}
```

### ColumnDisplayType — Removed

`ColumnDisplayType` has been replaced by the `format` property on `TableColumn`.
See the `TableColumn` section and `TableColumnFormat` type below for the full list
of format values.

### Column Auto-Detection

Columns without an explicit `format`, `width`, `minWidth`, or `align` get those
properties auto-detected from D365 entity metadata. For example, a `Money`
attribute becomes `format: 'currency'` with right-alignment, a `Boolean`
attribute becomes `format: 'boolean'`, and so on.

You only need to set `format` explicitly when:

- The metadata is wrong or missing (calculated columns, virtual fields)
- You want a `Decimal` field rendered as `currency` or `percent`
- You want a Boolean shown as `boolean-check` instead of the default `boolean`

**Example:**

```javascript
new uiLib.Lookup({
  entity: 'product',
  tableColumns: [
    { id: 'name',                header: 'Product Name', elastic: true },
    { id: 'hnc_fx_basecostex',  header: 'Base Cost Ex',  format: 'currency' },
    { id: 'hnc_localcorerange', header: 'Core Range',    format: 'percent' },
    { id: 'hnc_corestocked',    header: 'Core Stocked',  format: 'boolean-check' }
  ],
  onSelect: (records) => console.debug(records)
});
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
  tableColumns: [
    { id: 'name',          header: 'Account Name', elastic: true, sortable: true },
    { id: 'telephone1',    header: 'Phone',        width: '160px' },
    { id: 'emailaddress1', header: 'Email',        width: '220px' }
  ],
  filters: 'statecode eq 0',
  multiSelect: true,
  onSelect: (records) => console.debug(records)
}).show();

// With preFilters
new uiLib.Lookup({
  entity: 'opportunity',
  tableColumns: [
    { id: 'name',           header: 'Opportunity', elastic: true, sortable: true },
    { id: 'estimatedvalue', header: 'Est. Value',  format: 'currency', width: '140px' }
  ],
  preFilters: [
    { type: 'optionset', attribute: 'statecode', label: 'Status' },
    { type: 'lookup', attribute: 'parentaccountid', label: 'Account',
      entityName: 'account', lookupColumns: ['name'] }
  ],
  onSelect: (records) => console.debug(records)
}).show();

// With message, content, and custom size
new uiLib.Lookup({
  entity: 'contact',
  title: 'Select Contact',
  message: 'Choose a contact to associate with this case.',
  size: { width: '80vw', height: '70vh' },
  tableColumns: [
    { id: 'fullname',      header: 'Full Name',  elastic: true, sortable: true },
    { id: 'emailaddress1', header: 'Email',       width: '220px' },
    { id: 'jobtitle',      header: 'Job Title',   width: '180px' }
  ],
  onSelect: (records) => console.debug(records)
}).show();
```

---

## QueryBuilder (`uiLib.Modal.openQueryBuilder`)

Visual FetchXML / OData filter builder, opened as a modal from vanilla JS. The exposed `uiLib.QueryBuilder` is the underlying React component — use `uiLib.Modal.openQueryBuilder()` for the callable modal API.

### Usage

```javascript
const result = await uiLib.Modal.openQueryBuilder({
  title: 'Filter Accounts',
  entityName: 'account',
  entitySetName: 'accounts',           // Optional — fetched from Xrm metadata if omitted
  fields: [
    { id: 'name',      label: 'Name',       dataType: 'string' },
    { id: 'revenue',   label: 'Revenue',    dataType: 'number' },
    { id: 'createdon', label: 'Created On', dataType: 'datetime' },
    { id: 'statecode', label: 'Status',     dataType: 'optionset',
      options: [{ label: 'Active', value: 0 }, { label: 'Inactive', value: 1 }] }
  ],
  showODataPreview: true,
  showFetchXmlPreview: true,
  // Lookup field search (async)
  onLookupSearch: async (fieldId, searchText) => {
    return [{ key: 'guid-1', text: 'Contoso', secondaryText: 'Account' }];
  }
});

if (result.opened && result.reason === 'applied' && result.result) {
  console.debug(result.result.fetchXml);
  console.debug(result.result.odataFilter);
}
```

### QueryBuilderOpenResult

```typescript
interface QueryBuilderOpenResult {
  opened: boolean;
  reason: 'applied' | 'cancelled' | 'closed' | 'error';
  elapsedMs: number;
  result?: QueryBuilderApplyResult;   // Present when reason === 'applied'
  error?: string;                     // Present when reason === 'error'
}
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

### Key options

| Option | Type | Description |
|--------|------|-------------|
| `entityName` | `string` (required) | Logical name of the entity |
| `fields` | `QueryBuilderField[]` | Filterable fields (auto-detected if omitted) |
| `initialFetchXml` | `string` | Pre-populate from existing FetchXML |
| `initialState` | `QueryBuilderState` | Pre-populate from state object |
| `allowGroups` | `boolean` | Allow AND/OR condition groups |
| `allowRelatedEntity` | `boolean` | Allow filtering on related entities |
| `onLookupSearch` | `(fieldId, text) => Promise<QueryBuilderLookupOption[]>` | Async search for lookup field values |
| `onStateChange` | `(state) => void` | Called on every state change |

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

Used by both Modal `type: 'table'` fields and `uiLib.Lookup` via `tableColumns`.

```typescript
interface TableColumn {
  id: string;                      // Column identifier (matches data key)
  header: string;                  // Display header text
  visible?: boolean;               // Show/hide column (default: true)
  sortable?: boolean;              // Allow sorting (default: false)
  width?: string;                  // Fixed width ('120px', '20%')
  minWidth?: string;               // Minimum width, allows stretch
  elastic?: boolean;               // Absorb all remaining table width (only one per table)
  align?: 'left' | 'center' | 'right';
  format?: TableColumnFormat;      // Display format (see below)
}
```

Columns are resizable by dragging column borders at runtime.

### TableColumnFormat

```typescript
type TableColumnFormat =
  | 'currency'        // $1,234.56 — thousand separator, green >= 0, red < 0, right-aligned
  | 'percent'         // 25.00% — auto-detects 0.25 → 25.00% vs 25 → 25.00%; right-aligned
  | 'number'          // locale-formatted with thousand separator, right-aligned
  | 'decimal'         // 2-decimal locale-formatted number, right-aligned
  | 'integer'         // rounded locale-formatted integer, right-aligned
  | 'date'            // date only (MM/DD/YYYY, accepts Date objects or ISO strings)
  | 'datetime'        // date + time
  | 'boolean'         // disabled Fluent Switch (default for Boolean attributes)
  | 'boolean-check'   // green check icon when true, em-dash when false
  | 'badge'           // pill/badge wrapper around the text
  | 'text';           // raw string, skips D365 FormattedValue annotation
```

**Format behaviors:**

- `currency` → `$1,234.56` (USD, 2 decimals, green/red coloring)
- `number` → `1,234` (thousands separator)
- `decimal` → `1,234.56` (2-decimal locale formatting)
- `integer` → `1,235` (rounded, no decimals)
- `percent` → `12.34%` (auto-detects fraction vs whole-number input)
- `date` → `MM/DD/YYYY` (accepts Date objects or ISO strings)
- `datetime` → `MM/DD/YYYY HH:MM AM/PM`
- `boolean` → disabled Fluent Switch toggle
- `boolean-check` → green check icon when true, em-dash when false
- `badge` → colored pill/badge wrapper
- `text` → raw string output, bypasses D365 FormattedValue annotation
