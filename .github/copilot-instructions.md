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
  const value = formContext.getAttribute('fieldname').getValue();
  
  uiLib.Toast.info({ message: `Value changed to: ${value}` });
}
```

**Ribbon Commands:**
```javascript
function onRibbonClick() {
  // No executionContext in ribbon
  uiLib.Modal.confirm('Action', 'Perform action?').then(confirmed => {
    if (confirmed) performAction();
  });
}
```

**Web Resource Iframe:**
```javascript
// Custom HTML page embedded in form
if (typeof uiLib !== 'undefined') {
  // Auto-assigned from parent window
  uiLib.Toast.success({ message: 'Web resource loaded' });
}
```

## Key Components

### 1. Toast Notifications (`uiLib.Toast`)
Simple notification system matching D365's native toast style.

```javascript
// Success, error, warning, info toasts
uiLib.Toast.success({ title: 'Saved!', message: 'Record updated', sound: true });
uiLib.Toast.error({ title: 'Error', message: 'Failed to save' });
uiLib.Toast.warn({ title: 'Warning', message: 'Check fields' });
uiLib.Toast.info({ title: 'Info', message: 'Processing...' });
```

### 2. Modal Dialogs (`uiLib.Modal`)
Professional modal system with forms, wizards, tabs, and conditional visibility.

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
- `text`, `email`, `tel`, `password`, `url`, `search` - Text inputs
- `number` - Number input
- `textarea` - Multi-line text (use `rows` property)
- `date` - Date picker
- `select` - Dropdown (use `options` array)
- `lookup` - Inline D365-style dropdown lookup (entityName, lookupColumns, filters)
  - `lookupColumns`: Array of columns (strings or {attribute, label, visible}) - shown in order specified
  - Note: Use `lookupColumns` for inline lookups, `columns` for Modal Dialog Lookups
- `checkbox` - Boolean checkbox (D365 native style)
- `switch` - Boolean toggle switch (modern style)
- `range` - Slider (use `extraAttributes: { min, max, step }`)
- `table` - Data grid with sortable columns, selection, and filtering
  - Use `tableColumns` property (array of {id, header, visible, sortable, width})
  - Use `data` property (array of row objects)
  - Use `selectionMode` property ('none', 'single', 'multiple')
  - Use `onRowSelect` callback for selection changes
- `addressLookup` - Address autocomplete with Google/Azure Maps
- `custom` - Custom HTML (use `render()` function)

**Wizard Pattern:**
```javascript
new uiLib.Modal({
  title: 'Setup Wizard',
  progress: {
    enabled: true,
    currentStep: 1,
    allowStepNavigation: true,
    steps: [
      { id: 'step1', label: 'Account Info', fields: [...] },
      { id: 'step2', label: 'Preferences', fields: [...] },
      { id: 'step3', label: 'Review', fields: [...] }
    ]
  },
  buttons: [
    new uiLib.ModalButton('Previous', () => { modal.previousStep(); return false; }),
    new uiLib.ModalButton('Next', () => { modal.nextStep(); return false; }),
    new uiLib.ModalButton('Finish', () => { /* submit */ }, true)
  ]
});
```

**Wizard Step Indicators:**
- **Blue circle with number** = current step
- **Green circle with checkmark** = completed steps with all required fields filled
- **Red circle with exclamation (!)** = completed steps with missing required fields
- **Gray circle with number** = pending steps (not yet visited)
- **Connector lines** match the step color (blue/green/red/gray)

**Automatic Validation:**
- Steps are validated automatically when fields change
- Required fields are checked: empty values (null, undefined, '', empty arrays) trigger red indicator
- Step indicators update in real-time as users fill in or clear required fields
- No manual validation code needed - library handles it automatically

**Conditional Visibility Example:**
```javascript
fields: [
  { id: 'accountType', label: 'Account Type', type: 'select', 
    options: ['Business', 'Individual'] },
  
  // Only show when accountType is 'Business'
  { id: 'companyName', label: 'Company Name', type: 'text',
    visibleWhen: { field: 'accountType', operator: 'equals', value: 'Business' }},
  
  // Marketing preferences
  { id: 'allowMarketing', label: 'Allow Marketing', type: 'switch' },
  { id: 'email', label: 'Email', type: 'email',
    visibleWhen: { field: 'allowMarketing', operator: 'truthy' }},
  { id: 'sms', label: 'SMS', type: 'tel',
    visibleWhen: { field: 'allowMarketing', operator: 'truthy' }}
]
```

**Conditional Required Example (NEW!):**
```javascript
fields: [
  { id: 'preferredContactMethod', label: 'Contact Method', type: 'select',
    options: ['Email', 'Phone', 'Mail'], required: true },
  
  // Email required only if preferred method is Email
  { id: 'email', label: 'Email', type: 'email',
    requiredWhen: { field: 'preferredContactMethod', operator: 'equals', value: 'Email' }},
  
  // Phone required only if preferred method is Phone
  { id: 'phone', label: 'Phone', type: 'tel',
    requiredWhen: { field: 'preferredContactMethod', operator: 'equals', value: 'Phone' }},
  
  // Address required only if preferred method is Mail
  { id: 'address', label: 'Address', type: 'text',
    requiredWhen: { field: 'preferredContactMethod', operator: 'equals', value: 'Mail' }}
]
```

**D365 Option Set Auto-Fetch Example:**
```javascript
fields: [
  {
    id: 'industrycode',
    type: 'select',
    optionSet: {
      entityName: 'account',
      attributeName: 'industrycode',
      includeNull: true,
      sortByLabel: true
    }
  },
  {
    id: 'leadsourcecode',
    type: 'select',
    optionSet: {
      entityName: 'lead',
      attributeName: 'leadsourcecode',
      includeNull: true
    }
  }
]

// Library automatically:
// - Fetches option set metadata from D365 Web API
// - Populates dropdown with options
// - Uses attribute display name as label
// - Handles both local and global option sets
```

**Table Field Example:**
```javascript
// Using Table class
fields: [
  new uiLib.Table({
    id: 'productsTable',
    label: 'Products',
    tableColumns: [
      { id: 'product', header: 'Product Name', visible: true, sortable: true, width: '250px' },
      { id: 'category', header: 'Category', visible: true, sortable: true, width: '180px' },
      { id: 'price', header: 'Price ($)', visible: true, sortable: true, width: '120px' },
      { id: 'stock', header: 'In Stock', visible: true, sortable: true, width: '100px' }
    ],
    data: [
      { id: 1, product: 'Surface Laptop 5', category: 'Hardware', price: 1299, stock: 45 },
      { id: 2, product: 'Office 365 E3', category: 'Software', price: 20, stock: 999 }
    ],
    selectionMode: 'multiple',
    onRowSelect: (selectedRows) => { console.log(selectedRows); }
  })
]

// Using inline field config (simpler)
fields: [
  {
    id: 'productsTable',
    type: 'table',
    label: 'Products',
    tableColumns: [
      { id: 'product', header: 'Product Name', visible: true, sortable: true, width: '250px' },
      { id: 'price', header: 'Price ($)', visible: true, sortable: true }
    ],
    data: [
      { id: 1, product: 'Product A', price: 100 },
      { id: 2, product: 'Product B', price: 200 }
    ],
    selectionMode: 'single'
  }
]

// Table features:
// - Sortable columns (click headers)
// - Row selection (none, single, multiple)
// - Column visibility control
// - Custom column widths
// - onRowSelect callback
// - Dynamic data updates via setFieldValue()
// - HTML rendering in cells (automatically detects and renders HTML)

// Update table data dynamically:
modal.setFieldValue('productsTable', newData);
// The table will automatically re-render with new data

// Example with HTML rendering in cells:
const styledData = [
  { 
    id: 1, 
    product: 'Product A', 
    price: '<span style="color: #388e3c; font-weight: 600;">↓ $99.00</span>',
    status: '<span style="color: #1976d2;">Active</span>'
  },
  { 
    id: 2, 
    product: 'Product B', 
    price: '<span style="color: #d32f2f; font-weight: 600;">↑ $205.00</span>',
    status: '<span style="color: #f57c00;">Pending</span>'
  }
];
modal.setFieldValue('productsTable', styledData);
// HTML in cells will be rendered with styling - perfect for colored values, icons, badges
```

### 3. Lookup (`uiLib.Lookup`)
Advanced record selection with search, filter, sort, and multi-select.

**Two Lookup Options:**

1. **Inline Dropdown Lookup** (NEW - D365 Native Style) - Use as a field type in modals:
```javascript
new uiLib.Modal({
  fields: [
    {
      id: 'accountLookup',
      label: 'Account',
      type: 'lookup',
      entityName: 'account',
      lookupColumns: ['name', 'accountnumber'],
      filters: "statecode eq 0",  // Optional OData filter
      placeholder: 'Search accounts...',
      required: true
    }
  ]
});
// - Inline dropdown appears below the field
// - Search as you type
// - Click to select
// - Returns: { id, name, subtitle, entityType, record }
```

2. **Modal Dialog Lookup** (Advanced) - Full-screen modal with table:
```javascript
new uiLib.Lookup({
  entityName: 'account',
  multiple: true,
  columns: ['name', 'telephone1', 'emailaddress1'],  // Same 'columns' parameter
  filters: "statecode eq 0",
  onSelect: (records) => { /* handle selection */ }
}).show();
```

### 4. Table (`uiLib.Table`)
Data grid component with sorting, selection, and D365 integration.

```javascript
new uiLib.Table({
  id: 'productsTable',
  tableColumns: [
    { id: 'name', header: 'Product', visible: true, sortable: true, width: '200px' },
    { id: 'price', header: 'Price', visible: true, sortable: true, width: '100px' }
  ],
  data: [
    { id: 1, name: 'Product A', price: 100 },
    { id: 2, name: 'Product B', price: 200 }
  ],
  selectionMode: 'multiple',
  onRowSelect: (rows) => { console.log(rows); }
})
```

## File Structure

### Source Code (`src/`)
- `components/Modal/Modal.ts` - Core modal implementation with conditional visibility
- `components/Modal/Modal.types.ts` - TypeScript interfaces (FieldConfig, VisibilityCondition, etc.)
- `components/Toast/Toast.ts` - Toast notification system
- `components/Lookup/Lookup.ts` - Lookup dialog
- `components/FluentUi/*.tsx` - React wrapper components for Fluent UI
- `components/FluentUi/AddressLookupFluentUi.tsx` - Address autocomplete with Google/Azure Maps
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
  //   inWindow: true,         // Available as window.err403
  //   version: "2026.01.24.01", // Current version
  //   timestamp: "2026-01-24T...", // Initialization time
  //   instance: err403        // Reference to library instance
  // }
  
  if (!health.cssLoaded) {
    console.warn('UI library CSS not loaded');
  }
}
```

**Health State Properties:**
- `loaded`: Boolean - library initialization completed successfully
- `cssLoaded`: Boolean - CSS stylesheet was found and loaded
- `inWindow`: Boolean - library is available as `window.err403`
- `version`: String - current library version
- `timestamp`: String - ISO timestamp of when initialization occurred
- `instance`: Object - reference to the library instance

### Iframe Support (Dynamics 365)

The library automatically detects and handles Dynamics 365's iframe architecture:

```javascript
// BEFORE: Complex parent window detection (NO LONGER NEEDED)
const err403Instance = (typeof err403 !== 'undefined' && err403) ||
    (typeof window.top?.err403 !== 'undefined' && window.top.err403) ||
    (typeof window.parent?.err403 !== 'undefined' && window.parent.err403);

// AFTER: Simple check - library handles parent window detection automatically
if (typeof err403 !== 'undefined' && typeof err403.init === 'function') {
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
3. Auto-detection assigns parent instance to each iframe's `window.err403`
4. No coordination needed between scripts in different iframes

**Manual Parent Window Detection (Optional):**
```javascript
// Use findInstance() if you need explicit parent window checking
const libraryInstance = err403.findInstance();
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
- `CheckboxFluentUi.tsx` - Switch component
- `DatePickerFluentUi.tsx` - DatePicker
- `DropdownFluentUi.tsx` - Dropdown
- `InputFluentUi.tsx` - Input fields
- `TableFluentUi.tsx` - DataGrid
- All use `appearance="filled-darker"` for D365 style

## When Making Changes

### Adding New Field Types
1. Add type to `FieldConfig['type']` in `Modal.types.ts`
2. Add case to `createField()` in `Modal.ts`
3. Create React wrapper in `components/FluentUi/` if needed
4. Update README.md with example
5. Add to demo page with code example

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

## Common Patterns

### Form Validation
```javascript
const modal = new uiLib.Modal({
  fields: [
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'phone', label: 'Phone', type: 'tel', required: true }
  ],
  buttons: [
    new uiLib.ModalButton('Submit', function() {
      const email = modal.getFieldValue('email');
      const phone = modal.getFieldValue('phone');
      
      if (!email || !phone) {
        uiLib.Toast.error({ message: 'Please fill required fields' });
        return false; // Keep modal open
      }
      
      // Process data...
      return true; // Close modal
    }, true)
  ]
});
```

### Address Lookup with Auto-Population
```javascript
const modal = new uiLib.Modal({
  fields: [
    { 
      id: 'address', 
      label: 'Search Address', 
      type: 'addressLookup',
      addressLookup: {
        provider: 'google', // or 'azure'
        apiKey: 'YOUR_API_KEY',
        placeholder: 'Start typing...',
        componentRestrictions: { country: ['nz', 'au'] }, // Optional: restrict to countries
        fields: {
          street: 'street',
          city: 'city',
          state: 'state',
          postalCode: 'zip',
          country: 'country',
          latitude: 'lat',
          longitude: 'lng'
        },
        onSelect: (address) => {
          console.log('Selected:', address.formattedAddress);
          // address object contains: formattedAddress, street, city, state, 
          // postalCode, country, latitude, longitude
        }
      }
    },
    // These fields will be auto-populated (optional)
    { id: 'street', label: 'Street', type: 'text' },
    { id: 'city', label: 'City', type: 'text' },
    { id: 'state', label: 'State', type: 'text' },
    { id: 'zip', label: 'Postal Code', type: 'text' },
    { id: 'country', label: 'Country', type: 'text' }
  ]
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
    new uiLib.ModalButton('Previous', () => { wizard.previousStep(); return false; }),
    new uiLib.ModalButton('Next', () => { 
      if (validateCurrentStep()) {
        wizard.nextStep(); 
      }
      return false; 
    }),
    new uiLib.ModalButton('Finish', () => { submitForm(); }, true)
  ]
});
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
    new uiLib.ModalButton('Cancel', () => true),  // Auto-ID: 'cancel'
    new uiLib.ModalButton('Submit', function() {  // Auto-ID: 'submit'
      // Process...
    }, true)
    // Or provide explicit ID as 6th parameter:
    // new uiLib.ModalButton('Submit', callback, true, false, false, 'submitBtn')
  ]
});
modal.show();

// Get a button by ID (recommended), label, or index (0-based)
const submitBtn = modal.getButton('submit');  // Auto-generated ID
// or modal.getButton('submitBtn')  // Explicit ID if provided
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

**Auto-Generated IDs:**
If no ID is provided, the button ID is auto-generated from the label (lowercase, spaces removed):
- Label: "Save" → ID: "save"
- Label: "Submit Form" → ID: "submitform"
- Label: "Cancel" → ID: "cancel"

**ModalButton Constructor:**
```javascript
new uiLib.ModalButton(
  label: string,           // Button text
  callback: function,      // Click handler
  setFocus: boolean,       // Auto-focus this button
  preventClose: boolean,   // Keep modal open on click
  isDestructive: boolean,  // Red warning style
  id?: string              // Optional unique identifier (RECOMMENDED)
)
```

**Practical Example (Async Operation):**
```javascript
const modal = new uiLib.Modal({
  title: 'Save Record',
  fields: [
    { id: 'name', label: 'Name', type: 'text', required: true }
  ],
  buttons: [
    new uiLib.ModalButton('Cancel', () => true),  // Auto-ID: 'cancel'
    new uiLib.ModalButton('Save', async function() {  // Auto-ID: 'save'
      const name = modal.getFieldValue('name');
      if (!name) {
        uiLib.Toast.error({ message: 'Name is required' });
        return false;
      }
      
      // Update button during async operation (using auto-generated ID)
      modal.getButton('save')
        .setLabel('Saving...')
        .disable();
      
      try {
        await saveToD365(name);
        uiLib.Toast.success({ message: 'Saved successfully' });
        return true; // Close modal
      } catch (error) {
        uiLib.Toast.error({ message: 'Save failed: ' + error.message });
        
        // Restore button on error (ID still works even though label changed)
        modal.getButton('save')
          .setLabel('Save')
          .enable();
        
        return false; // Keep modal open
      }
    }, true)
  ]
});
```

**Wizard Step Navigation Example:**
```javascript
const wizard = new uiLib.Modal({
  progress: { enabled: true, currentStep: 1, steps: [...] },
  buttons: [
    new uiLib.ModalButton('Previous', () => { wizard.previousStep(); return false; }),  // Auto-ID: 'previous'
    new uiLib.ModalButton('Next', () => { wizard.nextStep(); return false; }),  // Auto-ID: 'next'
    new uiLib.ModalButton('Finish', () => { submitForm(); }, true)  // Auto-ID: 'finish'
  ]
});
wizard.show();

// Manage button visibility based on step (using auto-generated IDs)
wizard.getButton('previous').hide();  // Hide on first step

// Later in nextStep/previousStep handlers
if (currentStep === 1) {
  wizard.getButton('previous').hide();
  wizard.getButton('next').show();
  wizard.getButton('finish').hide();
} else if (currentStep === lastStep) {
  wizard.getButton('previous').show();
  wizard.getButton('next').hide();
  wizard.getButton('finish').show();
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

1. **Use field config objects**, not old helper classes like `new uiLib.Input()`
2. **Leverage conditional visibility** (`visibleWhen`) instead of manual DOM manipulation
3. **Use conditional required** (`requiredWhen`) for dynamic validation
4. **Use wizard steps** for multi-step forms with `progress.steps`
5. **Always provide code examples** when documenting features
6. **Test in demo page** before updating documentation
7. **Keep README.md and demo page in sync** with actual implementation
8. **Use TypeScript types** from `Modal.types.ts` for accurate IntelliSense
9. **Initialize library first** - Always call `uiLib.init()` before using components
10. **Check health state** - Use returned health object to verify CSS loaded

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
