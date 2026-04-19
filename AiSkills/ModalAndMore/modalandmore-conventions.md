# ModalAndMore Conventions — uiLib D365 UI Library

> This is the conventions file for the ModalAndMore AI skill.
> It teaches AI assistants how to correctly generate code using the uiLib library for Microsoft Dynamics 365 CE.

---

## What This Library Does

A professional UI component library for Dynamics 365 CE providing Toast notifications, Modal dialogs, Lookups, Tables, and more with native Fluent UI v9 styling through a simple vanilla JavaScript API.

**Namespace:** `window.uiLib` (primary) or `window.err403` (backward compatibility)
**Output:** Single minified JS bundle (~690KB, ~280KB gzipped) loaded as a D365 web resource.
**Consumer API:** Vanilla JavaScript — React internals are hidden from the user.

### Components

- **Toast** — Slide-in notifications matching D365 native style
- **Modal** — Form modals, alerts, confirms, prompts, wizards with step indicators
- **Lookup** — D365-style record pickers (inline dropdown + full modal)
- **Table** — Sortable, filterable, selectable data grids with column formatting
- **Query Builder** — Visual FetchXML/OData filter builder
- **File Upload** — Drag-and-drop with validation
- **Address Lookup** — Google Maps / Azure Maps autocomplete
- **Field Groups** — Collapsible sections for form organization
- **Logger** — Styled console logging with `[ui-Lib]` branding

---

## Critical Rules (MUST follow)

### 1. Buttons MUST use constructor — never plain objects

```javascript
// ❌ WRONG — will silently fail
buttons: [{ label: 'Save', onClick: () => {} }]

// ✅ CORRECT
buttons: [new uiLib.Button({ label: 'Save', callback: () => true, id: 'saveBtn' })]
```

### 2. Use `callback` not `onClick`; `setFocus` not `type: 'primary'`

```javascript
// ❌ WRONG
new uiLib.Button({ onClick: () => {}, type: 'primary' })

// ✅ CORRECT
new uiLib.Button({ callback: () => true, setFocus: true })
```

### 3. Tabs use `asTabs: true` inside `fields` — no top-level `tabs` property

```javascript
// ❌ WRONG
new uiLib.Modal({ tabs: [...] })

// ✅ CORRECT
new uiLib.Modal({ fields: [{ id: 'tabs', asTabs: true, fields: [...] }] })
```

### 4. Custom HTML fields use `type: 'custom'` with `html` or `render`

```javascript
// ❌ WRONG — type 'html' does not exist
{ type: 'html', content: '<div>...</div>' }

// ✅ CORRECT
{ type: 'custom', html: '<div>...</div>' }
{ type: 'custom', render: () => document.createElement('div') }
```

### 5. Always provide explicit button IDs

```javascript
// ❌ Fragile
new uiLib.Button('Submit', callback, true);

// ✅ Self-documenting
new uiLib.Button({ label: 'Submit', callback, setFocus: true, id: 'submitBtn' });
```

### 6. Return `true` from callback to close modal, `false` to keep open

### 7. `onStepChange` callback does NOT exist — handle in button callbacks

### 8. `content` property is for groups/tabs only — custom fields use `html` or `render`

---

## Initialization

```javascript
// D365 form OnLoad
function onFormLoad(executionContext) {
  const health = uiLib.init(executionContext);
  if (!health.loaded) return;
  // health: { loaded, inWindow, version, timestamp, instance }
}

// Iframe / web resource — just check availability
if (typeof uiLib !== 'undefined') {
  uiLib.Toast.info({ message: 'Ready' });
}
```

---

## Toast API

```javascript
uiLib.Toast.success({ title: 'Saved', message: 'Record updated', duration: 6000, sound: true });
uiLib.Toast.error({ title: 'Error', message: 'Failed' });
uiLib.Toast.warn({ title: 'Warning', message: 'Check fields' });
uiLib.Toast.info({ title: 'Info', message: 'Processing...' });

// Manual dismiss
const t = uiLib.Toast.info({ title: 'Working...', duration: 0 });
t.close();
```

**Options:** `title` (required), `message`, `duration` (ms, default 6000, 0=manual), `sound` (boolean).

---

## Modal Quick Helpers

```javascript
await uiLib.Modal.alert('Title', 'Message');
const yes = await uiLib.Modal.confirm('Delete?', 'Are you sure?');
const modal = uiLib.Modal.open({ title: 'Form', fields: [...] });

// ModalHelpers — with icon type parameter
await uiLib.ModalHelpers.alert('Success!', '<b>Saved</b>', 'success');
const confirmed = await uiLib.ModalHelpers.confirm('Delete?', 'Sure?', 'warning');
const name = await uiLib.ModalHelpers.prompt('Name', 'Enter name', 'default');
```

---

## Button Constructor

```javascript
// Object style (recommended)
new uiLib.Button({
  label: 'Save',              // Button text (required)
  callback: () => true,       // Handler — return true to close (required)
  setFocus: true,             // Make primary/blue
  preventClose: false,        // Keep modal open after click
  isDestructive: false,       // Red danger style
  requiresValidation: true,   // Disable until form valid
  validateAllSteps: false,    // Wizards: false = current step only
  id: 'saveBtn'               // Unique ID (STRONGLY recommended)
});

// Positional style (backward compatible)
new uiLib.Button(label, callback, setFocus, preventClose, isDestructive, id);
```

**Instance methods (all chainable):** `setLabel(text)`, `setDisabled(bool)`, `setVisible(bool)`, `enable()`, `disable()`, `show()`, `hide()`.

**Get button:** `modal.getButton('saveBtn')` (by ID), `modal.getButton('Save')` (by label), `modal.getButton(0)` (by index).

---

## Form Modal

```javascript
const modal = new uiLib.Modal({
  title: 'Create Contact',
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
        return true; // close
      },
      setFocus: true, requiresValidation: true, id: 'saveBtn'
    })
  ]
});
modal.show();
```

---

## Field Types Quick Reference

| Type | Key Properties | Value Type |
|------|---------------|------------|
| `text` | `placeholder`, `required` | `string` |
| `email` | `required`, `validation` | `string` |
| `tel` | `placeholder` | `string` |
| `password` | `required` | `string` |
| `url` | `placeholder` | `string` |
| `search` | `placeholder` | `string` |
| `number` | `extraAttributes: { min, max, step }` | `number` |
| `textarea` | `rows` | `string` |
| `date` | | `Date \| null` |
| `select` | `options`, `displayMode: 'badges'` | `string` |
| `checkbox` | | `boolean` |
| `switch` | | `boolean` |
| `range` | `showValue`, `extraAttributes: { min, max, step }` | `number` |
| `lookup` | `entityName`, `lookupColumns`, `filters` | `object \| null` |
| `table` | `tableColumns`, `data`, `selectionMode` | via `onRowSelect` |
| `file` | `fileUpload: { accept, maxFiles, maxSize }` | `File[]` |
| `addressLookup` | `addressLookup: { provider, apiKey }` | `object` |
| `group` | `fields`, `border`, `collapsible` | container |
| `custom` | `html` or `render` | N/A |

---

## Common Field Properties

```javascript
{
  id: 'fieldId',              // Required — unique identifier
  label: 'Label',             // Display label
  type: 'text',               // Field type
  value: 'initial',           // Initial value
  required: true,             // Validation
  disabled: false,            // State
  placeholder: 'Enter...',   // Hint text
  orientation: 'horizontal',  // Layout (default) or 'vertical'

  // Conditional visibility
  visibleWhen: { field: 'otherField', operator: 'equals', value: 'someValue' },
  // Operators: equals, notEquals, contains, greaterThan, lessThan, truthy, falsy

  // Conditional required
  requiredWhen: { field: 'otherField', operator: 'truthy' },

  // Change callback
  onChange: (value) => { console.debug('Changed:', value); }
}
```

---

## Wizard Pattern

```javascript
const wizard = new uiLib.Modal({
  title: 'Setup',
  progress: {
    enabled: true, currentStep: 1, allowStepNavigation: true,
    steps: [
      { id: 's1', label: 'Info', fields: [...] },
      { id: 's2', label: 'Prefs', fields: [...] },
      { id: 's3', label: 'Review', fields: [...] }
    ]
  },
  buttons: [
    new uiLib.Button({ label: 'Back', callback: () => { wizard.previousStep(); return false; }, id: 'backBtn' }),
    new uiLib.Button({ label: 'Next', callback: () => { wizard.nextStep(); return false; }, setFocus: true, requiresValidation: true, validateAllSteps: false, id: 'nextBtn' }),
    new uiLib.Button({ label: 'Finish', callback: () => true, setFocus: true, requiresValidation: true, id: 'finishBtn' })
  ]
});
wizard.show();
```

**Step indicators:** Blue (current), Green checkmark (complete + valid), Red exclamation (complete + invalid), Gray (pending).

---

## Modal Instance Methods

```javascript
modal.show();                              // Show modal
const response = await modal.showAsync();  // Show and wait for close
modal.close();                             // Close programmatically
modal.getFieldValue('fieldId');            // Get single value
modal.getFieldValues();                    // Get all as object
modal.setFieldValue('fieldId', value);     // Update value
modal.nextStep();                          // Wizard: next
modal.previousStep();                      // Wizard: previous
modal.goToStep('stepId');                  // Wizard: go to step
modal.getButton('id').disable();           // Button manipulation
modal.setLoading(true, 'Loading...');      // Spinner overlay
modal.setLoading(true, { message: '...', progress: 45 });  // Progress bar
modal.setLoading(false);                   // Hide overlay
```

---

## D365 Integration Patterns

### Form OnLoad

```javascript
function onFormLoad(executionContext) {
  const health = uiLib.init(executionContext);
  if (!health.loaded) return;
  const formContext = executionContext.getFormContext();
}
```

### Reading Form Data into Modal

```javascript
const name = formContext.getAttribute('name').getValue();
const modal = new uiLib.Modal({
  fields: [{ id: 'name', type: 'text', value: name, required: true }],
  buttons: [new uiLib.Button({
    label: 'Save', callback: () => {
      formContext.getAttribute('name').setValue(modal.getFieldValue('name'));
      return true;
    }, setFocus: true, id: 'saveBtn'
  })]
});
```

### Web API Create

```javascript
new uiLib.Button({
  label: 'Create', callback: async function() {
    modal.setLoading(true, 'Creating...');
    try {
      await Xrm.WebApi.createRecord('contact', {
        firstname: modal.getFieldValue('firstname'),
        lastname: modal.getFieldValue('lastname')
      });
      uiLib.Toast.success({ title: 'Created' });
      return true;
    } catch (e) {
      uiLib.Toast.error({ title: 'Error', message: e.message });
      modal.setLoading(false);
      return false;
    }
  }, setFocus: true, requiresValidation: true, id: 'createBtn'
})
```

### Batch Update with Progress

```javascript
for (let i = 0; i < records.length; i++) {
  modal.setLoading(true, {
    message: `Updating ${i + 1}/${records.length}...`,
    progress: ((i + 1) / records.length) * 100
  });
  await Xrm.WebApi.updateRecord('account', records[i], { statuscode: 1 });
}
modal.setLoading(false);
```

---

## Conditional Visibility

```javascript
fields: [
  { id: 'type', type: 'select', options: ['Business', 'Individual'] },
  {
    id: 'companyName', type: 'text',
    visibleWhen: { field: 'type', operator: 'equals', value: 'Business' }
  },
  { id: 'allowMarketing', type: 'switch' },
  {
    id: 'email', type: 'email',
    visibleWhen: { field: 'allowMarketing', operator: 'truthy' }
  }
]
```

---

## Select Field Display Modes

```javascript
// Standard dropdown
{ id: 'country', type: 'select', options: ['USA', 'Canada', 'UK'] }

// Object options
{ id: 'status', type: 'select', options: [{ label: 'Draft', value: 'draft' }, ...] }

// Badges (pill buttons)
{ id: 'priority', type: 'select', displayMode: 'badges', options: ['Low', 'Medium', 'High'] }

// D365 option set auto-fetch
{ id: 'industry', type: 'select', optionSet: { entityName: 'account', attributeName: 'industrycode', includeNull: true, sortByLabel: true } }
```

---

## Lookup Fields

```javascript
// Inline dropdown lookup (in modal field)
{
  id: 'account', type: 'lookup',
  entityName: 'account',
  entityDisplayName: 'Account',  // Optional — auto-fetched from D365 metadata
  lookupColumns: ['name', 'accountnumber'],
  filters: 'statecode eq 0',
  placeholder: 'Search...',
  required: true
}
// Returns: { id, name, subtitle, entityType, record } | null

// Full modal lookup
new uiLib.Lookup({
  entity: 'account',
  tableColumns: [
    { id: 'name', header: 'Name', sortable: true, elastic: true },
    { id: 'telephone1', header: 'Phone', width: '150px' }
  ],
  multiSelect: true,
  onSelect: (records) => { /* records array */ }
}).show();

// With message and content
new uiLib.Lookup({
  entity: 'account',
  tableColumns: [
    { id: 'name', header: 'Name', sortable: true, elastic: true }
  ],
  message: 'Select the parent account for this contact.',
  content: '<p>Only <strong>active</strong> accounts are shown.</p>',
  onSelect: (records) => { /* records array */ }
}).show();

// With viewport-relative sizing
new uiLib.Lookup({
  entity: 'account',
  tableColumns: [
    { id: 'name', header: 'Name', sortable: true, elastic: true },
    { id: 'telephone1', header: 'Phone', width: '150px' }
  ],
  width: '80vw',
  height: '70vh',
  onSelect: (records) => { /* records array */ }
}).show();

// With preFilters (option set + lookup)
new uiLib.Lookup({
  entity: 'opportunity',
  tableColumns: [
    { id: 'name', header: 'Opportunity', sortable: true, elastic: true },
    { id: 'estimatedvalue', header: 'Est. Value', format: 'currency', align: 'right', width: '140px' }
  ],
  preFilters: [
    { type: 'optionset', attribute: 'statecode', label: 'Status' },
    { type: 'select', attribute: 'prioritycode', label: 'Priority',
      options: [{ label: 'High', value: '1' }, { label: 'Normal', value: '2' }] },
    { type: 'lookup', attribute: 'parentaccountid', label: 'Account',
      entityName: 'account', lookupColumns: ['name'] }
  ],
  onSelect: (records) => { /* records array */ }
}).show();

// With per-column format overrides — wins over D365 metadata.
// Use when metadata is missing/wrong, or to force a Decimal as currency/percent,
// or to render a Boolean as a check icon instead of a Switch.
new uiLib.Lookup({
  entity: 'product',
  tableColumns: [
    { id: 'name', header: 'Product Name', sortable: true, elastic: true },
    { id: 'hnc_fx_basecostex', header: 'Base Cost Ex', format: 'currency', align: 'right', width: '140px' },
    { id: 'hnc_localcorerange', header: 'Core Range', format: 'percent', align: 'right', width: '120px' },
    { id: 'hnc_corestocked', header: 'Core Stocked', format: 'boolean-check', width: '120px' }
  ],
  onSelect: (records) => { /* records array */ }
}).show();
```

**TableColumn shape:** `{ id, header, visible?, sortable?, width?, minWidth?, elastic?, align?, format? }`.
The `format` property accepts: `currency`, `percent`, `number`, `decimal`, `integer`,
`date`, `datetime`, `boolean`, `boolean-check`, `badge`, `text` (type `TableColumnFormat`).
See `FIELD_TYPES.md` and `API_REFERENCE.md` for the full table.

---

## Table Fields

```javascript
{
  id: 'products', type: 'table',
  tableColumns: [
    { id: 'name', header: 'Product', visible: true, sortable: true, elastic: true },
    { id: 'price', header: 'Price', visible: true, sortable: true, align: 'right', format: 'currency', width: '140px' }
  ],
  data: [
    { id: 1, name: 'Product A', price: 100 },
    { id: 2, name: 'Product B', price: 200 }
  ],
  selectionMode: 'multiple',
  onRowSelect: (rows) => { console.debug(rows); },
  isRowSelectable: (row) => row.status === 'Active'
}
// Column format options: 'currency', 'number', 'percent', 'date'
// Update: modal.setFieldValue('products', newDataArray)
```

---

## File Upload

```javascript
{
  id: 'docs', type: 'file', required: true,
  fileUpload: {
    accept: '.pdf,.doc,.docx',
    maxFiles: 10, maxSize: 10485760,
    multiple: true, showFileList: true,
    dragDropText: 'Drag files here',
    onFilesSelected: (files) => { console.debug(files); }
  }
}
// Value: modal.getFieldValue('docs') → File[]
```

---

## Modal Options Reference

```javascript
new uiLib.Modal({
  id: 'myModal', title: 'Title',
  message: 'Text', content: '<div>HTML</div>',
  icon: 'INFO',  // INFO | SUCCESS | WARNING | ERROR | QUESTION
  size: 'medium',  // small | medium | large | fullscreen | { width, height }
  width: 800, height: 600,
  draggable: true,
  allowDismiss: false,     // Click outside to close
  allowEscapeClose: true,  // Escape key to close
  buttonAlignment: 'right',  // left | center | right | space-between
  autoSave: true, autoSaveKey: 'myForm',
  debug: true,
  progress: { ... },       // Wizard config
  sideCart: { enabled: true, position: 'right', width: 300, content: '<div>...</div>' },
  fields: [...], buttons: [...]
});
```

---

## Reference Files (Extended Documentation)

For detailed API reference, field type configurations, integration patterns, and architecture:

| File | Contents |
|------|----------|
| `SKILL.md` | Skill overview, critical rules, quick examples |
| `modalandmore-api-reference.md` | Complete API: all classes, methods, properties, return types |
| `modalandmore-field-types.md` | Every field type with full config, examples, and value shapes |
| `modalandmore-patterns.md` | D365 integration patterns, real-world recipes |
| `modalandmore-architecture.md` | Internal structure, build system, dev workflow |
