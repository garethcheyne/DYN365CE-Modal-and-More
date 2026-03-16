# Patterns & Examples

Real-world integration patterns for common D365 scenarios. Copy and adapt these templates.

---

## D365 Form Integration

### Form OnLoad — Initialize Library

```javascript
function onFormLoad(executionContext) {
  const health = uiLib.init(executionContext);
  if (!health.loaded) return;

  const formContext = executionContext.getFormContext();
  // Library is ready — use Toast, Modal, Lookup, etc.
}
```

### Field OnChange — React to Value Changes

```javascript
function onFieldChange(executionContext) {
  const formContext = executionContext.getFormContext();
  const value = formContext.getAttribute('fieldname').getValue();

  uiLib.Toast.info({ message: `Value changed to: ${value}` });
}
```

### Ribbon Command — No ExecutionContext

```javascript
function onRibbonClick() {
  uiLib.Modal.confirm('Action', 'Perform this action?').then(confirmed => {
    if (confirmed) performAction();
  });
}
```

### Web Resource (Custom HTML Page)

```javascript
// Inside a web resource iframe embedded in a D365 form
if (typeof uiLib !== 'undefined') {
  // Auto-assigned from parent window
  uiLib.Toast.success({ message: 'Web resource loaded' });
}
```

---

## Form Modal — Read/Write D365 Form Fields

```javascript
function showEditModal(executionContext) {
  const formContext = executionContext.getFormContext();

  const modal = new uiLib.Modal({
    title: 'Edit Account',
    fields: [
      { id: 'name', label: 'Account Name', type: 'text',
        value: formContext.getAttribute('name').getValue(), required: true },
      { id: 'phone', label: 'Phone', type: 'tel',
        value: formContext.getAttribute('telephone1').getValue() },
      { id: 'industry', label: 'Industry', type: 'select',
        optionSet: { entityName: 'account', attributeName: 'industrycode' },
        value: formContext.getAttribute('industrycode').getValue() }
    ],
    buttons: [
      new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
      new uiLib.Button({
        label: 'Save',
        callback: () => {
          formContext.getAttribute('name').setValue(modal.getFieldValue('name'));
          formContext.getAttribute('telephone1').setValue(modal.getFieldValue('phone'));
          formContext.getAttribute('industrycode').setValue(modal.getFieldValue('industry'));
          return true;
        },
        setFocus: true,
        requiresValidation: true,
        id: 'saveBtn'
      })
    ]
  });
  modal.show();
}
```

---

## Create Record via Web API

```javascript
async function createContact() {
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
        callback: async function () {
          const data = modal.getFieldValues();
          modal.setLoading(true, 'Creating contact...');

          try {
            await Xrm.WebApi.createRecord('contact', {
              firstname: data.firstname,
              lastname: data.lastname,
              emailaddress1: data.email
            });
            uiLib.Toast.success({ title: 'Success', message: 'Contact created' });
            return true;
          } catch (error) {
            uiLib.Toast.error({ title: 'Error', message: error.message });
            modal.setLoading(false);
            return false;
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

---

## Batch Update with Progress Bar

```javascript
async function batchUpdate(recordIds) {
  const modal = new uiLib.Modal({
    title: 'Batch Update',
    message: `Update ${recordIds.length} records?`,
    buttons: [
      new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
      new uiLib.Button({
        label: 'Update All',
        callback: async function () {
          for (let i = 0; i < recordIds.length; i++) {
            const percent = Math.round(((i + 1) / recordIds.length) * 100);
            modal.setLoading(true, {
              message: `Updating ${i + 1} of ${recordIds.length}...`,
              progress: percent
            });

            try {
              await Xrm.WebApi.updateRecord('account', recordIds[i], { statuscode: 1 });
            } catch (error) {
              uiLib.Toast.error({ message: `Failed: ${recordIds[i]}` });
            }
          }
          uiLib.Toast.success({ message: `Updated ${recordIds.length} records` });
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

---

## Conditional Visibility — Show/Hide Fields

```javascript
const modal = new uiLib.Modal({
  title: 'New Account',
  fields: [
    { id: 'accountType', label: 'Type', type: 'select',
      options: ['Business', 'Individual'] },

    // Only visible when type is 'Business'
    { id: 'companyName', label: 'Company', type: 'text',
      visibleWhen: { field: 'accountType', operator: 'equals', value: 'Business' } },

    // Toggle-controlled section
    { id: 'allowMarketing', label: 'Allow Marketing', type: 'switch' },
    { id: 'marketingEmail', label: 'Marketing Email', type: 'email',
      visibleWhen: { field: 'allowMarketing', operator: 'truthy' } }
  ],
  buttons: [
    new uiLib.Button({ label: 'Save', callback: () => true, setFocus: true, id: 'saveBtn' })
  ]
});
modal.show();
```

---

## Conditional Required — Dynamic Validation

```javascript
fields: [
  { id: 'contactMethod', label: 'Preferred Contact', type: 'select',
    options: ['Email', 'Phone', 'Mail'], required: true },

  { id: 'email', label: 'Email', type: 'email',
    requiredWhen: { field: 'contactMethod', operator: 'equals', value: 'Email' } },

  { id: 'phone', label: 'Phone', type: 'tel',
    requiredWhen: { field: 'contactMethod', operator: 'equals', value: 'Phone' } },

  { id: 'address', label: 'Address', type: 'text',
    requiredWhen: { field: 'contactMethod', operator: 'equals', value: 'Mail' } }
]
```

---

## Wizard — Multi-Step Form

```javascript
const wizard = new uiLib.Modal({
  title: 'Account Setup',
  message: 'Complete all steps to create your account.',  // Stays visible across steps
  progress: {
    enabled: true,
    currentStep: 1,
    allowStepNavigation: true,
    steps: [
      {
        id: 'info', label: 'Basic Info',
        message: 'Enter your account details.',
        fields: [
          { id: 'name', type: 'text', label: 'Name', required: true },
          { id: 'email', type: 'email', label: 'Email', required: true }
        ]
      },
      {
        id: 'prefs', label: 'Preferences',
        width: 700,  // Per-step sizing
        fields: [
          { id: 'theme', type: 'select', label: 'Theme', options: ['Light', 'Dark'] },
          { id: 'notifications', type: 'switch', label: 'Notifications', value: true }
        ]
      },
      {
        id: 'review', label: 'Review',
        message: 'Confirm your selections.',
        fields: [
          { id: 'confirm', type: 'checkbox', label: 'I confirm these details', required: true }
        ]
      }
    ]
  },
  buttons: [
    new uiLib.Button({ label: 'Back', callback: () => { wizard.previousStep(); return false; }, id: 'backBtn' }),
    new uiLib.Button({ label: 'Next', callback: () => { wizard.nextStep(); return false; },
      setFocus: true, requiresValidation: true, validateAllSteps: false, id: 'nextBtn' }),
    new uiLib.Button({ label: 'Finish', callback: () => {
      const data = wizard.getFieldValues();
      console.debug(data);
      return true;
    }, setFocus: true, requiresValidation: true, id: 'finishBtn' })
  ]
});
wizard.show();
```

---

## Dynamic Button State Changes

```javascript
const modal = new uiLib.Modal({
  title: 'Save Record',
  fields: [
    { id: 'name', label: 'Name', type: 'text', required: true }
  ],
  buttons: [
    new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
    new uiLib.Button({
      label: 'Save',
      callback: async function () {
        modal.getButton('saveBtn').setLabel('Saving...').disable();
        modal.getButton('cancelBtn').hide();

        try {
          await saveToServer(modal.getFieldValue('name'));
          uiLib.Toast.success({ message: 'Saved!' });
          return true;
        } catch (error) {
          uiLib.Toast.error({ message: error.message });
          modal.getButton('saveBtn').setLabel('Save').enable();
          modal.getButton('cancelBtn').show();
          return false;
        }
      },
      setFocus: true,
      id: 'saveBtn'
    })
  ]
});
modal.show();
```

---

## Cascading Lookups (Parent → Child)

```javascript
const modal = new uiLib.Modal({
  title: 'Select Contact',
  fields: [
    {
      id: 'account', label: 'Account', type: 'lookup',
      entityName: 'account',
      lookupColumns: ['name', 'accountnumber'],
      onChange: (value) => {
        if (value?.id) {
          // Contact filter will use selected account
          modal.setFieldValue('_accountFilter', value.id);
        }
      }
    },
    {
      id: '_accountFilter', type: 'text',
      visibleWhen: { field: '_never', operator: 'truthy' }  // Hidden helper field
    },
    {
      id: 'contact', label: 'Contact', type: 'lookup',
      entityName: 'contact',
      lookupColumns: ['fullname', 'emailaddress1'],
      filters: '_parentcustomerid_value eq ${accountId}',
      visibleWhen: { field: 'account', operator: 'truthy' }
    }
  ],
  buttons: [
    new uiLib.Button({ label: 'Select', callback: () => true, setFocus: true, id: 'selectBtn' })
  ]
});
modal.show();
```

---

## Tabs

```javascript
const modal = new uiLib.Modal({
  title: 'Record Details',
  fields: [{
    id: 'tabs', asTabs: true,
    fields: [
      {
        id: 'generalTab', label: 'General',
        content: '<p>General information about this record.</p>',
        fields: [
          { id: 'name', type: 'text', label: 'Name', required: true },
          { id: 'status', type: 'select', label: 'Status', options: ['Active', 'Inactive'] }
        ]
      },
      {
        id: 'detailsTab', label: 'Details',
        content: '<p>Additional details.</p>',
        fields: [
          { id: 'description', type: 'textarea', label: 'Description', rows: 5 },
          { id: 'notes', type: 'textarea', label: 'Notes', rows: 3 }
        ]
      }
    ]
  }],
  buttons: [
    new uiLib.Button({ label: 'Save', callback: () => true, setFocus: true, id: 'saveBtn' })
  ]
});
modal.show();
```

---

## Field Groups (Collapsible Sections)

```javascript
fields: [
  {
    id: 'personalGroup', type: 'group', label: 'Personal Information',
    content: 'Enter basic contact details.',
    fields: [
      { id: 'firstName', type: 'text', label: 'First Name', required: true },
      { id: 'lastName', type: 'text', label: 'Last Name', required: true },
      { id: 'email', type: 'email', label: 'Email' }
    ]
  },
  {
    id: 'addressGroup', type: 'group', label: 'Address', border: true,
    fields: [
      { id: 'street', type: 'text', label: 'Street' },
      { id: 'city', type: 'text', label: 'City' },
      { id: 'zip', type: 'text', label: 'Postal Code' }
    ]
  },
  {
    id: 'advancedGroup', type: 'group', label: 'Advanced',
    border: true, collapsible: true, defaultCollapsed: true,
    fields: [
      { id: 'tags', type: 'text', label: 'Tags' },
      { id: 'internalNotes', type: 'textarea', label: 'Internal Notes', rows: 3 }
    ]
  }
]
```

---

## Table with Column Formatting

```javascript
{ id: 'salesTable', type: 'table', label: 'Sales Report',
  tableColumns: [
    { id: 'product', header: 'Product', visible: true, sortable: true, width: '250px' },
    { id: 'revenue', header: 'Revenue', visible: true, sortable: true, align: 'right', format: 'currency' },
    { id: 'units', header: 'Units', visible: true, sortable: true, align: 'right', format: 'number' },
    { id: 'margin', header: 'Margin', visible: true, sortable: true, align: 'right', format: 'percent' },
    { id: 'saleDate', header: 'Date', visible: true, sortable: true, format: 'date' }
  ],
  data: [
    { id: 1, product: 'Product A', revenue: 15234.89, units: 523, margin: 0.3245, saleDate: '2026-02-11' },
    { id: 2, product: 'Product B', revenue: 8920.50, units: 1240, margin: 0.4512, saleDate: new Date() }
  ],
  selectionMode: 'single' }
```

---

## Table with HTML-Rendered Cells

```javascript
modal.setFieldValue('productsTable', [
  { id: 1, product: 'Product A',
    price: '<span style="color: #388e3c; font-weight: 600;">↓ $99.00</span>',
    status: '<span style="color: #1976d2;">Active</span>' },
  { id: 2, product: 'Product B',
    price: '<span style="color: #d32f2f; font-weight: 600;">↑ $205.00</span>',
    status: '<span style="color: #f57c00;">Pending</span>' }
]);
```

---

## File Upload

```javascript
{ id: 'documents', type: 'file', label: 'Upload Documents', required: true,
  fileUpload: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    maxFiles: 10,
    maxSize: 10485760,    // 10MB
    multiple: true,
    showFileList: true
  } }

// Later — read uploaded files
const files = modal.getFieldValue('documents');
files.forEach(file => {
  const formData = new FormData();
  formData.append('file', file);
  // Upload via fetch/XHR
});
```

---

## Styled JSON Output in Alert

```javascript
const formatJsonWithStyle = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  const highlighted = json
    .replace(/"([^"]+)":/g, '<span style="color: #0078d4; font-weight: bold;">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span style="color: #107c10;">"$1"</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span style="color: #ca5010;">$1</span>')
    .replace(/: (true|false)/g, ': <span style="color: #8764b8;">$1</span>')
    .replace(/: null/g, ': <span style="color: #605e5c;">null</span>');
  return `<pre style="background: #f3f2f1; padding: 20px; border-radius: 6px; overflow: auto; max-height: 500px;">${highlighted}</pre>`;
};

uiLib.ModalHelpers.alert('Form Data', formatJsonWithStyle(data));
```

---

## Error Handling Pattern

```javascript
async function safeWebApiCall(operation) {
  try {
    return await operation();
  } catch (error) {
    if (error.message?.includes('0x80040216')) {
      uiLib.Toast.error({ title: 'Duplicate', message: 'Record already exists' });
    } else if (error.message?.includes('0x80040220')) {
      uiLib.Toast.error({ title: 'Permission', message: 'Access denied' });
    } else if (error.message?.includes('0x80048306')) {
      uiLib.Toast.error({ title: 'Required', message: 'Missing required fields' });
    } else {
      uiLib.Toast.error({ title: 'Error', message: error.message || 'Unknown error' });
    }
    throw error;
  }
}

// Usage
try {
  await safeWebApiCall(() => Xrm.WebApi.createRecord('contact', data));
} catch { /* Toast already shown */ }
```

---

## Auto-Validation Buttons

```javascript
// Submit button is auto-disabled until all required fields are filled
new uiLib.Button({
  label: 'Submit',
  callback: () => {
    // No manual validation needed — button only enabled when valid
    return true;
  },
  setFocus: true,
  requiresValidation: true,
  id: 'submitBtn'
})
```

---

## Loading Overlay — Multi-Step Process

```javascript
modal.setLoading(true, { message: 'Step 1: Validating...', progress: 25 });
await validate();

modal.setLoading(true, { message: 'Step 2: Processing...', progress: 50 });
await process();

modal.setLoading(true, { message: 'Step 3: Saving...', progress: 75 });
await save();

modal.setLoading(true, { message: 'Complete!', progress: 100 });
await delay(500);
modal.setLoading(false);
```

---

## Embed Web Resource in Modal

```javascript
const modal = new uiLib.Modal({
  title: 'Product History',
  buttons: [new uiLib.Button({ label: 'Close', callback: () => true, id: 'closeBtn' })]
});
modal.show();
modal.showWebResource('err403_/datagrid.htm?data=ProductHistory&id=123', {
  autoResize: true,
  width: 800,
  height: 600
});
```
