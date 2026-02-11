# UI Library for Dynamics 365 - Quick Reference

## Namespace
- **Primary:** `window.uiLib`
- **Backward Compatible:** `window.err403`
- Both point to the same object

## Initialization

```javascript
// In D365 Form OnLoad event
function onFormLoad(executionContext) {
  const health = uiLib.init(executionContext);
  
  if (!health.loaded || !health.cssLoaded) {
    console.error('Library failed to load properly');
    return;
  }
  
  // Health state properties:
  // - loaded: Boolean
  // - cssLoaded: Boolean
  // - inWindow: Boolean
  // - version: String
  // - timestamp: String
  // - instance: Object
}
```

## Toast Notifications

```javascript
// Success, error, warning, info
uiLib.Toast.success({ title: 'Saved!', message: 'Record updated', sound: true });
uiLib.Toast.error({ title: 'Error', message: 'Failed to save' });
uiLib.Toast.warn({ title: 'Warning', message: 'Check fields' });
uiLib.Toast.info({ title: 'Info', message: 'Processing...' });
```

## Modal Dialogs

### Simple Alerts & Confirms
```javascript
uiLib.Modal.alert('Title', 'Message').then(() => { /* closed */ });
uiLib.Modal.confirm('Title', 'Question?').then(confirmed => { /* true/false */ });
```

### Form Modal
```javascript
const modal = new uiLib.Modal({
  title: 'Create Record',
  size: 'medium',
  fields: [
    { id: 'name', label: 'Name', type: 'text', required: true },
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] }
  ],
  buttons: [
    new uiLib.ModalButton('Cancel', () => {}),
    new uiLib.ModalButton('Submit', () => {
      const data = modal.getFieldValues();
      // Process data...
      return true; // Close modal
    }, true)
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
  extraAttributes: { min: 0, max: 100, step: 5 }}
```

### Textarea
```javascript
{ id: 'notes', type: 'textarea', label: 'Notes', rows: 5 }
```

### Date Picker
```javascript
{ id: 'startdate', type: 'date', label: 'Start Date', value: new Date() }
```

### Dropdown
```javascript
// Simple options
{ id: 'status', type: 'select', label: 'Status', 
  options: ['Draft', 'Active', 'Inactive'] }

// Label/value pairs
{ id: 'priority', type: 'select', label: 'Priority',
  options: [
    { label: 'High', value: '1' },
    { label: 'Medium', value: '2' },
    { label: 'Low', value: '3' }
  ]}

// Badge display mode
{ id: 'status', type: 'select', label: 'Status',
  options: ['Draft', 'Active', 'Inactive'],
  displayMode: 'badges' }

// Auto-fetch from D365 Option Set
{ id: 'industrycode', type: 'select',
  optionSet: {
    entityName: 'account',
    attributeName: 'industrycode',
    includeNull: true,
    sortByLabel: true
  }}
```

### Boolean Fields
```javascript
// Checkbox (D365 native style)
{ id: 'acceptTerms', type: 'checkbox', label: 'Accept Terms', value: false }

// Switch (modern toggle)
{ id: 'enableNotifications', type: 'switch', label: 'Enable Notifications', value: true }
```

### Lookup (Inline Dropdown)
```javascript
{ id: 'accountLookup', type: 'lookup', label: 'Account',
  entityName: 'account',
  lookupColumns: ['name', 'accountnumber'],
  filters: "statecode eq 0",
  placeholder: 'Search accounts...' }
```

### Table (Data Grid)
```javascript
// Using Table class
new uiLib.Table({
  id: 'productsTable',
  label: 'Products',
  tableColumns: [
    { id: 'product', header: 'Product Name', visible: true, sortable: true, width: '250px' },
    { id: 'price', header: 'Price', visible: true, sortable: true, width: '120px' }
  ],
  data: [
    { id: 1, product: 'Product A', price: 100 },
    { id: 2, product: 'Product B', price: 200 }
  ],
  selectionMode: 'multiple',
  onRowSelect: (rows) => { console.debug(rows); }
})

// Or inline config
{ id: 'productsTable', type: 'table', label: 'Products',
  tableColumns: [...],
  data: [...],
  selectionMode: 'single' }

// Update table dynamically
modal.setFieldValue('productsTable', newDataArray);

// Table cells support HTML rendering
const styledData = [
  { 
    id: 1, 
    product: 'Product A', 
    price: '<span style="color: #388e3c;">↓ $99.00</span>' 
  },
  { 
    id: 2, 
    product: 'Product B', 
    price: '<span style="color: #d32f2f;">↑ $205.00</span>' 
  }
];
modal.setFieldValue('productsTable', styledData);
```

### Address Lookup
```javascript
{ id: 'address', type: 'addressLookup', label: 'Address',
  addressLookup: {
    provider: 'google', // or 'azure'
    apiKey: 'YOUR_API_KEY',
    placeholder: 'Start typing...',
    componentRestrictions: { country: ['nz', 'au'] },
    fields: {
      street: 'street',
      city: 'city',
      state: 'state',
      postalCode: 'zip',
      country: 'country'
    },
    onSelect: (address) => {
      console.debug('Selected:', address.formattedAddress);
    }
  }}
```

### File Upload
```javascript
// Document upload with validation
{ id: 'attachments', type: 'file', label: 'Upload Documents',
  required: true,
  fileUpload: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx',  // File type filter
    maxFiles: 10,                          // Max files allowed
    maxSize: 10485760,                     // 10MB per file
    multiple: true,                        // Allow multiple
    showFileList: true,                    // Show selected files
    dragDropText: 'Drag and drop files here',
    browseText: 'or click to browse',
    onFilesSelected: (files) => {
      console.debug('Selected:', files.map(f => f.name));
    }
  }}

// Image upload only
{ id: 'photos', type: 'file', label: 'Product Photos',
  fileUpload: {
    accept: 'image/*',
    maxFiles: 5,
    maxSize: 5242880  // 5MB
  }}

// Get uploaded files
const files = modal.getFieldValue('attachments');
files.forEach(file => {
  console.debug(`${file.name} - ${file.size} bytes`);
  // Upload file using FormData, XHR, fetch, etc.
});
```

### Custom HTML
```javascript
{ id: 'custom', type: 'custom', label: 'Custom Content',
  render: () => '<div>Custom HTML content</div>' }
```

## Conditional Visibility

```javascript
fields: [
  { id: 'accountType', label: 'Account Type', type: 'select',
    options: ['Business', 'Individual'] },
  
  // Only show when accountType is 'Business'
  { id: 'companyName', label: 'Company Name', type: 'text',
    visibleWhen: { field: 'accountType', operator: 'equals', value: 'Business' }},
  
  // Show when switch is on
  { id: 'allowMarketing', label: 'Allow Marketing', type: 'switch' },
  { id: 'email', label: 'Email', type: 'email',
    visibleWhen: { field: 'allowMarketing', operator: 'truthy' }}
]

// Operators: equals, notEquals, contains, greaterThan, lessThan, truthy, falsy
```

## Conditional Required

```javascript
fields: [
  { id: 'contactMethod', label: 'Contact Method', type: 'select',
    options: ['Email', 'Phone', 'Mail'], required: true },
  
  // Email required only if contact method is Email
  { id: 'email', label: 'Email', type: 'email',
    requiredWhen: { field: 'contactMethod', operator: 'equals', value: 'Email' }},
  
  // Phone required only if contact method is Phone
  { id: 'phone', label: 'Phone', type: 'tel',
    requiredWhen: { field: 'contactMethod', operator: 'equals', value: 'Phone' }}
]
```

## Wizard Steps

```javascript
const wizard = new uiLib.Modal({
  title: 'Setup Wizard',
  progress: {
    enabled: true,
    currentStep: 1,
    allowStepNavigation: true,
    steps: [
      { id: 'step1', label: 'Account Info', fields: [
        { id: 'name', type: 'text', label: 'Name', required: true }
      ]},
      { id: 'step2', label: 'Preferences', fields: [
        { id: 'theme', type: 'select', label: 'Theme', options: ['Light', 'Dark'] }
      ]},
      { id: 'step3', label: 'Review', fields: [
        { id: 'confirm', type: 'checkbox', label: 'Confirm', required: true }
      ]}
    ]
  },
  buttons: [
    new uiLib.ModalButton('Previous', () => { wizard.previousStep(); return false; }),
    new uiLib.ModalButton('Next', () => { wizard.nextStep(); return false; }),
    new uiLib.ModalButton('Finish', () => { /* submit */ }, true)
  ]
});
wizard.show();

// Step indicators:
// - Blue circle with number = current step
// - Green circle with checkmark = completed steps with all required fields filled
// - Red circle with exclamation = completed steps with missing required fields
// - Gray circle with number = pending steps
```

## Lookup Dialog

```javascript
// Full-screen lookup modal
new uiLib.Lookup({
  entityName: 'account',
  multiple: true,
  columns: ['name', 'telephone1', 'emailaddress1'],
  filters: "statecode eq 0",
  onSelect: (records) => {
    console.debug('Selected records:', records);
  }
}).show();
```

## D365 Integration Scenarios

### Form OnLoad
```javascript
function onFormLoad(executionContext) {
  const health = uiLib.init(executionContext);
  if (!health.loaded) return;
  
  const formContext = executionContext.getFormContext();
  uiLib.Toast.success({ message: 'Form loaded' });
}
```

### Field OnChange
```javascript
function onFieldChange(executionContext) {
  const formContext = executionContext.getFormContext();
  const value = formContext.getAttribute('fieldname').getValue();
  
  uiLib.Toast.info({ message: `Value: ${value}` });
}
```

### Ribbon Button
```javascript
function onRibbonClick() {
  // No executionContext in ribbon
  uiLib.Modal.confirm('Action', 'Perform action?').then(confirmed => {
    if (confirmed) performAction();
  });
}
```

### Web Resource Iframe
```javascript
// Custom HTML page embedded in form
if (typeof uiLib !== 'undefined') {
  // Auto-assigned from parent window
  uiLib.Toast.success({ message: 'Web resource loaded' });
}
```

## Troubleshooting

### Library Not Found
```javascript
if (typeof uiLib === 'undefined') {
  console.error('Library not loaded. Check form libraries.');
  return;
}
```

### CSS Not Loading
```javascript
const health = uiLib.init(executionContext);
if (!health.cssLoaded) {
  console.error('CSS failed to load. Check web resources.');
}
```

### Modal Not Showing
```javascript
// Test with simple alert
try {
  uiLib.Modal.alert('Test', 'Message');
} catch (error) {
  console.error('Modal error:', error);
}
```

## Helper Methods

```javascript
// Get field value
const value = modal.getFieldValue('fieldId');

// Set field value
modal.setFieldValue('fieldId', newValue);

// Get all field values
const allValues = modal.getFieldValues();

// Validate all fields
const isValid = modal.validateAllFields();

// Wizard navigation
wizard.nextStep();
wizard.previousStep();
wizard.goToStep(2);

// Button manipulation (chainable methods)
// Use IDs for reliable identification
modal.getButton('submitBtn').setLabel('Processing...').disable();
modal.getButton('submitBtn').setLabel('Save').enable();
modal.getButton('cancelBtn').hide();

// Auto-generated IDs (lowercase label, spaces removed)
modal.getButton('save').disable();      // Label: 'Save' → ID: 'save'
modal.getButton('submitform').hide();   // Label: 'Submit Form' → ID: 'submitform'
modal.getButton(0).show();              // by index (less reliable)

// Available chainable methods:
// .setLabel(text) - Change button text
// .setDisabled(bool) - Enable/disable button
// .setVisible(bool) - Show/hide button
// .enable() - Enable button (shorthand)
// .disable() - Disable button (shorthand)
// .show() - Show button (shorthand)
// .hide() - Hide button (shorthand)

// Loading state
modal.setLoading(true, 'Saving...');
modal.setLoading(false);
```

**Dynamic Button Example:**
```javascript
const modal = new uiLib.Modal({
  fields: [...],
  buttons: [
    new uiLib.ModalButton('Cancel', () => {}),  // Auto-ID: 'cancel'
    new uiLib.ModalButton('Save', async () => {  // Auto-ID: 'save'
      // Use auto-generated ID - survives label changes
      modal.getButton('save').setLabel('Saving...').disable();
      
      try {
        await saveData();
        return true; // Close modal
      } catch (error) {
        modal.getButton('save').setLabel('Save').enable();
        return false; // Keep open
      }
    }, true)
    // Or provide explicit ID: new uiLib.ModalButton('Save', ..., 'saveBtn')
  ]
});
```

## Version & Health

```javascript
const health = uiLib.init(executionContext);
console.debug('Version:', health.version);        // "2026.01.24.01"
console.debug('Loaded:', health.loaded);          // true
console.debug('CSS Loaded:', health.cssLoaded);   // true
console.debug('Timestamp:', health.timestamp);    // ISO timestamp
```

## Best Practices

1. ✅ Always call `uiLib.init()` before using components
2. ✅ Check health state to verify CSS loaded
3. ✅ Use safe check: `if (typeof uiLib !== 'undefined')`
4. ✅ Add library to form libraries (first in list)
5. ✅ Use conditional visibility (`visibleWhen`) for dynamic fields
6. ✅ Use conditional required (`requiredWhen`) for validation
7. ✅ Test with simple alert/toast before complex modals
8. ✅ Clear browser cache if components appear unstyled
9. ✅ Use wizard steps for multi-step forms
10. ✅ Update table data with `setFieldValue()` for reactive updates
