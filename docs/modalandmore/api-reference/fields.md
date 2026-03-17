---
title: Field Types
description: All available field types with configuration and examples
author: gareth-cheyne
category: dynamics-365-ce
---

# Field Types

Every field type available in modal forms, with configuration options and value shapes.

## Common Properties

All field types share these properties:

```javascript
{
  id: 'fieldId',              // Required — unique identifier
  label: 'Label',             // Display label
  type: 'text',               // Field type
  value: 'initial',           // Initial value
  placeholder: 'Hint...',     // Placeholder text
  required: true,             // Required validation
  disabled: false,            // Disable field
  orientation: 'horizontal',  // horizontal (default) | vertical

  // Conditional behavior
  visibleWhen: { field: 'x', operator: 'equals', value: 'y' },
  requiredWhen: { field: 'x', operator: 'truthy' },

  // Change callback
  onChange: (value) => { console.debug(value); }
}
```

## Text Inputs

```javascript
{ id: 'name', type: 'text', label: 'Name', placeholder: 'Enter name' }
{ id: 'email', type: 'email', label: 'Email' }
{ id: 'phone', type: 'tel', label: 'Phone' }
{ id: 'pass', type: 'password', label: 'Password' }
{ id: 'site', type: 'url', label: 'Website' }
{ id: 'q', type: 'search', label: 'Search' }
```

**Value type:** `string`

## Number

```javascript
{ id: 'qty', type: 'number', label: 'Quantity', value: 1,
  extraAttributes: { min: 1, max: 100, step: 1 } }
```

**Value type:** `number`

## Textarea

```javascript
{ id: 'notes', type: 'textarea', label: 'Notes', rows: 4 }
```

**Value type:** `string`

## Date

```javascript
{ id: 'start', type: 'date', label: 'Start Date', value: new Date() }
```

**Value type:** `Date | null`

## Select / Dropdown

```javascript
// Simple string options
{ id: 'status', type: 'select', options: ['Draft', 'Active', 'Inactive'] }

// Label/value pairs
{ id: 'priority', type: 'select', options: [
    { label: 'High', value: '1' },
    { label: 'Low', value: '3' }
  ] }

// Badge display mode (pill-style buttons)
{ id: 'priority', type: 'select', displayMode: 'badges',
  options: ['Low', 'Medium', 'High'], value: 'Medium' }

// D365 option set auto-fetch
{ id: 'industry', type: 'select', optionSet: {
    entityName: 'account', attributeName: 'industrycode',
    includeNull: true, sortByLabel: true
  } }
```

**Value type:** `string`

## Checkbox

```javascript
{ id: 'terms', type: 'checkbox', label: 'Accept Terms', value: false }
```

**Value type:** `boolean`

## Switch

```javascript
{ id: 'active', type: 'switch', label: 'Active', value: true }
```

**Value type:** `boolean`

## Range / Slider

```javascript
{ id: 'rating', type: 'range', label: 'Rating', value: 50,
  showValue: true,
  extraAttributes: { min: 0, max: 100, step: 5 } }
```

**Value type:** `number`

## Lookup

Inline D365-style dropdown search:

```javascript
{
  id: 'account', type: 'lookup',
  entityName: 'account',
  entityDisplayName: 'Account',  // Optional — auto-fetched from D365 metadata
  lookupColumns: ['name', 'accountnumber'],
  filters: 'statecode eq 0',
  placeholder: 'Search accounts...',
  required: true
}

// With labeled columns
{
  id: 'address', type: 'lookup',
  entityName: 'customeraddress',
  lookupColumns: [
    { attribute: 'line1', label: 'Address' },
    { attribute: 'city', label: 'City' }
  ]
}
```

**Value type:** `{ id, name, subtitle, entityType, record } | null`

## Table

```javascript
{
  id: 'products', type: 'table', label: 'Products',
  tableColumns: [
    { id: 'name', header: 'Product', visible: true, sortable: true, width: '250px' },
    { id: 'price', header: 'Price', visible: true, sortable: true, align: 'right', format: 'currency' },
    { id: 'units', header: 'Units', visible: true, format: 'number' },
    { id: 'margin', header: 'Margin', visible: true, format: 'percent' },
    { id: 'date', header: 'Date', visible: true, format: 'date' }
  ],
  data: [
    { id: 1, name: 'Product A', price: 100, units: 50, margin: 0.25, date: '2026-01-15' }
  ],
  selectionMode: 'multiple',  // none | single | multiple
  onRowSelect: (rows) => { console.debug(rows); },
  isRowSelectable: (row) => row.status === 'Active'
}
```

**Column format options:** `currency`, `number`, `percent`, `date`

Update dynamically: `modal.setFieldValue('products', newDataArray)`

## File Upload

```javascript
{
  id: 'docs', type: 'file', required: true,
  fileUpload: {
    accept: '.pdf,.doc,.docx',
    maxFiles: 10,
    maxSize: 10485760,  // 10MB
    multiple: true,
    showFileList: true,
    dragDropText: 'Drag files here',
    browseText: 'or click to browse',
    onFilesSelected: (files) => { console.debug(files); }
  }
}
```

**Value type:** `File[]`

## Address Lookup

```javascript
{
  id: 'address', type: 'addressLookup',
  addressLookup: {
    provider: 'google',  // or 'azure'
    apiKey: 'YOUR_API_KEY',
    placeholder: 'Start typing...',
    componentRestrictions: { country: ['nz', 'au'] },
    fields: { street: 'street', city: 'city', state: 'state', postalCode: 'zip', country: 'country' },
    onSelect: (address) => { console.debug(address.formattedAddress); }
  }
}
```

**Value type:** `{ formattedAddress, street, city, state, postalCode, country, latitude, longitude }`

## Field Group

```javascript
{
  id: 'personalInfo', type: 'group',
  label: 'Personal Information',
  content: 'Enter basic details below.',
  border: true,
  collapsible: true,
  defaultCollapsed: false,
  fields: [
    { id: 'firstName', type: 'text', label: 'First Name', required: true },
    { id: 'lastName', type: 'text', label: 'Last Name', required: true }
  ]
}
```

## Custom

```javascript
// HTML string
{ id: 'summary', type: 'custom', html: '<div>Custom HTML content</div>' }

// Render function
{ id: 'chart', type: 'custom', render: () => document.createElement('canvas') }
```
