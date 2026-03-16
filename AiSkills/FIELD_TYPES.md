# Field Types Reference

Every field type supported by `uiLib.Modal`, with full configuration, examples, and the value shape returned by `getFieldValue()`.

---

## Common Properties (All Field Types)

```typescript
{
  id: string;                         // Required — unique identifier
  label?: string;                     // Display label
  type?: string;                      // Field type (see sections below)
  value?: any;                        // Initial value
  placeholder?: string;               // Hint text
  tooltip?: string;                   // Tooltip on hover
  disabled?: boolean;                 // Disable field (default: false)
  readOnly?: boolean;                 // Read-only mode (default: false)
  required?: boolean;                 // Required validation (default: false)
  labelPosition?: 'left' | 'top';    // Label placement
  orientation?: 'horizontal' | 'vertical';  // Field layout
  visibleWhen?: VisibilityCondition;  // Show/hide based on another field
  requiredWhen?: RequiredCondition;   // Conditionally required
  onChange?: (value: any) => void;    // Called when value changes
  validation?: ValidationConfig;      // Custom validation rules
  extraAttributes?: Record<string, string | number>;  // Pass-through HTML attributes
}
```

---

## Text Input (`type: 'text'`)

Standard single-line text input.

```javascript
{ id: 'name', type: 'text', label: 'Full Name', required: true, placeholder: 'Enter name...' }
```

**Value type:** `string`

---

## Email (`type: 'email'`)

Email input with browser-level validation hint.

```javascript
{ id: 'email', type: 'email', label: 'Email', placeholder: 'user@example.com', required: true }
```

**Value type:** `string`

---

## Telephone (`type: 'tel'`)

Phone number input. Shows numeric keyboard on mobile/touch devices.

```javascript
{ id: 'phone', type: 'tel', label: 'Phone', placeholder: '+1 (555) 123-4567' }
```

**Value type:** `string`

---

## Password (`type: 'password'`)

Masked character input.

```javascript
{ id: 'password', type: 'password', label: 'Password', required: true }
```

**Value type:** `string`

---

## URL (`type: 'url'`)

URL input with browser-level validation hint.

```javascript
{ id: 'website', type: 'url', label: 'Website', placeholder: 'https://example.com' }
```

**Value type:** `string`

---

## Search (`type: 'search'`)

Search input with built-in clear button.

```javascript
{ id: 'search', type: 'search', label: 'Search', placeholder: 'Search records...' }
```

**Value type:** `string`

---

## Number (`type: 'number'`)

Numeric input with increment/decrement buttons.

```javascript
{ id: 'quantity', type: 'number', label: 'Quantity', value: 1,
  extraAttributes: { min: 1, max: 100, step: 1 } }
```

**Value type:** `number`

---

## Textarea (`type: 'textarea'`)

Multi-line text input.

```javascript
{ id: 'notes', type: 'textarea', label: 'Notes', rows: 5, placeholder: 'Enter details...' }
```

**Value type:** `string`  
**Extra properties:** `rows` (number of visible text lines)

---

## Date (`type: 'date'`)

Fluent UI DatePicker.

```javascript
{ id: 'startDate', type: 'date', label: 'Start Date', value: new Date() }
```

**Value type:** `Date | null`

---

## Select / Dropdown (`type: 'select'`)

Dropdown selector with optional badge display mode.

### Simple string options

```javascript
{ id: 'status', type: 'select', label: 'Status',
  options: ['Draft', 'Active', 'Inactive'] }
```

### Label/value object options

```javascript
{ id: 'priority', type: 'select', label: 'Priority',
  options: [
    { label: 'High', value: '1' },
    { label: 'Medium', value: '2' },
    { label: 'Low', value: '3' }
  ] }
```

### Badge display mode (pill-style buttons)

```javascript
{ id: 'priority', type: 'select', label: 'Priority',
  displayMode: 'badges',
  options: ['Low', 'Medium', 'High', 'Critical'],
  value: 'Medium' }
```

### D365 Option Set auto-fetch

```javascript
{ id: 'industrycode', type: 'select',
  optionSet: {
    entityName: 'account',
    attributeName: 'industrycode',
    includeNull: true,    // Include blank option
    sortByLabel: true     // Sort alphabetically
  } }
```

**Value type:** `string`  
**Display modes:** `'dropdown'` (default), `'badges'`  
**Extra properties:** `options`, `displayMode`, `optionSet`, `multiSelect`

---

## Checkbox (`type: 'checkbox'`)

Boolean checkbox in D365 native style.

```javascript
{ id: 'acceptTerms', type: 'checkbox', label: 'I accept the terms', value: false }
```

**Value type:** `boolean`

---

## Switch (`type: 'switch'`)

Modern toggle switch.

```javascript
{ id: 'active', type: 'switch', label: 'Active', value: true }
```

**Value type:** `boolean`

---

## Range / Slider (`type: 'range'`)

Horizontal slider control.

```javascript
{ id: 'rating', type: 'range', label: 'Rating', value: 50,
  showValue: true,    // Display current value next to slider
  extraAttributes: { min: 0, max: 100, step: 5 } }
```

**Value type:** `number`  
**Extra properties:** `showValue`, `extraAttributes: { min, max, step }`

---

## Lookup — Inline Dropdown (`type: 'lookup'`)

D365-style record search and select dropdown.

### Basic lookup

```javascript
{ id: 'accountLookup', type: 'lookup', label: 'Account',
  entityName: 'account',
  lookupColumns: ['name', 'accountnumber'],
  filters: 'statecode eq 0',
  placeholder: 'Search accounts...',
  required: true }
```

### Lookup with labeled columns

```javascript
{ id: 'addressLookup', type: 'lookup', label: 'Address',
  entityName: 'customeraddress',
  lookupColumns: [
    { attribute: 'line1', label: 'Address' },
    { attribute: 'city', label: 'City' },
    { attribute: 'postalcode', label: 'Postal Code' }
  ],
  placeholder: 'Search addresses...' }
```

### Pre-fill from D365 form field

```javascript
// D365 lookup values are natively supported
const ownerLookup = formContext.getAttribute('ownerid')?.getValue();

{ id: 'salesperson', type: 'lookup',
  entityName: 'systemuser',
  lookupColumns: ['fullname', 'internalemailaddress'],
  value: ownerLookup }  // Accepts D365 array format directly

// Also works with setFieldValue at runtime
modal.setFieldValue('salesperson', formContext.getAttribute('ownerid')?.getValue());
```

**Value type:** `{ id: string, name: string, subtitle?: string, entityType: string, record?: any } | null`

**Extra properties:**
- `entityName` — entity logical name
- `entityDisplayName` — display name override (auto-fetched from D365 metadata if omitted)
- `lookupColumns` — `string[]` or `{ attribute, label?, visible? }[]`
- `filters` — OData filter string or FetchXML fragment

**Column display behavior:**
- String format (`['name', 'city']`): shows values only
- Object with label (`[{ attribute: 'name', label: 'Name' }]`): shows "Label: value"
- First column = primary text (bold, 14px)
- Second column = subtitle (gray, 12px)

**Polymorphic lookups (Account OR Contact):**

The inline lookup supports ONE entity at a time. For multi-entity (Customer-type) lookups, use conditional visibility:

```javascript
[
  { id: 'customerType', type: 'select', options: ['Account', 'Contact'] },
  { id: 'accountLookup', type: 'lookup', entityName: 'account',
    visibleWhen: { field: 'customerType', operator: 'equals', value: 'Account' } },
  { id: 'contactLookup', type: 'lookup', entityName: 'contact',
    visibleWhen: { field: 'customerType', operator: 'equals', value: 'Contact' } }
]
```

---

## Table / Data Grid (`type: 'table'`)

Sortable, filterable, selectable data grid.

```javascript
{ id: 'productsTable', type: 'table', label: 'Products',
  tableColumns: [
    { id: 'name', header: 'Product', visible: true, sortable: true, width: '250px' },
    { id: 'price', header: 'Price', visible: true, sortable: true, width: '120px',
      align: 'right', format: 'currency' },
    { id: 'margin', header: 'Margin', visible: true, format: 'percent' }
  ],
  data: [
    { id: 1, name: 'Product A', price: 1299.99, margin: 0.32 },
    { id: 2, name: 'Product B', price: 899.50, margin: 0.45 }
  ],
  selectionMode: 'multiple',
  onRowSelect: (selectedRows) => console.debug(selectedRows),
  isRowSelectable: (row) => row.price > 0 }
```

**Value type:** Use `onRowSelect` callback — not `getFieldValue`.

**Built-in features (no configuration needed):**
- Click column headers to sort
- Right-click header → Filter (Equals, Contains, Greater Than, etc.)
- Right-click header → Group By
- Right-click header → Show/Hide Columns
- Select All checkbox (respects `isRowSelectable`)
- HTML rendering in cell values (auto-detected)

**Dynamic update:**

```javascript
modal.setFieldValue('productsTable', newDataArray);  // Triggers React re-render
```

**Row selectability control:**

```javascript
isRowSelectable: (row) => row.status === 'Active'
// Disabled rows: 50% opacity, grayed checkbox, "not-allowed" cursor
```

**Extra properties:** `tableColumns`, `data`, `selectionMode` (`'none'` | `'single'` | `'multiple'`), `onRowSelect`, `isRowSelectable`

---

## File Upload (`type: 'file'`)

Drag-and-drop file upload with validation.

```javascript
{ id: 'attachments', type: 'file', label: 'Upload Documents',
  required: true,
  fileUpload: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    maxFiles: 10,
    maxSize: 10485760,       // 10MB per file
    multiple: true,
    showFileList: true,
    dragDropText: 'Drag and drop files here',
    browseText: 'or click to browse',
    onFilesSelected: (files) => console.debug(files.map(f => f.name))
  } }
```

**Value type:** `File[]`

```javascript
const files = modal.getFieldValue('attachments');
files.forEach(file => console.debug(file.name, file.size));
```

---

## Address Lookup (`type: 'addressLookup'`)

Address autocomplete with Google Maps or Azure Maps.

```javascript
{ id: 'address', type: 'addressLookup', label: 'Search Address',
  addressLookup: {
    provider: 'google',           // or 'azure'
    apiKey: 'YOUR_API_KEY',
    placeholder: 'Start typing...',
    componentRestrictions: { country: ['nz', 'au'] },
    fields: {                     // Auto-populate related fields
      street: 'streetField',
      city: 'cityField',
      state: 'stateField',
      postalCode: 'zipField',
      country: 'countryField',
      latitude: 'latField',
      longitude: 'lngField'
    },
    onSelect: (address) => console.debug(address.formattedAddress)
  } }
```

**Value type:** `AddressResult`

```typescript
interface AddressResult {
  formattedAddress: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}
```

---

## Custom (`type: 'custom'`)

Custom HTML or render function.

### HTML string

```javascript
{ id: 'info', type: 'custom', html: '<div style="padding: 10px;"><b>Important:</b> Read carefully.</div>' }
```

### Render function

```javascript
{ id: 'chart', type: 'custom', render: () => {
  const el = document.createElement('canvas');
  el.id = 'myChart';
  return el;
} }
```

**Value type:** N/A — custom fields don't have values.

> **WARNING:** Do NOT use `type: 'html'` (doesn't exist) or `content` property (that's for groups/tabs only).

---

## Group (`type: 'group'`)

Visual grouping container for organizing related fields.

### Simple group

```javascript
{ id: 'personalGroup', type: 'group', label: 'Personal Information',
  content: 'Enter your basic details below.',   // Optional description
  fields: [
    { id: 'firstName', type: 'text', label: 'First Name', required: true },
    { id: 'lastName', type: 'text', label: 'Last Name', required: true }
  ] }
```

### Bordered group (card-style)

```javascript
{ id: 'addressGroup', type: 'group', label: 'Address', border: true,
  fields: [
    { id: 'street', type: 'text', label: 'Street' },
    { id: 'city', type: 'text', label: 'City' }
  ] }
```

### Collapsible group

```javascript
{ id: 'advancedGroup', type: 'group', label: 'Advanced Options',
  border: true, collapsible: true, defaultCollapsed: true,
  fields: [
    { id: 'notes', type: 'textarea', label: 'Notes', rows: 3 }
  ] }
```

**Value type:** N/A — groups are containers. Access child field values via their own IDs.

**Extra properties:** `border`, `collapsible`, `defaultCollapsed`, `content` (description text), `fields` (nested)

**Groups support `visibleWhen`** to hide/show entire sections based on other field values.

---

## Tabs (`asTabs: true`)

Tabbed view — one tab visible at a time.

```javascript
{ id: 'myTabs', asTabs: true,
  fields: [
    {
      id: 'generalTab', label: 'General',
      content: '<p>HTML description for this tab</p>',   // Optional HTML above fields
      fields: [
        { id: 'name', type: 'text', label: 'Name' }
      ]
    },
    {
      id: 'detailsTab', label: 'Details',
      content: '<div>More HTML content</div>',
      fields: [
        { id: 'notes', type: 'textarea', label: 'Notes' }
      ]
    }
  ]
}
```

> **CRITICAL:** There is NO top-level `tabs` property on Modal. Tabs must be defined inside `fields` with `asTabs: true`.

**Tab content:** Use `content` or `html` property for HTML above the fields. Fields are optional.

---

## onChange Callback Value Types

| Field Type | Callback Value |
|------------|---------------|
| `text`, `email`, `tel`, `password`, `url`, `search` | `string` |
| `number` | `number` |
| `textarea` | `string` |
| `date` | `Date \| null` |
| `select` | `string` |
| `checkbox`, `switch` | `boolean` |
| `lookup` | `{ id, name, subtitle, entityType, record } \| null` |
| `file` | `File[]` |
| `addressLookup` | `AddressResult` |
| `range` / slider | `number` |
| `table` | Use `onRowSelect` callback instead |

---

## When to Use Which Container

| Pattern | Use Case | All Visible? |
|---------|----------|-------------|
| **Field Group** (`type: 'group'`) | Visual sections on one form page | Yes |
| **Tabs** (`asTabs: true`) | Alternative views, user picks one | One at a time |
| **Wizard Steps** (`progress.steps`) | Sequential multi-step process | One at a time |
