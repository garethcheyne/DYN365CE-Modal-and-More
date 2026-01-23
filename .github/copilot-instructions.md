# AI Agent Guide: err403 Dynamics 365 UI Library

## Overview
This is a professional UI component library for Microsoft Dynamics 365 CE. It provides Toast notifications, Modal dialogs, Lookups, and Tables with native Fluent UI v9 styling through a simple vanilla JavaScript API.

## Architecture
- **User-facing API**: Vanilla JavaScript/TypeScript - simple and intuitive
- **Internal implementation**: React 18 + Fluent UI v9 (bundled, invisible to users)
- **Build system**: Vite + TypeScript + Rollup
- **Output**: Single minified bundle (~690KB, ~280KB gzipped) + TypeScript definitions

## Key Components

### 1. Toast Notifications (`err403.Toast`)
Simple notification system matching D365's native toast style.

```javascript
// Success, error, warning, info toasts
err403.Toast.success({ title: 'Saved!', message: 'Record updated', sound: true });
err403.Toast.error({ title: 'Error', message: 'Failed to save' });
err403.Toast.warn({ title: 'Warning', message: 'Check fields' });
err403.Toast.info({ title: 'Info', message: 'Processing...' });
```

### 2. Modal Dialogs (`err403.Modal`)
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
  
  // NEW: Conditional visibility
  visibleWhen: {
    field: 'otherFieldId',    // Field to watch
    operator: 'equals',       // equals | notEquals | contains | greaterThan | lessThan | truthy | falsy
    value: 'someValue'        // Comparison value
  },
  
  // NEW: D365 Option Set auto-fetch
  d365OptionSet: {
    entityName: 'account',       // D365 entity name
    attributeName: 'industrycode', // Attribute name
    includeNull: true,           // Include blank option
    sortByLabel: true            // Sort alphabetically
  }
}
```

**Wizard Pattern:**
```javascript
new err403.Modal({
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
    new err403.ModalButton('Previous', () => { modal.previousStep(); return false; }),
    new err403.ModalButton('Next', () => { modal.nextStep(); return false; }),
    new err403.ModalButton('Finish', () => { /* submit */ }, true)
  ]
});
```

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

**D365 Option Set Auto-Fetch Example:**
```javascript
fields: [
  {
    id: 'industrycode',
    type: 'select',
    d365OptionSet: {
      entityName: 'account',
      attributeName: 'industrycode',
      includeNull: true,
      sortByLabel: true
    }
  },
  {
    id: 'leadsourcecode',
    type: 'select',
    d365OptionSet: {
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

### 3. Lookup (`err403.Lookup`)
Advanced record selection with search, filter, sort, and multi-select.

```javascript
new err403.Lookup({
  entityName: 'account',
  multiple: true,
  columns: ['name', 'telephone1', 'emailaddress1'],
  filters: "statecode eq 0",
  onSelect: (records) => { /* handle selection */ }
}).show();
```

### 4. Table (`err403.Table`)
Data grid component with sorting, selection, and D365 integration.

```javascript
new err403.Table({
  id: 'productsTable',
  columns: [
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
- `index.ts` - Main entry point and global API

### Build Outputs (`build/` and `release/`)
- `ui-lib.min.js` - Minified bundle (~690KB)
- `ui-lib.types.d.ts` - TypeScript definitions
- `demo.html` - Interactive demo with code examples
- `tests.html` - Test suite

### Solution Package (`solution/`)
- D365 CE solution with web resources
- Scripts to update and package solution
- Managed/unmanaged solution support

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
Visual indicators with circles, checkmarks, and connector lines:
- Blue circle with number = current step
- Green circle with checkmark = completed steps
- Gray circle with number = pending steps
- Color-coded connector lines between steps

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
const modal = new err403.Modal({
  fields: [
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'phone', label: 'Phone', type: 'tel', required: true }
  ],
  buttons: [
    new err403.ModalButton('Submit', function() {
      const email = modal.getFieldValue('email');
      const phone = modal.getFieldValue('phone');
      
      if (!email || !phone) {
        err403.Toast.error({ message: 'Please fill required fields' });
        return false; // Keep modal open
      }
      
      // Process data...
      return true; // Close modal
    }, true)
  ]
});
```

### Multi-Step Wizard with Validation
```javascript
const wizard = new err403.Modal({
  progress: { enabled: true, currentStep: 1, steps: [...] },
  buttons: [
    new err403.ModalButton('Previous', () => { wizard.previousStep(); return false; }),
    new err403.ModalButton('Next', () => { 
      if (validateCurrentStep()) {
        wizard.nextStep(); 
      }
      return false; 
    }),
    new err403.ModalButton('Finish', () => { submitForm(); }, true)
  ]
});
```

### Dynamic Field Updates
```javascript
const modal = new err403.Modal({ fields: [...] });
modal.show();

// Update field values programmatically
modal.setFieldValue('status', 'Active');
modal.setFieldValue('priority', 'High');

// Get values
const status = modal.getFieldValue('status');
```

## Best Practices for AI Agents

1. **Use field config objects**, not old helper classes like `new err403.Input()`
2. **Leverage conditional visibility** (`visibleWhen`) instead of manual DOM manipulation
3. **Use wizard steps** for multi-step forms with `progress.steps`
4. **Always provide code examples** when documenting features
5. **Test in demo page** before updating documentation
6. **Keep README.md and demo page in sync** with actual implementation
7. **Use TypeScript types** from `Modal.types.ts` for accurate IntelliSense

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
