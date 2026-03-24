---
title: Lookup
excerpt: Record selection with search, filter, sort, and multi-select
author: gareth-cheyne
category: dynamics-365-ce
---

# Lookup

Two lookup options are available: inline dropdown lookups embedded in modal fields, and full modal dialog lookups with a data table.

## Inline Dropdown Lookup

Use as a field type in modals. Provides a D365-native style search dropdown:

```javascript
new uiLib.Modal({
  fields: [
    {
      id: 'accountLookup',
      label: 'Account',
      type: 'lookup',
      entityName: 'account',
      entityDisplayName: 'Account',  // Optional — auto-fetched from D365 metadata
      lookupColumns: ['name', 'accountnumber'],
      filters: 'statecode eq 0',
      placeholder: 'Search accounts...',
      required: true
    }
  ]
});
```

### Column Display

```javascript
// Values only (no labels)
lookupColumns: ['name', 'accountnumber']
// → "Contoso Ltd" (bold), "ACC-001" (gray subtitle)

// With labels — shows "Label: value"
lookupColumns: [
  { attribute: 'line1', label: 'Address' },
  { attribute: 'city', label: 'City' }
]
// → "Address: 123 Main St" (bold), "City: Auckland" (gray)
```

- First column = primary text (bold, 14px)
- Second column = subtitle (gray, 12px)
- Additional columns = fetched but not shown in dropdown

### D365 Lookup Prefill

```javascript
// Prefill from D365 form attribute
const ownerLookup = formContext.getAttribute('ownerid')?.getValue();

new uiLib.Modal({
  fields: [{
    id: 'salesperson',
    type: 'lookup',
    entityName: 'systemuser',
    lookupColumns: ['fullname', 'internalemailaddress'],
    value: ownerLookup  // Native D365 array is supported
  }]
});

// Runtime update
modal.setFieldValue('salesperson', formContext.getAttribute('new_approverid')?.getValue());
```

### Polymorphic Lookups (Multi-Entity)

Inline lookup supports one entity at a time. For Customer-type fields (Account OR Contact), use conditional visibility:

```javascript
fields: [
  { id: 'customerType', type: 'select', options: ['Account', 'Contact'] },
  {
    id: 'accountLookup', type: 'lookup', entityName: 'account',
    lookupColumns: ['name'],
    visibleWhen: { field: 'customerType', operator: 'equals', value: 'Account' }
  },
  {
    id: 'contactLookup', type: 'lookup', entityName: 'contact',
    lookupColumns: ['fullname'],
    visibleWhen: { field: 'customerType', operator: 'equals', value: 'Contact' }
  }
]
```

### Return Value

```javascript
{
  id: 'guid-here',
  name: 'Contoso Ltd',
  subtitle: 'ACC-001',
  entityType: 'account',
  record: { /* all fetched columns */ }
}
```

## Modal Dialog Lookup

Full-screen modal with searchable data table. Use `uiLib.Lookup`:

```javascript
new uiLib.Lookup({
  entity: 'account',
  columns: ['name', 'telephone1', 'emailaddress1'],
  columnLabels: {
    name: 'Account Name',
    telephone1: 'Phone',
    emailaddress1: 'Email'
  },
  filters: 'statecode eq 0',
  orderBy: [
    { attribute: 'name', descending: false }
  ],
  searchFields: ['name', 'accountnumber'],
  additionalSearchFields: ['description'],
  defaultSearchTerm: '',
  multiSelect: true,
  pageSize: 50,
  showPagination: true,
  allowClear: true,
  title: 'Select Account',
  width: 800,
  height: 600,
  onSelect: (records) => {
    console.debug('Selected:', records);
  },
  onCancel: () => {
    console.debug('Cancelled');
  }
}).show();
```

### Lookup Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `entity` | string | required | Entity logical name |
| `columns` | string[] | required | Columns to display |
| `columnLabels` | object | — | Custom column headers |
| `filters` | string | — | OData filter |
| `orderBy` | array | — | Sort order |
| `searchFields` | string[] | columns | Fields to search |
| `additionalSearchFields` | string[] | — | Extra search fields (not displayed) |
| `defaultSearchTerm` | string | `''` | Pre-populate search box |
| `preFilters` | PreFilter[] | — | Dropdown/lookup filters between search and table |
| `multiSelect` | boolean | `false` | Allow selecting multiple records |
| `pageSize` | number | `50` | Records per page |
| `showPagination` | boolean | `true` | Show pagination controls |
| `allowClear` | boolean | `true` | Show clear selection button |
| `title` | string | — | Modal title |
| `width` | number | — | Modal width |
| `height` | number | — | Modal height |

### Lookup Result Object

```javascript
{
  id: 'guid-here',
  name: 'Contoso Ltd',
  entityType: 'account',
  attributes: {
    name: 'Contoso Ltd',
    telephone1: '555-1234',
    emailaddress1: 'info@contoso.com'
  }
}
```

### PreFilters

Add filter dropdowns and/or lookups between the search box and the results table. When a filter value changes, data is re-fetched server-side.

```javascript
new uiLib.Lookup({
  entity: 'opportunity',
  columns: ['name', 'estimatedvalue', 'closeprobability'],
  columnLabels: { name: 'Opportunity', estimatedvalue: 'Est. Value', closeprobability: 'Probability' },
  preFilters: [
    // Option set — auto-populated from D365 metadata
    { type: 'optionset', attribute: 'statecode', label: 'Status' },
    // Static dropdown
    {
      type: 'select', attribute: 'prioritycode', label: 'Priority',
      options: [
        { label: 'High', value: '1' },
        { label: 'Normal', value: '2' },
        { label: 'Low', value: '3' }
      ]
    },
    // Lookup — filter by parent account
    {
      type: 'lookup', attribute: 'parentaccountid', label: 'Account',
      entityName: 'account', lookupColumns: ['name', 'accountnumber']
    }
  ],
  onSelect: (records) => console.debug('Selected:', records)
}).show();
```

**PreFilter types:**

| Type | Description | Key Properties |
|------|-------------|----------------|
| `optionset` | Auto-populated from D365 metadata | `attribute`, `label`, `includeAll`, `defaultValue` |
| `select` | Static dropdown with manual options | `attribute`, `label`, `options`, `includeAll`, `defaultValue` |
| `lookup` | Related record picker | `attribute`, `label`, `entityName`, `lookupColumns`, `filters` |
