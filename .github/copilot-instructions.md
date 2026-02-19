# AI Agent Guide: UI Library for Dynamics 365

## Overview

This is a professional UI component library for Microsoft Dynamics 365 CE. It provides Toast notifications, Modal dialogs, Lookups, and Tables with native Fluent UI v9 styling through a simple vanilla JavaScript API.

**Namespace:** Available as `window.uiLib` (primary) or `window.err403` (backward compatibility)

## Architecture

- **User-facing API**: Vanilla JavaScript/TypeScript - simple and intuitive
- **Internal implementation**: React 18 + Fluent UI v9 (bundled, invisible to users)
- **Build system**: Vite + TypeScript + Rollup
- **Output**: Single minified bundle (~690KB, ~280KB gzipped) + TypeScript definitions

## Dynamics 365 Integration

### Form Library Setup

The library must be added to D365 forms as a form library:

1. Form Properties → Events → Form Libraries
2. Add `err403_/ui-lib.min.js`
3. Place at top of library list
4. Available to all scripts on the form

### Iframe Architecture

D365 uses multiple iframes. The library handles this automatically:

- **Form library**: Loaded once in top window
- **Form scripts**: Run in child iframes, auto-assigned from parent
- **Web resources**: Custom iframes, also auto-assigned
- **No manual detection needed**: Just check `typeof uiLib !== 'undefined'`

### Common Integration Patterns

**Form OnLoad:**

```javascript
function onFormLoad(executionContext) {
  const health = uiLib.init(executionContext);
  if (!health.loaded) return;

  const formContext = executionContext.getFormContext();
  // Use library with form context
}
```

**Field OnChange:**

```javascript
function onFieldChange(executionContext) {
  const formContext = executionContext.getFormContext();
  const value = formContext.getAttribute("fieldname").getValue();

  uiLib.Toast.info({ message: `Value changed to: ${value}` });
}
```

**Ribbon Commands:**

```javascript
function onRibbonClick() {
  // No executionContext in ribbon
  uiLib.Modal.confirm("Action", "Perform action?").then((confirmed) => {
    if (confirmed) performAction();
  });
}
```

**Web Resource Iframe:**

```javascript
// Custom HTML page embedded in form
if (typeof uiLib !== "undefined") {
  // Auto-assigned from parent window
  uiLib.Toast.success({ message: "Web resource loaded" });
}
```

## Key Components

### 1. Toast Notifications (`uiLib.Toast`)

Simple notification system matching D365's native toast style.

```javascript
// Object syntax (recommended)
uiLib.Toast.success({
  title: "Saved!",
  message: "Record updated",
  duration: 6000,  // milliseconds (default: 6000)
  sound: true,     // play notification sound
});

// Shorthand syntax (title, message, duration)
uiLib.Toast.success("Saved!", "Record updated", 5000);
uiLib.Toast.error("Error", "Failed to save");
uiLib.Toast.warn("Warning", "Check fields");
uiLib.Toast.info("Info", "Processing...");

// Returns instance with close() method
const toast = uiLib.Toast.info({ title: "Processing...", duration: 0 }); // duration: 0 = stays until closed
// ... later
toast.close(); // Programmatically dismiss the toast
```

**Toast Types:** `success`, `error`, `warn`, `info`, `default`

**Toast Options:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | string | required | Toast title |
| `message` | string | `''` | Optional message body |
| `duration` | number | `6000` | Auto-dismiss time in ms (0 = manual close) |
| `sound` | boolean | `false` | Play notification sound |

### 2. Modal Dialogs (`uiLib.Modal`)

Professional modal system with forms, wizards, tabs, and conditional visibility.

**Quick Helpers (for simple dialogs):**

```javascript
// ModalHelpers - with type parameter for icons
await uiLib.ModalHelpers.alert('Title', 'Message');
await uiLib.ModalHelpers.alert('Success!', '<b>Record saved</b>', 'success'); // with HTML and icon
const confirmed = await uiLib.ModalHelpers.confirm('Delete?', 'Are you sure?', 'warning');
const name = await uiLib.ModalHelpers.prompt('Enter Name', 'What is your name?', 'default');

// Static Modal methods - simpler syntax, no type parameter
await uiLib.Modal.alert('Title', 'Message');
const confirmed = await uiLib.Modal.confirm('Delete?', 'Are you sure?');
const modal = uiLib.Modal.open({ title: 'Form', fields: [...] }); // Creates, shows, and returns instance
```

**Difference between ModalHelpers and Modal static methods:**
| Method | `ModalHelpers.alert()` | `Modal.alert()` |
|--------|------------------------|-----------------|
| Icon parameter | Yes (`'success'`, `'warning'`, etc.) | No (uses default) |
| Options override | Yes (4th parameter) | Yes (3rd parameter) |
| Returns | `Promise<void>` | `Promise<void>` |

**Features:**

- Alert, confirm, and complex form dialogs
- Wizard with visual step indicators (circles, checkmarks, connectors)
- Conditional field visibility using `visibleWhen` property
- All field types: text, number, date, switch, slider, textarea, dropdown, table
- Tabs, validation, draggable, dismissible

**Field Configuration Pattern:**

```javascript
{
  id: 'fieldId',              // Required - unique identifier
  label: 'Field Label',       // Display label
  type: 'text',               // Field type
  value: 'initial',           // Initial value
  required: true,             // Validation
  disabled: false,            // State
  placeholder: 'Enter...',    // Hint text
  orientation: 'horizontal',  // Layout (default) or 'vertical'

  // Conditional visibility
  visibleWhen: {
    field: 'otherFieldId',    // Field to watch
    operator: 'equals',       // equals | notEquals | contains | greaterThan | lessThan | truthy | falsy
    value: 'someValue'        // Comparison value
  },

  // Conditional required (NEW!)
  requiredWhen: {
    field: 'otherFieldId',    // Field to watch
    operator: 'truthy',       // Same operators as visibleWhen
    value: 'someValue'        // Optional value (not needed for truthy/falsy)
  },

  // Field change callback
  onChange: (value) => {
    console.debug('Field value changed:', value);
    // Trigger side effects, update other fields, fetch data, etc.
    // Called automatically when field value changes
    //
    // Value types by field type:
    // - text/email/tel/password/url/search: string
    // - number: number
    // - textarea: string
    // - date: Date | null
    // - select: string
    // - checkbox/switch: boolean
    // - lookup: { id, name, subtitle, entityType, record } | null
    // - file: File[]
    // - addressLookup: { formattedAddress, street, city, state, postalCode, country, latitude, longitude }
    // - range/slider: number
    // - table: Use onRowSelect callback instead
    //
    // Return value is ignored
  },

  // D365 Option Set auto-fetch
  optionSet: {
    entityName: 'account',       // D365 entity name
    attributeName: 'industrycode', // Attribute name
    includeNull: true,           // Include blank option
    sortByLabel: true            // Sort alphabetically
  }
}
```

**Available Field Types:**

- `text` - Standard single-line text input
- `email` - Email input with validation hint
- `tel` - Telephone number input (mobile keyboard on touch devices)
- `password` - Password input (masked characters)
- `url` - URL input with validation hint
- `search` - Search input with clear button
- `number` - Number input with increment/decrement
- `textarea` - Multi-line text (use `rows` property)
- `date` - Date picker
- `select` - Dropdown (use `options` array)
  - `options`: Array of strings or objects `[{ label: 'Display', value: 'stored' }]`
  - `displayMode`: `'dropdown'` (default) or `'badges'` (pill-style buttons)
- `lookup` - Inline D365-style dropdown lookup (entityName, lookupColumns, filters)
  - `lookupColumns`: Array of columns to fetch and display
    - String format: ['line1', 'city', 'postalcode'] - shows values only
    - Object format: [{attribute: 'line1', label: 'Address'}, ...] - shows "Label: value"
    - **Label display**: If label provided, displays "Label: value". If label null/empty, shows value only
    - First column = primary text (bold, 14px, label in gray if provided)
    - Second column = subtitle (gray, 12px, label in bold if provided)
    - Additional columns = fetched but not shown in dropdown
  - Note: Use `lookupColumns` for inline lookups, `columns` for Modal Dialog Lookups
- `checkbox` - Boolean checkbox (D365 native style)
- `switch` - Boolean toggle switch (modern style)
- `range` - Slider (use `extraAttributes: { min, max, step }`)
- `table` - Data grid with sortable columns, selection, and filtering
  - Use `tableColumns` property (array of {id, header, visible, sortable, width, align})
  - Use `data` property (array of row objects)
  - Use `selectionMode` property ('none', 'single', 'multiple')
  - Use `onRowSelect` callback for selection changes
- `addressLookup` - Address autocomplete with Google/Azure Maps
- `file` - File upload with drag-and-drop hot zone (use `fileUpload` configuration)
- `custom` - Custom HTML or render function
  - Use `html` property for HTML strings: `{ type: 'custom', html: '<div>...</div>' }`
  - Use `render` property for dynamic content: `{ type: 'custom', render: () => element }`
  - ❌ NOT `content` property - that's for groups/tabs only
  - ❌ NOT `type: 'html'` - no such type exists
- `group` - Field grouping container for organizing related fields
  - `label` - Optional group title
  - `content` - Optional description text below title
  - `border` - Show border with rounded corners (card-style)
  - `collapsible` - Allow group to be collapsed/expanded
  - `defaultCollapsed` - Start collapsed if collapsible is true
  - `fields` - Array of nested FieldConfig objects

**Wizard Pattern:**

```javascript
new uiLib.Modal({
  title: 'Setup Wizard',
  message: 'Parent modal message - appears ABOVE step indicator, stays visible for all steps',
  content: '<div>Parent modal HTML content - appears ABOVE step indicator</div>',
  progress: {
    enabled: true,
    currentStep: 1,
    allowStepNavigation: true,
    steps: [
      {
        id: 'step1',
        label: 'Account Info',
        message: 'Step 1 message - appears BELOW step indicator, changes per step',
        content: '<small>Step 1 HTML content - appears BELOW step indicator</small>',
        fields: [...]
      },
      {
        id: 'step2',
        label: 'Preferences',
        message: 'Step 2 instructions...',
        content: '<small>Step 2 help text...</small>',
        fields: [...]
      },
      {
        id: 'step3',
        label: 'Review',
        message: 'Step 3 review message...',
        fields: [...]
      }
    ]
  },
  buttons: [
    new uiLib.Button('Previous', () => { modal.previousStep(); return false; }),
    new uiLib.Button('Next', () => { modal.nextStep(); return false; }),
    new uiLib.Button('Finish', () => { /* submit */ }, true)
  ]
});
```

**Modal vs Step Message/Content:**

- **Modal Level** (`message` and `content` on Modal):
  - Appears ABOVE the step indicator
  - Stays visible throughout all wizard steps
  - Use for overall instructions that apply to the entire wizard
  - Example: "Complete all 3 steps to create your account"

- **Step Level** (`message` and `content` on each step):
  - Appears BELOW the step indicator
  - Changes as you navigate between steps
  - Use for step-specific instructions or help text
  - Example: "Step 1: Enter your basic information below"

**Visual Layout:**

```
┌────────────────────────────┐
│ Modal Title                │
│ Modal Message (parent)     │ ← Stays visible
│ Modal Content (parent)     │ ← Stays visible
├────────────────────────────┤
│ ● ─── ○ ─── ○             │ ← Step Indicator
├────────────────────────────┤
│ Step Message (per-step)    │ ← Changes per step
│ Step Content (per-step)    │ ← Changes per step
│ [Form Fields]              │
└────────────────────────────┘
```

**Step-Specific Modal Sizing:**

Each wizard step can have its own modal size, allowing forms to expand or contract based on content:

```javascript
progress: {
  enabled: true,
  steps: [
    {
      id: 'step1',
      label: 'Basic Info',
      width: 500,          // Small modal for simple form
      height: 400,
      fields: [...]
    },
    {
      id: 'step2',
      label: 'Details',
      size: { width: 800, height: 600 },  // Object format also supported
      fields: [...]
    },
    {
      id: 'step3',
      label: 'Review',
      width: 900,          // Wider for table display
      height: 700,
      fields: [...]
    }
  ]
}
// Modal automatically resizes when navigating between steps
```

**Wizard Step Indicators:**

- **Blue circle with number** = current step
- **Green circle with checkmark** = completed steps with all required fields filled
- **Red circle with exclamation (!)** = completed steps with missing required fields
- **Gray circle with number** = pending steps (not yet visited)
- **Connector lines** match the step color (blue/green/red/gray)

**Automatic Validation:**

- Steps are validated automatically when fields change
- **Hidden fields are skipped** - fields with `visibleWhen: false` are not validated
- **Conditional requirements are respected** - `requiredWhen` conditions are evaluated dynamically
- Required fields are checked: empty values (null, undefined, '', empty arrays) trigger red indicator
- Step indicators update in real-time as users fill in or clear required fields
- No manual validation code needed - library handles it automatically

**Conditional Visibility Example:**

```javascript
fields: [
  {
    id: "accountType",
    label: "Account Type",
    type: "select",
    options: ["Business", "Individual"],
  },

  // Only show when accountType is 'Business'
  {
    id: "companyName",
    label: "Company Name",
    type: "text",
    visibleWhen: {
      field: "accountType",
      operator: "equals",
      value: "Business",
    },
  },

  // Marketing preferences
  { id: "allowMarketing", label: "Allow Marketing", type: "switch" },
  {
    id: "email",
    label: "Email",
    type: "email",
    visibleWhen: { field: "allowMarketing", operator: "truthy" },
  },
  {
    id: "sms",
    label: "SMS",
    type: "tel",
    visibleWhen: { field: "allowMarketing", operator: "truthy" },
  },
];
```

**Conditional Required Example (NEW!):**

```javascript
fields: [
  {
    id: "preferredContactMethod",
    label: "Contact Method",
    type: "select",
    options: ["Email", "Phone", "Mail"],
    required: true,
  },

  // Email required only if preferred method is Email
  {
    id: "email",
    label: "Email",
    type: "email",
    requiredWhen: {
      field: "preferredContactMethod",
      operator: "equals",
      value: "Email",
    },
  },

  // Phone required only if preferred method is Phone
  {
    id: "phone",
    label: "Phone",
    type: "tel",
    requiredWhen: {
      field: "preferredContactMethod",
      operator: "equals",
      value: "Phone",
    },
  },

  // Address required only if preferred method is Mail
  {
    id: "address",
    label: "Address",
    type: "text",
    requiredWhen: {
      field: "preferredContactMethod",
      operator: "equals",
      value: "Mail",
    },
  },
];
```

**Input Field Variants Example:**

```javascript
fields: [
  // Standard text input
  { id: 'name', label: 'Full Name', type: 'text', required: true },

  // Email with built-in validation
  { id: 'email', label: 'Email', type: 'email', placeholder: 'user@example.com' },

  // Phone number (shows numeric keyboard on mobile)
  { id: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 (555) 123-4567' },

  // Password (masked input)
  { id: 'password', label: 'Password', type: 'password', required: true },

  // URL input
  { id: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },

  // Search input (has clear button)
  { id: 'search', label: 'Search', type: 'search', placeholder: 'Search records...' },

  // Number with min/max constraints
  {
    id: 'quantity',
    label: 'Quantity',
    type: 'number',
    value: 1,
    extraAttributes: { min: 1, max: 100, step: 1 }
  },

  // Range slider
  {
    id: 'rating',
    label: 'Rating',
    type: 'range',
    value: 50,
    showValue: true,  // Shows current value next to slider
    extraAttributes: { min: 0, max: 100, step: 5 }
  }
];
```

**Select Field Display Modes:**

```javascript
fields: [
  // Standard dropdown (default displayMode)
  {
    id: 'country',
    label: 'Country',
    type: 'select',
    options: ['USA', 'Canada', 'UK', 'Australia'],
    required: true
  },

  // Dropdown with object options (label/value pairs)
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    displayMode: 'dropdown',  // Default
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'In Review', value: 'review' },
      { label: 'Published', value: 'published' }
    ]
  },

  // Badges display mode (pill-style buttons)
  {
    id: 'priority',
    label: 'Priority',
    type: 'select',
    displayMode: 'badges',  // Shows options as clickable pill buttons
    options: ['Low', 'Medium', 'High', 'Critical'],
    value: 'Medium'  // Pre-selected value
  }
];

// Getting value returns a single string
const priority = modal.getFieldValue('priority');  // 'Medium'
```

**D365 Option Set Auto-Fetch Example:**

```javascript
fields: [
  {
    id: "industrycode",
    type: "select",
    optionSet: {
      entityName: "account",
      attributeName: "industrycode",
      includeNull: true,
      sortByLabel: true,
    },
  },
  {
    id: "leadsourcecode",
    type: "select",
    optionSet: {
      entityName: "lead",
      attributeName: "leadsourcecode",
      includeNull: true,
    },
  },
];

// Library automatically:
// - Fetches option set metadata from D365 Web API
// - Populates dropdown with options
// - Uses attribute display name as label
// - Handles both local and global option sets
```

**Field Group Example:**

```javascript
// Organize related fields with visual grouping
fields: [
  // Simple group with title and divider (no border)
  {
    id: "personalInfoGroup",
    type: "group",
    label: "Personal Information",
    content: "Enter basic contact details below.",
    fields: [
      { id: "firstName", label: "First Name", type: "text", required: true },
      { id: "lastName", label: "Last Name", type: "text", required: true },
      { id: "email", label: "Email", type: "email" },
    ],
  },

  // Group with border (card-style section)
  {
    id: "addressGroup",
    type: "group",
    label: "Address Details",
    content: "Physical address information.",
    border: true,
    fields: [
      { id: "street", label: "Street", type: "text" },
      { id: "city", label: "City", type: "text" },
      { id: "postalCode", label: "Postal Code", type: "text" },
    ],
  },

  // Collapsible group (starts expanded)
  {
    id: "preferencesGroup",
    type: "group",
    label: "Preferences",
    border: true,
    collapsible: true,
    defaultCollapsed: false,
    fields: [
      {
        id: "notifications",
        label: "Enable Notifications",
        type: "switch",
        value: true,
      },
      { id: "newsletter", label: "Subscribe to Newsletter", type: "checkbox" },
    ],
  },

  // Collapsible group (starts collapsed)
  {
    id: "advancedGroup",
    type: "group",
    label: "Advanced Options",
    border: true,
    collapsible: true,
    defaultCollapsed: true,
    fields: [
      { id: "notes", label: "Notes", type: "textarea", rows: 3 },
      { id: "tags", label: "Tags", type: "text" },
    ],
  },
];

// Group Variations:
// 1. Simple: { type: 'group', label: 'Title', fields: [...] }
// 2. With description: { type: 'group', label: 'Title', content: 'Description', fields: [...] }
// 3. With border: { type: 'group', label: 'Title', border: true, fields: [...] }
// 4. Collapsible: { type: 'group', label: 'Title', border: true, collapsible: true, fields: [...] }
// 5. Starts collapsed: { type: 'group', label: 'Title', collapsible: true, defaultCollapsed: true, fields: [...] }

// Groups support:
// - Conditional visibility with visibleWhen (hide entire group based on other field values)
// - Nested fields with all field types (including nested groups)
// - Both bordered (card-style) and non-bordered (divider) layouts
```

**File Upload Example:**

```javascript
// Document upload with validation
fields: [
  {
    id: "attachments",
    label: "Upload Documents",
    type: "file",
    required: true,
    fileUpload: {
      accept: ".pdf,.doc,.docx,.xls,.xlsx", // File type filter
      maxFiles: 10, // Maximum number of files
      maxSize: 10485760, // 10MB per file
      multiple: true, // Allow multiple files
      showFileList: true, // Show selected files
      dragDropText: "Drag and drop files here",
      browseText: "or click to browse",
      onFilesSelected: (files) => {
        console.debug(
          "Files selected:",
          files.map((f) => f.name),
        );
      },
    },
  },
];

// Image upload only
fields: [
  {
    id: "productImages",
    label: "Product Photos",
    type: "file",
    fileUpload: {
      accept: "image/*", // Images only
      maxFiles: 5,
      maxSize: 5242880, // 5MB per file
    },
  },
];

// Get uploaded files
const files = modal.getFieldValue("attachments");
files.forEach((file) => {
  console.debug(`${file.name} - ${file.size} bytes`);
  // Upload to D365 using FormData, XHR, fetch, etc.
});
```

**Table Field Example:**

```javascript
// Using inline field config
fields: [
  {
    id: "productsTable",
    type: "table",
    label: "Products",
    tableColumns: [
      {
        id: "product",
        header: "Product Name",
        visible: true,
        sortable: true,
        width: "250px",
        align: "left",
      },
      {
        id: "category",
        header: "Category",
        visible: true,
        sortable: true,
        width: "180px",
        align: "left",
      },
      {
        id: "price",
        header: "Price ($)",
        visible: true,
        sortable: true,
        width: "120px",
        align: "right",
      },
      {
        id: "stock",
        header: "In Stock",
        visible: true,
        sortable: true,
        width: "100px",
        align: "right",
      },
    ],
    data: [
      {
        id: 1,
        product: "Surface Laptop 5",
        category: "Hardware",
        price: 1299,
        stock: 45,
      },
      {
        id: 2,
        product: "Office 365 E3",
        category: "Software",
        price: 20,
        stock: 999,
      },
    ],
    selectionMode: "multiple",
    onRowSelect: (selectedRows) => {
      console.debug(selectedRows);
    },
  },
];

// Simpler example
fields: [
  {
    id: "productsTable",
    type: "table",
    label: "Products",
    tableColumns: [
      {
        id: "product",
        header: "Product Name",
        visible: true,
        sortable: true,
        width: "250px",
        align: "left",
      },
      {
        id: "price",
        header: "Price ($)",
        visible: true,
        sortable: true,
        align: "right",
      },
    ],
    data: [
      { id: 1, product: "Product A", price: 100 },
      { id: 2, product: "Product B", price: 200 },
    ],
    selectionMode: "single",
  },
];

// Example with column formatting (currency, number, percent, date)
fields: [
  {
    id: "salesTable",
    type: "table",
    label: "Sales Report",
    tableColumns: [
      {
        id: "product",
        header: "Product",
        visible: true,
        sortable: true,
        width: "250px",
        align: "left",
      },
      {
        id: "revenue",
        header: "Revenue",
        visible: true,
        sortable: true,
        width: "120px",
        align: "right",
        format: "currency",  // Auto-formats as $1,234.56
      },
      {
        id: "units",
        header: "Units Sold",
        visible: true,
        sortable: true,
        width: "100px",
        align: "right",
        format: "number",  // Auto-formats as 1,234
      },
      {
        id: "margin",
        header: "Margin",
        visible: true,
        sortable: true,
        width: "100px",
        align: "right",
        format: "percent",  // Auto-formats as 12.34% (expects decimal: 0.1234)
      },
      {
        id: "saleDate",
        header: "Sale Date",
        visible: true,
        sortable: true,
        width: "120px",
        align: "left",
        format: "date",  // Auto-formats as MM/DD/YYYY (en-US)
      },
    ],
    data: [
      { id: 1, product: "Product A", revenue: 15234.89, units: 523, margin: 0.3245, saleDate: "2026-02-11" },
      { id: 2, product: "Product B", revenue: 8920.50, units: 1240, margin: 0.4512, saleDate: new Date(2026, 1, 10) },
    ],
    selectionMode: "single",
  },
];

// Format options:
// - format: 'currency' → Formats as $1,234.56 (USD with 2 decimals)
// - format: 'number' → Formats as 1,234 (thousands separator)
// - format: 'percent' → Formats as 12.34% (expects decimal input: 0.1234)
// - format: 'date' → Formats as MM/DD/YYYY (accepts Date objects or ISO strings)

// Table features (all built-in, no configuration needed):
// - Sortable columns (click headers to sort)
// - Row selection (none, single, multiple) with select-all checkbox
// - Column filtering (right-click header → Filter with Equals, Contains, Greater Than, etc.)
// - Column grouping (right-click header → Group By to group rows)
// - Group expand/collapse (click group headers)
// - Column visibility toggle (right-click header → Show/Hide Columns)
// - Custom column widths (width for fixed, minWidth for flexible)
// - Column formatting (format: currency, number, percent, date)
// - onRowSelect callback for selection changes
// - Dynamic data updates via setFieldValue()
// - HTML rendering in cells (automatically detects and renders HTML)

// Update table data dynamically:
modal.setFieldValue("productsTable", newData);
// The table will automatically re-render with new data

// Example with HTML rendering in cells:
const styledData = [
  {
    id: 1,
    product: "Product A",
    price: '<span style="color: #388e3c; font-weight: 600;">↓ $99.00</span>',
    status: '<span style="color: #1976d2;">Active</span>',
  },
  {
    id: 2,
    product: "Product B",
    price: '<span style="color: #d32f2f; font-weight: 600;">↑ $205.00</span>',
    status: '<span style="color: #f57c00;">Pending</span>',
  },
];
modal.setFieldValue("productsTable", styledData);
// HTML in cells will be rendered with styling - perfect for colored values, icons, badges
```

**Disabling Selection for Specific Rows:**

Use `isRowSelectable` to control which rows can be selected. This function receives each row as a parameter and returns `true` (selectable) or `false` (disabled).

```javascript
// Example: Only allow active products to be selected
fields: [
  {
    id: "productsTable",
    type: "table",
    label: "Products",
    selectionMode: "multiple",
    tableColumns: [
      { id: "name", header: "Product", visible: true, sortable: true },
      { id: "status", header: "Status", visible: true, sortable: true },
      { id: "price", header: "Price", visible: true, sortable: true, align: "right" },
    ],
    data: [
      { id: 1, name: "Product A", status: "Active", price: 100 },
      { id: 2, name: "Product B", status: "Inactive", price: 200 },
      { id: 3, name: "Product C", status: "Active", price: 150 },
      { id: 4, name: "Product D", status: "Discontinued", price: 80 },
    ],
    // Only active products can be selected
    isRowSelectable: (row) => row.status === "Active",
    onRowSelect: (selectedRows) => {
      console.debug("Selected active products:", selectedRows);
    },
  },
];

// More examples of isRowSelectable:

// Example 1: Disable rows based on stock level
isRowSelectable: (row) => row.stock > 0,

// Example 2: Disable rows based on multiple conditions
isRowSelectable: (row) => row.status === "Active" && row.price > 0 && !row.archived,

// Example 3: Disable rows based on user permissions
isRowSelectable: (row) => userHasPermission(row.ownerId),

// Example 4: Disable specific rows by ID
isRowSelectable: (row) => ![5, 7, 10].includes(row.id),

// Visual behavior:
// - Disabled rows have reduced opacity (0.5)
// - Checkboxes/radio buttons are grayed out
// - Cursor shows "not-allowed" for disabled rows
// - Clicking disabled rows has no effect
// - "Select All" only selects selectable rows
```

### 3. Lookup (`uiLib.Lookup`)

Advanced record selection with search, filter, sort, and multi-select.

**Two Lookup Options:**

1. **Inline Dropdown Lookup** (NEW - D365 Native Style) - Use as a field type in modals:

```javascript
new uiLib.Modal({
  fields: [
    {
      id: "accountLookup",
      label: "Account",
      type: "lookup",
      entityName: "account",
      lookupColumns: ["name", "accountnumber"], // Shows: name, accountnumber (values only, no labels)
      filters: "statecode eq 0", // Optional OData filter or FetchXML
      placeholder: "Search accounts...",
      required: true,
    },
    // With labels - shows "Label: value" format
    {
      id: "addressLookup",
      label: "Address",
      type: "lookup",
      entityName: "customeraddress",
      lookupColumns: [
        { attribute: "line1", label: "Address" },
        { attribute: "city", label: "City" },
        { attribute: "postalcode", label: "Postal Code" },
      ], // Shows: "Address: 123 Main St" (line 1), "City: Auckland" (line 2)
      placeholder: "Search addresses...",
    },
  ],
});
// - Inline dropdown appears below the field
// - Search as you type
// - Click to select
// - Returns: { id, name, subtitle, entityType, record }
// - With labels: displays "Label: value"
// - Without labels: displays value only
// - If columns don't exist, library auto-falls back to common names: 'name', 'fullname', 'subject', 'title'
// - Field validation fetches entity metadata to check column existence

// IMPORTANT: Multiple Entity Types (Polymorphic Lookups)
// Inline lookup supports ONE entity at a time. For Customer-type fields (Account OR Contact),
// use conditional visibility with separate lookups:
[
  {
    id: "customerType",
    label: "Type",
    type: "select",
    options: ["Account", "Contact"],
  },
  {
    id: "accountLookup",
    type: "lookup",
    entityName: "account",
    visibleWhen: {
      field: "customerType",
      operator: "equals",
      value: "Account",
    },
  },
  {
    id: "contactLookup",
    type: "lookup",
    entityName: "contact",
    visibleWhen: {
      field: "customerType",
      operator: "equals",
      value: "Contact",
    },
  },
];
// For true multi-entity search across tables simultaneously, use Modal Dialog Lookup instead.
```

2. **Modal Dialog Lookup** (Advanced) - Full-screen modal with table:

```javascript
new uiLib.Lookup({
  entity: "account",                    // Entity logical name
  columns: ["name", "telephone1", "emailaddress1"],  // Columns to display
  columnLabels: {                       // Custom column headers (optional)
    name: "Account Name",
    telephone1: "Phone",
    emailaddress1: "Email"
  },
  filters: "statecode eq 0",            // OData filter
  orderBy: [                            // Sort order (optional)
    { attribute: "name", descending: false },
    { attribute: "createdon", descending: true }
  ],
  searchFields: ["name", "accountnumber"],  // Fields to search (defaults to columns)
  additionalSearchFields: ["description"],   // Extra search fields (not displayed)
  defaultSearchTerm: "",                // Pre-populate search box
  multiSelect: true,                    // Allow selecting multiple records
  pageSize: 50,                         // Records per page (default: 50)
  showPagination: true,                 // Show pagination controls
  allowClear: true,                     // Show clear selection button
  title: "Select Account",              // Modal title (optional)
  width: 800,                           // Modal width (optional)
  height: 600,                          // Modal height (optional)
  onSelect: (records) => {
    // records: [{ id, name, entityType, attributes: { name, telephone1, ... } }]
    console.debug("Selected:", records);
  },
  onCancel: () => {
    console.debug("Lookup cancelled");
  }
}).show();
```

**Lookup Result Object:**
```javascript
{
  id: "guid-here",           // Record GUID
  name: "Contoso Ltd",       // Primary name attribute value
  entityType: "account",     // Entity logical name
  attributes: {              // All fetched columns
    name: "Contoso Ltd",
    telephone1: "555-1234",
    emailaddress1: "info@contoso.com"
  }
}
```

### 4. Table (`uiLib.Table`)

Data grid component with sorting, selection, and D365 integration.

```javascript
// Use as a field in modals
fields: [
  {
    id: "productsTable",
    type: "table",
    label: "Products",
    tableColumns: [
      {
        id: "name",
        header: "Product",
        visible: true,
        sortable: true,
        width: "200px",
      },
      {
        id: "price",
        header: "Price",
        visible: true,
        sortable: true,
        width: "100px",
      },
    ],
    data: [
      { id: 1, name: "Product A", price: 100 },
      { id: 2, name: "Product B", price: 200 },
    ],
    selectionMode: "multiple",
    onRowSelect: (rows) => {
      console.debug(rows);
    },
  },
];
```

### 5. Logger Utilities (`uiLib.TRACE`, `uiLib.WAR`, `uiLib.ERR`)

Styled console logging for debugging with consistent purple ui-Lib branding:

```javascript
// All logs appear with purple "ui-Lib" badge for consistent branding
// Trace/Debug logging
console.debug(...uiLib.TRACE, 'Debug message', { data: 'value' });

// Warning logging
console.warn(...uiLib.WAR, 'Warning message', { issue: 'details' });

// Error logging
console.error(...uiLib.ERR, 'Error message', error);

// Library-specific logging
console.debug(...uiLib.UILIB, 'UI library event', { action: 'modal opened' });

// Also available via Logger object
const { TRACE, WAR, ERR, UILIB } = uiLib.Logger;
console.debug(...TRACE, 'Using Logger object');
```

**Output appearance in browser console:**
- All logs show with purple background badge: `[ui-Lib] message`
- Consistent branding across all library logs
- Easy identification of ui-Lib messages in console

### 6. Modal Builder (Beta)

A visual drag-and-drop interface for building modal dialogs without writing code. Access via the Demo page's "Builder" tab.

> **Beta Notice:** The Modal Builder is currently in beta. Some features may be incomplete or change in future releases.

**Features:**
- **Drag & Drop Fields** - Drag field types from the palette onto your modal
- **Visual Configuration** - Configure field properties, validation, and visibility conditions
- **Live Preview** - See your modal render in real-time as you build
- **Code Export** - Generate ready-to-use JavaScript/TypeScript code
- **Wizard Support** - Build multi-step wizard dialogs with step indicators
- **Save & Load** - Save configurations to browser storage and reload later
- **Import Code** - Paste existing modal code to edit visually

**Field Types Supported:**
- Text, Email, Phone, Password, URL, Search
- Number, Range/Slider
- Textarea
- Date
- Select (dropdown and badges display modes)
- Checkbox, Switch
- Lookup (inline D365-style)
- Table (with sortable columns)
- File Upload
- Address Lookup
- Field Groups (with collapsible sections)
- Custom HTML

**Usage:**
1. Open the Demo page and navigate to the "Builder" tab
2. Drag fields from the left palette onto the canvas
3. Click fields to configure their properties in the right panel
4. Use the Preview button to see your modal
5. Export the generated code

## File Structure

### Source Code (`src/`)

- `components/Modal/Modal.ts` - Core modal implementation with conditional visibility
- `components/Modal/Modal.types.ts` - TypeScript interfaces (FieldConfig, VisibilityCondition, etc.)
- `components/Toast/Toast.ts` - Toast notification system
- `components/Lookup/Lookup.ts` - Lookup dialog
- `components/FluentUi/*.tsx` - React wrapper components for Fluent UI
- `components/FluentUi/AddressLookupFluentUi.tsx` - Address autocomplete with Google/Azure Maps
- `components/FluentUi/FieldGroupFluentUi.tsx` - Field grouping with collapsible sections
- `index.ts` - Main entry point, global API, and init() function

### Build Outputs (`build/` and `release/`)

- `ui-lib.min.js` - Minified bundle (~741KB, ~208KB gzipped)
- `ui-lib.types.d.ts` - TypeScript definitions
- `demo.html` - Interactive demo with code examples
- `tests.html` - Test suite

### Solution Package (`solution/`)

- D365 CE solution with web resources
- Scripts to update and package solution
- Managed/unmanaged solution support

## Initialization and Health Checking

### Library Initialization

The library provides an `init()` function that returns a health state object:

```javascript
// In D365 form OnLoad event
function onFormLoad(executionContext) {
  const health = uiLib.init(executionContext);

  // Health state object:
  // {
  //   loaded: true,           // Library initialization completed
  //   cssLoaded: true,        // CSS file found and loaded
  //   inWindow: true,         // Available as window.uiLib (and window.err403 for compatibility)
  //   version: "2026.01.24.01", // Current version
  //   timestamp: "2026-01-24T...", // Initialization time
  //   instance: uiLib         // Reference to library instance
  // }

  if (!health.cssLoaded) {
    console.warn("UI library CSS not loaded");
  }
}
```

**Health State Properties:**

- `loaded`: Boolean - library initialization completed successfully
- `cssLoaded`: Boolean - CSS stylesheet was found and loaded
- `inWindow`: Boolean - library is available as `window.uiLib` (and `window.err403` for backward compatibility)
- `version`: String - current library version
- `timestamp`: String - ISO timestamp of when initialization occurred
- `instance`: Object - reference to the library instance

### Iframe Support (Dynamics 365)

The library automatically detects and handles Dynamics 365's iframe architecture:

```javascript
// BEFORE: Complex parent window detection (NO LONGER NEEDED)
const libraryInstance =
  (typeof uiLib !== "undefined" && uiLib) ||
  (typeof window.top?.uiLib !== "undefined" && window.top.uiLib) ||
  (typeof window.parent?.uiLib !== "undefined" && window.parent.uiLib);

// AFTER: Simple check - library handles parent window detection automatically
if (typeof uiLib !== "undefined" && typeof uiLib.init === "function") {
  const health = uiLib.init();
}
```

**Auto-Detection Features:**

- Checks if library is already loaded in parent windows (window.top, window.parent)
- Automatically assigns parent instance to current iframe window
- Prevents duplicate loading across iframe boundaries
- Works seamlessly with D365 form iframes

**Multiple Iframes (Common in D365 Forms):**
When different form scripts are running in separate iframes (e.g., Account form in iframe 1, Contact form in iframe 2), each script can use the library seamlessly because:

1. Library is loaded once in the parent window (main page)
2. Each iframe's script checks for parent instance automatically
3. Auto-detection assigns parent instance to each iframe's `window.uiLib` (and `window.err403`)
4. No coordination needed between scripts in different iframes

**Manual Parent Window Detection (Optional):**

```javascript
// Use findInstance() if you need explicit parent window checking
const libraryInstance = uiLib.findInstance();
if (libraryInstance) {
  // Library found in current or parent window
  const health = libraryInstance.init();
}
```

## Development Workflow

### Build Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:5177)
npm run build            # Build library bundle
npm run build:pages      # Build demo/test pages
npm run build:all        # Build everything
npm run release          # Full release: build + update solution + pack zip
npm run deploy           # Deploy to D365 environment
```

### Solution Management

```bash
npm run update-solution  # Copy files to solution/src/WebResources
npm run pack-solution    # Create solution ZIP file
```

### Testing

- `npm run demo` - Interactive demo page
- `npm run test` - Test suite page
- Demo URL: http://localhost:5177/pages/demo.html

## Key Implementation Details

### Conditional Visibility System

Located in `src/components/Modal/Modal.ts`:

- `fieldVisibilityMap: Map<string, boolean>` - tracks visibility state
- `evaluateVisibilityCondition(condition)` - evaluates rules
- `updateFieldVisibility(changedFieldId)` - updates DOM when dependencies change
- All field onChange handlers call `updateFieldVisibility()`
- Works in both regular modals and wizard steps

### Wizard Step Indicators

Visual indicators with circles, checkmarks, exclamation marks, and connector lines:

- **Blue circle with number** = current step
- **Green circle with checkmark (✓)** = completed steps with all required fields filled
- **Red circle with exclamation (!)** = completed steps with missing required fields
- **Gray circle with number** = pending steps (not yet visited)
- **Connector lines** = color-coded to match step state (blue, green, red, or gray)

**Validation Logic:**

- `validateStep(stepIndex)` checks all required fields in a step
- Empty values trigger validation errors: `null`, `undefined`, `''`, or empty arrays `[]`
- Indicators update automatically when field values change
- `updateStepIndicator()` recalculates colors based on validation status

### Fluent UI Integration

React components wrap Fluent UI v9 components:

- `CheckboxFluentUi.tsx` - Checkbox component
- `SwitchFluentUi.tsx` - Switch/toggle component
- `DatePickerFluentUi.tsx` - DatePicker
- `DropdownFluentUi.tsx` - Dropdown/Select
- `InputFluentUi.tsx` - Input and textarea fields
- `TableFluentUi.tsx` - DataGrid with sorting and selection
- `LookupFluentUi.tsx` - D365-style inline lookup
- `AddressLookupFluentUi.tsx` - Address autocomplete
- `FileUploadFluentUi.tsx` - File upload with drag-drop
- `FieldGroupFluentUi.tsx` - Field grouping with collapsible sections
- All use `appearance="filled-darker"` for D365 style

## When Making Changes

### Styling Best Practices (Fluent UI v9)

**Use `makeStyles` and `tokens` instead of inline styles:**

```javascript
// ❌ BAD - Hardcoded inline styles
<div style={{ color: '#605e5c', padding: '8px' }}>

// ✅ GOOD - Use Fluent UI tokens and makeStyles
import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    color: tokens.colorNeutralForeground2,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
  }
});

// In component:
const styles = useStyles();
<div className={styles.container}>
```

**Common tokens to use:**
- Colors: `tokens.colorNeutralForeground1`, `tokens.colorBrandBackground`
- Spacing: `tokens.spacingVerticalS`, `tokens.spacingHorizontalM`
- Typography: `tokens.fontSizeBase300`, `tokens.fontWeightSemibold`
- Borders: `tokens.borderRadiusMedium`, `tokens.strokeWidthThin`

**Note:** Some existing components use inline styles for historical reasons. When modifying these files, prefer migrating to `makeStyles` + `tokens`.

### Adding New Field Types

1. Add type to `FieldConfig['type']` union in `Modal.types.ts`
2. Add any type-specific properties to `FieldConfig` interface
3. Add case handler to `createField()` in `Modal.ts` (around line 1018)
4. Create React wrapper component in `components/FluentUi/` if needed
5. Export component from `components/FluentUi/index.ts`
6. Import component in `Modal.ts`
7. Update README.md with example and property documentation
8. Update copilot-instructions.md with complete documentation
9. Add to demo page with interactive example

### Adding New Modal Features

1. Update `ModalOptions` interface in `Modal.types.ts`
2. Implement in `Modal.ts` class
3. Update TypeScript definitions (`rollup.dts.config.js`)
4. Add example to README.md
5. Add demo with code viewer

### Updating Documentation

1. **README.md** - User-facing documentation with examples
2. **Demo page** - Interactive examples with copy-paste code
3. **This file** - AI agent guide with architecture details

## Critical API Rules

### Tabs Must Use `asTabs` Pattern

**❌ WRONG - Top-level `tabs` property does not exist:**

```javascript
new uiLib.Modal({
  title: "My Modal",
  tabs: [{ id: "tab1", label: "Tab 1", content: "<p>HTML content</p>" }],
});
```

**✅ CORRECT - Use `fields` array with `asTabs: true`:**

```javascript
new uiLib.Modal({
  title: 'My Modal',
  fields: [
    {
      id: 'myTabs',
      asTabs: true,
      fields: [
        {
          id: 'tab1',
          label: 'Tab 1',
          content: '<p>HTML content goes here</p>',  // HTML content
          fields: [...]  // Optional: additional form fields
        },
        {
          id: 'tab2',
          label: 'Tab 2',
          content: '<div>More HTML</div>'
        }
      ]
    }
  ],
  buttons: [...]
});
```

**Tab Content Display:**

- Each tab can have `content` (HTML string) or `html` property
- Content appears at the top of the tab panel
- Form `fields` (if provided) appear below the content
- Content uses `innerHTML`, so full HTML is supported

### Buttons Must Use Constructor

**❌ WRONG - Plain objects are not supported:**

```javascript
buttons: [
  {
    label: "Submit",
    type: "primary",
    onClick: (modal) => {
      modal.close();
    },
  },
];
```

**✅ CORRECT - Use `new uiLib.Button()` constructor:**

```javascript
buttons: [
  new uiLib.Button({
    label: "Submit",
    callback: () => true, // Return true to close modal
    setFocus: true, // Makes button primary/blue (not 'type: primary')
    id: "submitBtn", // Explicit ID recommended
  }),
];
```

**Button Properties:**

- ❌ `onClick` - Does not exist
- ✅ `callback` - Function that receives modal instance, returns boolean
- ❌ `type: 'primary'` - Does not exist
- ✅ `setFocus: true` - Makes button primary/blue
- ✅ Return `true` from callback to close modal automatically
- ✅ Return `false` to keep modal open (or manually close)

**Button Constructor Styles:**

```javascript
// Object style (recommended - self-documenting)
new uiLib.Button({
  label: "Save",
  callback: () => true,
  setFocus: true,
  preventClose: false,
  isDestructive: false,
  id: "saveBtn",
});

// Positional parameters (backward compatible)
new uiLib.Button("Save", () => true, true, false, false, "saveBtn");
```

## Common Patterns

### Form Validation with Auto-Disabled Buttons

Use `requiresValidation: true` to automatically disable submit buttons until all required fields are filled:

```javascript
const modal = new uiLib.Modal({
  fields: [
    { id: "email", label: "Email", type: "email", required: true },
    { id: "phone", label: "Phone", type: "tel", required: true },
  ],
  buttons: [
    new uiLib.Button({
      label: "Submit",
      callback: function () {
        const email = modal.getFieldValue("email");
        const phone = modal.getFieldValue("phone");

        // No need to manually check - button only enabled when valid
        // Process data...
        return true; // Close modal
      },
      setFocus: true,
      requiresValidation: true, // ⚡ Auto-disabled until email and phone filled
      id: "submitBtn",
    }),
  ],
});
```

**Manual Validation (Old Way):**

```javascript
const modal = new uiLib.Modal({
  fields: [
    { id: "email", label: "Email", type: "email", required: true },
    { id: "phone", label: "Phone", type: "tel", required: true },
  ],
  buttons: [
    new uiLib.Button({
      label: "Submit",
      callback: function () {
        const email = modal.getFieldValue("email");
        const phone = modal.getFieldValue("phone");

        if (!email || !phone) {
          uiLib.Toast.error({ message: "Please fill required fields" });
          return false; // Keep modal open
        }

        // Process data...
        return true; // Close modal
      },
      setFocus: true,
      id: "submitBtn",
    }),
  ],
});
```

### Address Lookup with Auto-Population

```javascript
const modal = new uiLib.Modal({
  fields: [
    {
      id: "address",
      label: "Search Address",
      type: "addressLookup",
      addressLookup: {
        provider: "google", // or 'azure'
        apiKey: "YOUR_API_KEY",
        placeholder: "Start typing...",
        componentRestrictions: { country: ["nz", "au"] }, // Optional: restrict to countries
        fields: {
          street: "street",
          city: "city",
          state: "state",
          postalCode: "zip",
          country: "country",
          latitude: "lat",
          longitude: "lng",
        },
        onSelect: (address) => {
          console.debug("Selected:", address.formattedAddress);
          // address object contains: formattedAddress, street, city, state,
          // postalCode, country, latitude, longitude
        },
      },
    },
    // These fields will be auto-populated (optional)
    { id: "street", label: "Street", type: "text" },
    { id: "city", label: "City", type: "text" },
    { id: "state", label: "State", type: "text" },
    { id: "zip", label: "Postal Code", type: "text" },
    { id: "country", label: "Country", type: "text" },
  ],
});

// The library automatically:
// 1. Stores the complete address object in field value
// 2. Provides autocomplete for addresses via Google Maps or Azure Maps API
// 3. Parses the selected address into components
// 4. Optionally populates related fields based on mapping
// 5. Returns full address object: { formattedAddress, street, city, state, postalCode, country, latitude, longitude }
```

### Displaying Styled JSON in Modals

The demo page includes a helper function for syntax-highlighted JSON output:

```javascript
// Helper function (from Demo.tsx)
const formatJsonWithStyle = (obj: any): string => {
  const json = JSON.stringify(obj, null, 2);

  const highlighted = json
    .replace(/"([^"]+)":/g, '<span style="color: #0078d4; font-weight: bold;">"$1"</span>:') // Property names (blue)
    .replace(/: "([^"]*)"/g, ': <span style="color: #107c10;">"$1"</span>') // String values (green)
    .replace(/: (-?\d+\.?\d*)/g, ': <span style="color: #ca5010;">$1</span>') // Numbers (orange)
    .replace(/: (true|false)/g, ': <span style="color: #8764b8;">$1</span>') // Booleans (purple)
    .replace(/: null/g, ': <span style="color: #605e5c;">null</span>'); // Null (gray)

  return `<pre style="background: #f3f2f1; padding: 20px; border-radius: 6px; overflow: auto; max-height: 500px; text-align: left; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.6; border: 1px solid #e1dfdd;">${highlighted}</pre>`;
};

// Usage in alert modals
uiLib.ModalHelpers.alert('Form Data', formatJsonWithStyle(data));
```

**Note:** The `uiLib.ModalHelpers.alert()` function uses `content` property (innerHTML) instead of `message` (textContent), allowing HTML rendering for styled JSON output.

### Multi-Step Wizard with Validation

```javascript
const wizard = new uiLib.Modal({
  progress: { enabled: true, currentStep: 1, steps: [...] },
  buttons: [
    new uiLib.Button({
      label: 'Previous',
      callback: () => { wizard.previousStep(); return false; },
      id: 'prevBtn'
    }),
    new uiLib.Button({
      label: 'Next',
      callback: () => {
        wizard.nextStep();
        return false;
      },
      setFocus: true,
      id: 'nextBtn'
    }),
    new uiLib.Button({
      label: 'Finish',
      callback: () => { submitForm(); },
      setFocus: true,
      id: 'finishBtn'
    })
  ]
});
```

### Loading Overlay with Progress Bar

The loading overlay supports both **spinner mode** (indeterminate) and **progress bar mode** (determinate) for showing operation progress:

**Spinner Mode (Simple Loading):**

```javascript
modal.setLoading(true, "Processing...");
await performOperation();
modal.setLoading(false);
```

**Progress Bar Mode (Import/Export Operations):**

```javascript
const modal = new uiLib.Modal({
  title: 'Import Records',
  fields: [...],
  buttons: [
    new uiLib.Button({
      label: 'Start Import',
      callback: async function() {
        const records = getRecordsToImport();

        // Show initial progress
        modal.setLoading(true, {
          message: 'Starting import...',
          progress: 0
        });

        // Import with progress updates
        for (let i = 0; i < records.length; i++) {
          const percent = Math.round(((i + 1) / records.length) * 100);

          modal.setLoading(true, {
            message: `Importing record ${i + 1} of ${records.length}...`,
            progress: percent
          });

          await importRecord(records[i]);
        }

        // Hide loading overlay
        modal.setLoading(false);
        uiLib.Toast.success({ message: `Imported ${records.length} records` });

        return true; // Close modal
      },
      setFocus: true,
      id: 'importBtn'
    })
  ]
});
```

**API Signatures:**

```javascript
// Spinner mode (string message)
modal.setLoading(true, "Loading...");

// Progress bar mode (object with progress)
modal.setLoading(true, {
  message: "Importing...", // Optional message
  progress: 45, // Progress percentage (0-100)
});

// Hide overlay
modal.setLoading(false);
```

**Features:**

- **Smooth transitions**: Progress bar animates with 0.3s ease
- **Percentage display**: Shows rounded progress (e.g., "45%")
- **Theme styling**: Uses D365 primary blue for progress fill
- **High visibility**: Overlay background at 95% opacity
- **Inside modal**: Renders at z-index 10 within modal container

**Common Use Cases:**

```javascript
// Batch record updates
for (let i = 0; i < records.length; i++) {
  modal.setLoading(true, {
    message: `Updating ${i + 1}/${records.length}...`,
    progress: (i / records.length) * 100,
  });
  await updateRecord(records[i]);
}

// File upload progress
const onUploadProgress = (percent) => {
  modal.setLoading(true, {
    message: "Uploading file...",
    progress: percent,
  });
};

// Multi-step process
modal.setLoading(true, { message: "Step 1: Validating...", progress: 25 });
await validate();

modal.setLoading(true, { message: "Step 2: Processing...", progress: 50 });
await process();

modal.setLoading(true, { message: "Step 3: Finalizing...", progress: 75 });
await finalize();

modal.setLoading(false);
```

### Dynamic Field Updates

```javascript
const modal = new uiLib.Modal({ fields: [...] });
modal.show();

// Update field values programmatically
modal.setFieldValue('status', 'Active');
modal.setFieldValue('priority', 'High');

// Get values
const status = modal.getFieldValue('status');
```

### Dynamic Button Updates

The library provides a chainable API for manipulating buttons after a modal is created. All button methods return `this` for fluent chaining.

**IMPORTANT: Always use button IDs** for reliable identification. Labels can change (e.g., "Submit" → "Saving..."), breaking lookups.

```javascript
const modal = new uiLib.Modal({
  title: 'Process Data',
  fields: [...],
  buttons: [
    new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
    new uiLib.Button({
      label: 'Submit',
      callback: function() {
        // Process...
      },
      setFocus: true,
      id: 'submitBtn'
    })
  ]
});
modal.show();

// Get a button by ID (recommended), label, or index (0-based)
const submitBtn = modal.getButton('submitBtn');  // Explicit ID (BEST)
// or modal.getButton('Submit')     // Label (unreliable if label changes)
// or modal.getButton(1)            // Index (less readable)

if (submitBtn) {
  // All methods are chainable
  submitBtn.setLabel('Processing...').disable();

  // After async operation
  submitBtn.setLabel('Submit').enable();
}
```

**Available Button Methods (All Chainable):**

- `setLabel(text: string)` - Change button text
- `setDisabled(disabled: boolean)` - Enable/disable button
- `setVisible(visible: boolean)` - Show/hide button
- `enable()` - Shorthand for `setDisabled(false)`
- `disable()` - Shorthand for `setDisabled(true)`
- `show()` - Shorthand for `setVisible(true)`
- `hide()` - Shorthand for `setVisible(false)`

**Button Identification (Priority Order):**

1. **By ID (Strongly Recommended)**: `modal.getButton('submitBtn')` - Most reliable, survives label changes
2. **By Label**: `modal.getButton('Submit')` - Works but breaks if label changes
3. **By Index**: `modal.getButton(1)` - Works but less readable and fragile if button order changes

**Best Practice: Always Provide Explicit IDs**

While the library can auto-generate IDs from labels (e.g., "Submit" → "submit"), **always provide explicit IDs** as the 6th parameter. This makes your code:

- **Self-documenting** - Other developers understand the code without knowing auto-generation rules
- **Maintainable** - Code remains readable even if someone unfamiliar with the library reviews it
- **Explicit** - No hidden magic or assumptions about how IDs are created

```javascript
// ❌ BAD: Relies on auto-generation (other devs need to know the library internals)
new uiLib.Button("Submit", callback, true);
modal.getButton("submit"); // Where did 'submit' come from?

// ✅ GOOD: Explicit ID makes code self-documenting
new uiLib.Button("Submit", callback, true, false, false, "submitBtn");
modal.getButton("submitBtn"); // Clear and obvious
```

**Button Constructor:**

The Button class supports **two styles** for maximum flexibility:

**1. Object-style (Recommended - Self-documenting):**

```javascript
new uiLib.Button({
  label: "Save Record", // Required - button text
  callback: () => {
    /* ... */
  }, // Required - click handler
  setFocus: true, // Optional - makes this the primary (blue) button
  preventClose: false, // Optional - if true, button won't close modal automatically
  isDestructive: false, // Optional - if true, button appears red (warning/danger style)
  requiresValidation: true, // Optional - if true, button is disabled until all required fields are valid
  validateAllSteps: false, // Optional - for wizards: set to false to validate only current step (default: validates ALL steps)
  id: "saveBtn", // Optional but STRONGLY RECOMMENDED - unique identifier
});

// Minimal version (only required properties):
new uiLib.Button({
  label: "Cancel",
  callback: () => {},
  id: "cancelBtn",
});
```

**2. Positional parameters (Traditional - Backward compatible):**

```javascript
new uiLib.Button(
  label: string,           // Button text
  callback: function,      // Click handler
  setFocus: boolean,       // Auto-focus this button (makes it blue/primary)
  preventClose: boolean,   // Keep modal open on click
  isDestructive: boolean,  // Red danger/warning style
  id?: string,             // Optional unique identifier (RECOMMENDED)
  requiresValidation?: boolean,  // Optional - disable button until all required fields are valid
  validateAllSteps?: boolean     // Optional - for wizards: false = current step only (default: ALL steps)
)
```

**Best Practice:** Always provide explicit button IDs for maintainable code. Button references remain reliable even when labels change dynamically (e.g., "Submit" → "Saving...").

**Practical Example (Async Operation):**

```javascript
const modal = new uiLib.Modal({
  title: "Save Record",
  fields: [{ id: "name", label: "Name", type: "text", required: true }],
  buttons: [
    new uiLib.Button({
      label: "Cancel",
      callback: () => true,
      id: "cancelBtn",
    }),
    new uiLib.Button({
      label: "Save",
      callback: async function () {
        const name = modal.getFieldValue("name");
        if (!name) {
          uiLib.Toast.error({ message: "Name is required" });
          return false;
        }

        // Update button during async operation
        modal.getButton("saveBtn").setLabel("Saving...").disable();

        try {
          await saveToD365(name);
          uiLib.Toast.success({ message: "Saved successfully" });
          return true; // Close modal
        } catch (error) {
          uiLib.Toast.error({ message: "Save failed: " + error.message });

          // Restore button on error (ID still works even though label changed)
          modal.getButton("saveBtn").setLabel("Save").enable();

          return false; // Keep modal open
        }
      },
      setFocus: true,
      id: "saveBtn",
    }),
  ],
});
```

**Wizard Step Navigation Example:**

```javascript
const wizard = new uiLib.Modal({
  progress: { enabled: true, currentStep: 1, steps: [...] },
  buttons: [
    new uiLib.Button({
      label: 'Previous',
      callback: () => { wizard.previousStep(); return false; },
      id: 'prevBtn'
    }),
    new uiLib.Button({
      label: 'Next',
      callback: () => { wizard.nextStep(); return false; },
      setFocus: true,
      requiresValidation: true,
      validateAllSteps: false,  // Only validate current step for Next button
      id: 'nextBtn'
    }),
    new uiLib.Button({
      label: 'Finish',
      callback: () => { submitForm(); },
      setFocus: true,
      requiresValidation: true,  // Validates ALL steps (default in wizards)
      id: 'finishBtn'
    })
  ]
});
wizard.show();

// Manage button visibility based on step
wizard.getButton('prevBtn').hide();  // Hide on first step

// Later in nextStep/previousStep handlers
if (currentStep === 1) {
  wizard.getButton('prevBtn').hide();
  wizard.getButton('nextBtn').show();
  wizard.getButton('finishBtn').hide();
} else if (currentStep === lastStep) {
  wizard.getButton('prevBtn').show();
  wizard.getButton('nextBtn').hide();
  wizard.getButton('finishBtn').show();
}
```

## D365 Integration Patterns

### Reading Form Data into Modal

```javascript
function showEditModal(executionContext) {
  const formContext = executionContext.getFormContext();

  // Get current form values
  const accountName = formContext.getAttribute('name').getValue();
  const phone = formContext.getAttribute('telephone1').getValue();
  const industry = formContext.getAttribute('industrycode').getValue();

  const modal = new uiLib.Modal({
    title: 'Edit Account',
    fields: [
      { id: 'name', label: 'Account Name', type: 'text', value: accountName, required: true },
      { id: 'phone', label: 'Phone', type: 'tel', value: phone },
      { id: 'industry', label: 'Industry', type: 'select', optionSet: { entityName: 'account', attributeName: 'industrycode' }, value: industry }
    ],
    buttons: [
      new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
      new uiLib.Button({
        label: 'Save',
        callback: () => {
          // Write back to form
          formContext.getAttribute('name').setValue(modal.getFieldValue('name'));
          formContext.getAttribute('telephone1').setValue(modal.getFieldValue('phone'));
          formContext.getAttribute('industrycode').setValue(modal.getFieldValue('industry'));
          return true;
        },
        setFocus: true,
        id: 'saveBtn'
      })
    ]
  });
  modal.show();
}
```

### Creating Records with Web API

```javascript
async function createRecordFromModal() {
  const modal = new uiLib.Modal({
    title: 'Create Contact',
    fields: [
      { id: 'firstname', label: 'First Name', type: 'text', required: true },
      { id: 'lastname', label: 'Last Name', type: 'text', required: true },
      { id: 'email', label: 'Email', type: 'email' }
    ],
    buttons: [
      new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
      new uiLib.Button({
        label: 'Create',
        callback: async function() {
          const data = modal.getFieldValues();

          modal.setLoading(true, 'Creating contact...');

          try {
            const result = await Xrm.WebApi.createRecord('contact', {
              firstname: data.firstname,
              lastname: data.lastname,
              emailaddress1: data.email
            });

            uiLib.Toast.success({ title: 'Success', message: 'Contact created' });
            return true; // Close modal
          } catch (error) {
            uiLib.Toast.error({ title: 'Error', message: error.message });
            modal.setLoading(false);
            return false; // Keep modal open
          }
        },
        setFocus: true,
        requiresValidation: true,
        id: 'createBtn'
      })
    ]
  });
  modal.show();
}
```

### Batch Updates with Progress Bar

```javascript
async function updateMultipleRecords(recordIds) {
  const modal = new uiLib.Modal({
    title: 'Batch Update',
    message: `Update ${recordIds.length} records?`,
    buttons: [
      new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
      new uiLib.Button({
        label: 'Update All',
        callback: async function() {
          for (let i = 0; i < recordIds.length; i++) {
            const percent = Math.round(((i + 1) / recordIds.length) * 100);

            modal.setLoading(true, {
              message: `Updating ${i + 1} of ${recordIds.length}...`,
              progress: percent
            });

            try {
              await Xrm.WebApi.updateRecord('account', recordIds[i], { statuscode: 1 });
            } catch (error) {
              uiLib.Toast.error({ title: 'Error', message: `Failed: ${recordIds[i]}` });
            }
          }

          uiLib.Toast.success({ title: 'Complete', message: `Updated ${recordIds.length} records` });
          return true;
        },
        setFocus: true,
        id: 'updateBtn'
      })
    ]
  });
  modal.show();
}
```

### Cascading Lookups (Parent-Child)

```javascript
const modal = new uiLib.Modal({
  title: 'Select Contact',
  fields: [
    {
      id: 'account',
      label: 'Account',
      type: 'lookup',
      entityName: 'account',
      lookupColumns: ['name', 'accountnumber'],
      onChange: (value) => {
        // When account changes, update contact filter
        if (value && value.id) {
          // Store account ID for contact filter
          modal.setFieldValue('_accountFilter', value.id);
        }
      }
    },
    {
      id: '_accountFilter',
      type: 'text',
      visibleWhen: { field: '_never', operator: 'truthy' } // Hidden field to store filter
    },
    {
      id: 'contact',
      label: 'Contact',
      type: 'lookup',
      entityName: 'contact',
      lookupColumns: ['fullname', 'emailaddress1'],
      filters: '_parentcustomerid_value eq ${accountId}', // Dynamic filter
      visibleWhen: { field: 'account', operator: 'truthy' }
    }
  ]
});
```

### Error Handling Pattern

```javascript
async function safeWebApiCall(operation) {
  try {
    return await operation();
  } catch (error) {
    // Handle common D365 errors
    if (error.message?.includes('0x80040216')) {
      uiLib.Toast.error({ title: 'Duplicate', message: 'A record with this value already exists' });
    } else if (error.message?.includes('0x80040220')) {
      uiLib.Toast.error({ title: 'Permission', message: 'You do not have permission for this action' });
    } else if (error.message?.includes('0x80048306')) {
      uiLib.Toast.error({ title: 'Required', message: 'Required fields are missing' });
    } else {
      uiLib.Toast.error({ title: 'Error', message: error.message || 'An unknown error occurred' });
    }
    throw error; // Re-throw for caller to handle
  }
}

// Usage
try {
  await safeWebApiCall(() => Xrm.WebApi.createRecord('contact', data));
} catch (error) {
  // Error already shown via Toast
  modal.setLoading(false);
  return false;
}
```

## Complete Modal Options Reference

```javascript
new uiLib.Modal({
  // Basic options
  id: 'myModal',                    // Optional unique ID
  title: 'Modal Title',             // Required
  message: 'Text message',          // Optional - plain text
  content: '<div>HTML</div>',       // Optional - HTML content
  customContent: htmlElement,       // Optional - DOM element
  icon: 'INFO',                     // Optional - INFO, SUCCESS, WARNING, ERROR, QUESTION

  // Size options
  size: 'medium',                   // small | medium | large | fullscreen | { width, height }
  width: 800,                       // Optional - override width
  height: 600,                      // Optional - override height
  padding: 20,                      // Optional - inner padding

  // Behavior options
  preventClose: false,              // Prevent closing via buttons
  allowDismiss: false,              // Click outside to close (default: false, requires explicit button clicks)
  allowEscapeClose: true,           // Press Escape to close
  draggable: true,                  // Make modal draggable by header
  buttonAlignment: 'right',         // left | center | right | space-between

  // Auto-save (persist field values)
  autoSave: true,                   // Enable auto-save to localStorage
  autoSaveKey: 'myFormData',        // Key for localStorage

  // Debug mode
  debug: true,                      // Enable console logging

  // Wizard/Progress configuration
  progress: {
    enabled: true,
    type: 'steps-left',             // bar | steps-left | steps-right | step
    currentStep: 1,
    totalSteps: 3,
    allowStepNavigation: true,      // Click steps to navigate
    steps: [
      {
        id: 'step1',
        label: 'Step 1',
        name: 'Step Name',
        description: 'Step description',
        message: 'Step-specific message',
        content: '<small>Step HTML</small>',
        fields: [...]
      }
    ]
  },

  // Side cart (side panel)
  sideCart: {
    enabled: true,
    attached: true,                 // Attached to modal
    position: 'right',              // left | right
    width: 300,
    content: '<div>HTML</div>',
    imageUrl: 'path/to/image.png',
    backgroundColor: '#f3f2f1'
  },

  // Fields and buttons
  fields: [...],
  buttons: [...]
});
```

## Modal Instance Methods

```javascript
const modal = new uiLib.Modal({ ... });

// Display
modal.show();                                    // Show modal (returns Promise)
const response = await modal.showAsync();        // Show and wait for close (returns { button, data })
modal.close();                                   // Close modal programmatically

// Field management
modal.getFieldValue('fieldId');                  // Get single field value
modal.getFieldValues();                          // Get all field values as object
modal.setFieldValue('fieldId', value);           // Update field value

// Validation
modal.validateCurrentStep();                     // Validate current wizard step
modal.validateAllFields();                       // Validate all fields

// Wizard navigation
modal.nextStep();                                // Go to next step
modal.previousStep();                            // Go to previous step
modal.goToStep('stepId');                        // Go to specific step by ID
modal.updateProgress(2);                         // Update progress to step 2

// Button manipulation
modal.getButton('buttonId').setLabel('Text').disable();
modal.getButton('buttonId').enable().show();

// Loading state
modal.setLoading(true, 'Loading...');            // Show spinner with message
modal.setLoading(true, { message: 'Processing...', progress: 45 }); // Show progress bar at 45%
modal.setLoading(false);                         // Hide loading overlay

// Side cart
modal.updateSideCart('<div>New content</div>');
modal.updateSideCart({ imageUrl: 'path.png' });

// Auto-save
modal.clearAutoSave();                           // Clear saved form data

// DOM access
modal.getElement();                              // Get modal container element
modal.getElement('.my-class');                   // Get element(s) by selector

// Web resource - embed D365 web resource in modal
modal.showWebResource('err403_/mypage.html');
modal.showWebResource('err403_/datagrid.htm?data=ProductHistory&id=123', {
  autoResize: true,              // Auto-resize iframe to content
  width: 800,                    // Override width
  height: 600                    // Override height
});

// Chainable property setters
modal.title('New Title').message('New message').width(800).height(600);
```

## Complete Field Configuration Reference

```javascript
{
  // Core properties (all field types)
  id: 'fieldId',                    // Required - unique identifier
  label: 'Label',                   // Display label
  type: 'text',                     // Field type (see list below)
  value: 'initial',                 // Initial value
  placeholder: 'Hint...',           // Placeholder text
  tooltip: 'Help text',             // Tooltip on hover
  disabled: false,                  // Disable field
  readOnly: false,                  // Read-only mode
  required: true,                   // Required validation

  // Layout
  labelPosition: 'left',            // left | top
  orientation: 'horizontal',        // horizontal | vertical

  // Conditional behavior
  visibleWhen: { field: 'x', operator: 'equals', value: 'y' },
  requiredWhen: { field: 'x', operator: 'truthy' },

  // Change callback
  onChange: (value) => { console.debug(value); },

  // Custom validation (in addition to 'required' property)
  validation: {
    rules: [
      { type: 'required', message: 'This field is required' },
      { type: 'email', message: 'Please enter a valid email address' },
      { type: 'minLength', value: 3, message: 'Must be at least 3 characters' },
      { type: 'maxLength', value: 100, message: 'Cannot exceed 100 characters' },
      { type: 'pattern', value: /^[A-Z]/, message: 'Must start with uppercase letter' },
      { type: 'custom', validate: (v) => v > 0, message: 'Must be a positive number' },
      { type: 'custom', validate: (v) => /^\d{3}-\d{4}$/.test(v), message: 'Format: 123-4567' }
    ],
    showErrors: true  // Display validation errors below field
  },

  // Type-specific properties (see field type docs)
  rows: 4,                          // textarea
  options: ['A', 'B'],              // select
  displayMode: 'badges',            // select: dropdown | badges
  optionSet: { ... },               // select: D365 option set
  entityName: 'account',            // lookup
  lookupColumns: [...],             // lookup
  filters: 'statecode eq 0',        // lookup
  tableColumns: [...],              // table (each column supports: id, header, visible, sortable, width, minWidth, align, format)
  data: [...],                      // table
  selectionMode: 'multiple',        // table: none | single | multiple
  onRowSelect: (rows) => {},        // table: callback for selection changes
  isRowSelectable: (row) => true,   // table: function to control row selectability
  fileUpload: { ... },              // file
  addressLookup: { ... },           // addressLookup
  extraAttributes: { min: 0 },      // range
  showValue: true,                  // range
  border: true,                     // group
  collapsible: true,                // group
  defaultCollapsed: false,          // group
  fields: [...],                    // group, tabs
  asTabs: true,                     // tabs container
  render: () => element,            // custom
  html: '<div>HTML</div>'           // custom
}
```

## Common Issues & Solutions

### Library Not Found in Iframe

**Symptom:** `uiLib is not defined` in form script or web resource
**Solution:**

- Library auto-detects parent window automatically
- Check if library is added to form libraries (Form Properties → Form Libraries)
- Ensure library is first in the list (loads before scripts)
- Use safe check: `if (typeof uiLib !== 'undefined')`

### CSS Not Loading

**Symptom:** Components appear unstyled
**Solution:**

- Check `health.cssLoaded` from `uiLib.init(executionContext)`
- Verify `err403_/ui-lib.styles.css` web resource is deployed
- Clear browser cache (Ctrl+Shift+R)

### Modal Won't Show

**Symptom:** `modal.show()` doesn't display modal
**Solution:**

- Check for JavaScript errors in browser console
- Verify field configurations are valid
- Test with simple alert: `uiLib.Modal.alert('Test', 'Message')`

### Dynamic Table Updates

**Symptom:** Table data doesn't update when calling `setFieldValue`
**Solution:**

- Use: `modal.setFieldValue('tableId', newDataArray)`
- Library automatically triggers React re-render
- Ensure data is an array of objects with unique IDs

### Conditional Visibility Not Working

**Symptom:** Fields don't show/hide based on `visibleWhen`
**Solution:**

- Check `field` property matches the exact field ID being watched
- Verify `operator` is valid: equals, notEquals, contains, greaterThan, lessThan, truthy, falsy
- Ensure `value` type matches expected value (string, number, boolean)

## Best Practices for AI Agents

1. **Use field config objects**, not old helper classes like `new uiLib.Input()` or `new uiLib.Table()`
2. **Use object-style Button API** with explicit IDs: `new uiLib.Button({ label, callback, id })`
3. **Use `requiresValidation: true`** on submit/next buttons to auto-disable until form is valid
4. **Leverage conditional visibility** (`visibleWhen`) instead of manual DOM manipulation
5. **Use conditional required** (`requiredWhen`) for dynamic validation
6. **Use wizard steps** for multi-step forms with `progress.steps`
7. **Use field groups** (`type: 'group'`) to organize related fields visually
8. **Always provide code examples** when documenting features
9. **Test in demo page** before updating documentation
10. **Keep README.md and demo page in sync** with actual implementation
11. **Use TypeScript types** from `Modal.types.ts` for accurate IntelliSense
12. **Initialize library first** - Always call `uiLib.init()` before using components
13. **Check health state** - Use returned health object to verify CSS loaded
14. **Provide explicit button IDs** - Never rely on auto-generated IDs for maintainability
15. **Tab content**: Use `content` or `html` property on tab fields to display HTML content above form fields
16. **Button objects**: Always use `new uiLib.Button()` constructor, never plain objects

### When to Use Field Groups vs Tabs vs Wizard Steps

| Feature                             | Use Case                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Field Groups** (`type: 'group'`)  | Visual organization within a single form - sections like "Personal Info", "Address", "Preferences" |
| **Tabs** (`asTabs: true`)           | Alternative views of content - user picks which section to see                                     |
| **Wizard Steps** (`progress.steps`) | Sequential process - user must complete steps in order                                             |

```javascript
// Field Groups - Visual sections (all visible at once)
fields: [
  { type: 'group', label: 'Section 1', fields: [...] },
  { type: 'group', label: 'Section 2', fields: [...] }
]

// Tabs - Alternative views (one tab visible at a time)
fields: [{
  id: 'tabs',
  asTabs: true,  // REQUIRED for tabs
  fields: [
    {
      id: 'tab1',
      label: 'Tab 1',
      content: '<p>HTML content here</p>',  // Tab content (HTML)
      fields: [...]  // Optional form fields below content
    },
    {
      id: 'tab2',
      label: 'Tab 2',
      content: '<div>More HTML</div>'  // Tab content
    }
  ]
}]

// Wizard - Sequential steps
progress: {
  enabled: true,
  steps: [
    { label: 'Step 1', fields: [...] },
    { label: 'Step 2', fields: [...] }
  ]
}
```

### Common Mistakes to Avoid

1. **❌ Using plain button objects** instead of `new uiLib.Button()`

   ```javascript
   // WRONG:
   buttons: [{ label: "Close", onClick: () => {} }];

   // CORRECT:
   buttons: [
     new uiLib.Button({ label: "Close", callback: () => true, id: "closeBtn" }),
   ];
   ```

2. **❌ Using top-level `tabs` property** instead of `fields` with `asTabs: true`

   ```javascript
   // WRONG:
   new uiLib.Modal({ tabs: [...] })

   // CORRECT:
   new uiLib.Modal({ fields: [{ asTabs: true, fields: [...] }] })
   ```

3. **❌ Using `onClick` on buttons** instead of `callback`

   ```javascript
   // WRONG:
   new uiLib.Button({ onClick: () => {} });

   // CORRECT:
   new uiLib.Button({ callback: () => true });
   ```

4. **❌ Using `type: 'primary'` on buttons** instead of `setFocus: true`

   ```javascript
   // WRONG:
   new uiLib.Button({ type: "primary" });

   // CORRECT:
   new uiLib.Button({ setFocus: true });
   ```

5. **❌ Forgetting tab `content` property** when wanting to display HTML in tabs

   ```javascript
   // WRONG (no content displayed):
   fields: [{ asTabs: true, fields: [{ label: 'Tab 1', fields: [...] }] }]

   // CORRECT (HTML content + fields):
   fields: [{ asTabs: true, fields: [{ label: 'Tab 1', content: '<p>HTML</p>', fields: [...] }] }]
   ```

6. **❌ Using `type: 'html'`** instead of `type: 'custom'` with `html` property

   ```javascript
   // WRONG:
   { id: 'summary', type: 'html', content: '<div>HTML</div>' }

   // CORRECT:
   { id: 'summary', type: 'custom', html: '<div>HTML</div>' }
   ```

7. **❌ Using `onStepChange` callback** - not supported

   ```javascript
   // WRONG (callback will be ignored):
   progress: {
     enabled: true,
     onStepChange: (step) => { /* ... */ }  // ❌ Doesn't exist
   }

   // CORRECT - Handle in button callbacks:
   buttons: [
     new uiLib.Button({
       label: 'Next',
       callback: () => {
         modal.nextStep();
         updateButtonVisibility();  // ✅ Update after navigation
         return false;
       }
     })
   ]
   ```

## Unsupported Features

These features do **NOT** exist in the library:

1. **`onStepChange` callback** - No step change event callback
   - Use button callbacks to handle step transitions
   - Access current step with `modal.currentStep` (number)

2. **`type: 'html'` field type** - No such type exists
   - Use `type: 'custom'` with `html` property instead

3. **`webResource` modal option** - Not a constructor property
   - Use `modal.showWebResource(path)` method instead

4. **`content` property on custom fields** - Not supported
   - Use `html` or `render` properties instead
   - `content` is only for groups and tabs

## Version Management

- Version format: `YYYY.MM.DD.NN` (e.g., 2026.01.24.01)
- Versions tracked in `package.json`
- GitHub releases created via GitHub Actions
- D365 solution version matches package version

## Deployment

- **Development**: Local Vite dev server
- **Testing**: Import solution ZIP into test environment
- **Production**: Import solution ZIP into production environment
- **CI/CD**: GitHub Actions builds and releases on tag push

## Support Resources

- **Demo**: http://localhost:5177/pages/demo.html
- **Tests**: http://localhost:5177/pages/tests.html
- **README**: Complete examples and API reference
- **TypeScript**: Full IntelliSense support with `.d.ts` files

---

## AI Agent Quick Reference

### Cheat Sheet: Common Patterns

**Simple Alert:**
```javascript
await uiLib.ModalHelpers.alert('Title', 'Message');
```

**Confirmation Dialog:**
```javascript
const confirmed = await uiLib.ModalHelpers.confirm('Delete?', 'Are you sure?');
if (confirmed) { /* proceed */ }
```

**Toast Notifications:**
```javascript
uiLib.Toast.success({ title: 'Done', message: 'Saved!' });
uiLib.Toast.error({ title: 'Error', message: 'Failed' });
uiLib.Toast.warn({ title: 'Warning', message: 'Check input' });
uiLib.Toast.info({ title: 'Info', message: 'Processing...' });
```

**Form Modal (Most Common):**
```javascript
const modal = new uiLib.Modal({
  title: 'Edit Record',
  fields: [
    { id: 'name', label: 'Name', type: 'text', required: true },
    { id: 'email', label: 'Email', type: 'email' },
    { id: 'active', label: 'Active', type: 'switch', value: true }
  ],
  buttons: [
    new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
    new uiLib.Button({
      label: 'Save',
      callback: () => {
        const data = modal.getFieldValues();
        console.debug(data); // { name: '...', email: '...', active: true }
        return true; // Close modal
      },
      setFocus: true,
      id: 'saveBtn'
    })
  ]
});
modal.show();
```

**Wizard (Multi-Step):**
```javascript
const wizard = new uiLib.Modal({
  title: 'Setup Wizard',
  progress: {
    enabled: true,
    currentStep: 1,
    steps: [
      { id: 'step1', label: 'Info', fields: [...] },
      { id: 'step2', label: 'Details', fields: [...] },
      { id: 'step3', label: 'Review', fields: [...] }
    ]
  },
  buttons: [
    new uiLib.Button({ label: 'Back', callback: () => { wizard.previousStep(); return false; }, id: 'backBtn' }),
    new uiLib.Button({ label: 'Next', callback: () => { wizard.nextStep(); return false; }, setFocus: true, id: 'nextBtn' }),
    new uiLib.Button({ label: 'Finish', callback: () => true, setFocus: true, id: 'finishBtn' })
  ]
});
wizard.show();
```

### Field Type Quick Reference

| Type | Use For | Key Properties |
|------|---------|----------------|
| `text` | Single-line text | `placeholder`, `required` |
| `email` | Email addresses | `required`, `validation` |
| `number` | Numeric input | `extraAttributes: { min, max }` |
| `textarea` | Multi-line text | `rows` |
| `date` | Date picker | `startDate`, `endDate` |
| `select` | Dropdown | `options`, `displayMode` |
| `checkbox` | Boolean (D365 style) | `value: true/false` |
| `switch` | Boolean (modern toggle) | `value: true/false` |
| `lookup` | D365 record selector | `entityName`, `lookupColumns`, `filters` |
| `table` | Data grid | `tableColumns` (with `format`), `data`, `selectionMode`, `isRowSelectable` |
| `file` | File upload | `fileUpload: { accept, maxFiles, maxSize }` |
| `addressLookup` | Address autocomplete | `addressLookup: { provider, apiKey }` |
| `group` | Field grouping | `fields`, `border`, `collapsible` |
| `custom` | Custom HTML/render | `html` or `render: () => element` |

### Button Properties Quick Reference

```javascript
new uiLib.Button({
  label: 'Save',           // Button text (required)
  callback: () => true,    // Handler - return true to close (required)
  setFocus: true,          // Make primary/blue button
  preventClose: false,     // Keep modal open after click
  isDestructive: false,    // Make red/danger button
  requiresValidation: true,// Disable until form valid
  id: 'saveBtn'            // Unique ID (recommended)
});
```

### Conditional Visibility Quick Reference

```javascript
// Show field when another field equals a value
visibleWhen: { field: 'type', operator: 'equals', value: 'Business' }

// Show field when another field is truthy (non-empty)
visibleWhen: { field: 'showAdvanced', operator: 'truthy' }

// Show field when another field is falsy (empty/false)
visibleWhen: { field: 'useDefault', operator: 'falsy' }

// Available operators: equals, notEquals, contains, greaterThan, lessThan, truthy, falsy
```

### Critical Rules for AI Agents

1. **Always use `new uiLib.Button()`** - Never plain objects
2. **Always provide button IDs** - For reliable getButton() lookups
3. **Use `callback` not `onClick`** - onClick doesn't exist
4. **Use `setFocus: true` not `type: 'primary'`** - type property doesn't exist
5. **Tabs use `asTabs: true` in fields array** - Not a top-level `tabs` property
6. **Custom fields use `html` or `render`** - Not `content` (that's for groups/tabs)
7. **Return `true` from callback to close** - Return `false` to keep open
8. **Initialize first**: Call `uiLib.init()` before using components in D365
