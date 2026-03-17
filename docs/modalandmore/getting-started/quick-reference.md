---
title: Quick Reference
excerpt: Compact API cheat sheet for the most common uiLib operations
---

# Quick Reference

## Namespace

- **Primary:** `window.uiLib`
- **Backward Compatible:** `window.err403`

## Initialization

```javascript
function onFormLoad(executionContext) {
  const health = uiLib.init(executionContext);

  if (!health.loaded || !health.cssLoaded) {
    console.error('Library failed to load properly');
    return;
  }

  // health: { loaded, cssLoaded, inWindow, version, timestamp, instance }
}
```

## Toast Notifications

```javascript
uiLib.Toast.success({ title: 'Saved!', message: 'Record updated', sound: true });
uiLib.Toast.error({ title: 'Error', message: 'Failed to save' });
uiLib.Toast.warn({ title: 'Warning', message: 'Check fields' });
uiLib.Toast.info({ title: 'Info', message: 'Processing...' });

// Manual dismiss
const t = uiLib.Toast.info({ title: 'Working...', duration: 0 });
t.close();
```

## Modal — Alerts & Confirms

```javascript
await uiLib.Modal.alert('Title', 'Message');
const confirmed = await uiLib.Modal.confirm('Title', 'Question?');

// With icons (ModalHelpers)
await uiLib.ModalHelpers.alert('Success!', '<b>Saved</b>', 'success');
const yes = await uiLib.ModalHelpers.confirm('Delete?', 'Sure?', 'warning');
```

## Modal — Form

```javascript
const modal = new uiLib.Modal({
  title: 'Create Record',
  fields: [
    { id: 'name', label: 'Name', type: 'text', required: true },
    { id: 'email', label: 'Email', type: 'email' },
    { id: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
  ],
  buttons: [
    new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
    new uiLib.Button({
      label: 'Save',
      callback: () => {
        const data = modal.getFieldValues();
        return true; // close modal
      },
      setFocus: true,
      requiresValidation: true,
      id: 'saveBtn'
    })
  ]
});
modal.show();
```

## Field Types

### Text Inputs

```javascript
{ id: 'name', type: 'text', label: 'Name', placeholder: 'Enter...' }
{ id: 'email', type: 'email', label: 'Email', required: true }
{ id: 'phone', type: 'tel', label: 'Phone' }
{ id: 'password', type: 'password', label: 'Password' }
{ id: 'url', type: 'url', label: 'Website' }
{ id: 'search', type: 'search', label: 'Search' }
```

### Number & Range

```javascript
{ id: 'age', type: 'number', label: 'Age', value: 25 }
{ id: 'rating', type: 'range', label: 'Rating', value: 75, showValue: true,
  extraAttributes: { min: 0, max: 100, step: 5 } }
```

### Textarea & Date

```javascript
{ id: 'notes', type: 'textarea', label: 'Notes', rows: 5 }
{ id: 'startdate', type: 'date', label: 'Start Date', value: new Date() }
```

### Select / Dropdown

```javascript
// Simple options
{ id: 'status', type: 'select', options: ['Draft', 'Active', 'Inactive'] }

// Label/value pairs
{ id: 'priority', type: 'select', options: [
    { label: 'High', value: '1' },
    { label: 'Medium', value: '2' },
    { label: 'Low', value: '3' }
  ] }

// Badge display mode
{ id: 'status', type: 'select', displayMode: 'badges', options: ['Draft', 'Active'] }

// D365 option set auto-fetch
{ id: 'industry', type: 'select', optionSet: {
    entityName: 'account', attributeName: 'industrycode',
    includeNull: true, sortByLabel: true
  } }
```

### Boolean Fields

```javascript
{ id: 'terms', type: 'checkbox', label: 'Accept Terms', value: false }
{ id: 'notify', type: 'switch', label: 'Enable Notifications', value: true }
```

### Lookup

```javascript
{ id: 'account', type: 'lookup', label: 'Account',
  entityName: 'account',
  lookupColumns: ['name', 'accountnumber'],
  filters: 'statecode eq 0',
  placeholder: 'Search accounts...' }
```

### Table

```javascript
{ id: 'products', type: 'table', label: 'Products',
  tableColumns: [
    { id: 'name', header: 'Product', visible: true, sortable: true, width: '250px' },
    { id: 'price', header: 'Price', visible: true, sortable: true, width: '120px', format: 'currency' }
  ],
  data: [
    { id: 1, name: 'Product A', price: 100 },
    { id: 2, name: 'Product B', price: 200 }
  ],
  selectionMode: 'multiple',
  onRowSelect: (rows) => { console.debug(rows); } }
```

## Conditional Visibility

```javascript
fields: [
  { id: 'type', type: 'select', options: ['Business', 'Individual'] },
  { id: 'company', type: 'text',
    visibleWhen: { field: 'type', operator: 'equals', value: 'Business' } },
  { id: 'allowMarketing', type: 'switch' },
  { id: 'email', type: 'email',
    visibleWhen: { field: 'allowMarketing', operator: 'truthy' } }
]
// Operators: equals, notEquals, contains, greaterThan, lessThan, truthy, falsy
```

## Wizard

```javascript
const wizard = new uiLib.Modal({
  title: 'Setup',
  progress: {
    enabled: true, currentStep: 1,
    steps: [
      { id: 's1', label: 'Info', fields: [...] },
      { id: 's2', label: 'Prefs', fields: [...] }
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

## Loading Overlay

```javascript
modal.setLoading(true, 'Processing...');                          // Spinner
modal.setLoading(true, { message: 'Importing...', progress: 45 }); // Progress bar
modal.setLoading(false);                                          // Hide
```

## Dynamic Updates

```javascript
modal.setFieldValue('status', 'Active');
modal.getFieldValue('status');
modal.getFieldValues();  // All values as object

modal.getButton('saveBtn').setLabel('Saving...').disable();
modal.getButton('saveBtn').setLabel('Save').enable();
```
