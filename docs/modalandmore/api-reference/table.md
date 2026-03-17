---
title: Table
description: Data grid with sorting, selection, filtering, and formatting
author: gareth-cheyne
category: dynamics-365-ce
---

# Table

Data grid component for use as a modal field. Supports sorting, selection, column filtering, grouping, and cell formatting.

## Basic Usage

```javascript
{
  id: 'products',
  type: 'table',
  label: 'Products',
  tableColumns: [
    { id: 'name', header: 'Product', visible: true, sortable: true, width: '250px' },
    { id: 'price', header: 'Price', visible: true, sortable: true, width: '120px', align: 'right' }
  ],
  data: [
    { id: 1, name: 'Product A', price: 100 },
    { id: 2, name: 'Product B', price: 200 }
  ],
  selectionMode: 'single'
}
```

## Column Configuration

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Column identifier (matches data key) |
| `header` | string | Column header text |
| `visible` | boolean | Show/hide column |
| `sortable` | boolean | Allow sorting |
| `width` | string | Fixed width (e.g. `'250px'`) |
| `minWidth` | string | Minimum width for flexible columns |
| `align` | string | `'left'` \| `'right'` \| `'center'` |
| `format` | string | Auto-format values (see below) |

## Column Formatting

```javascript
tableColumns: [
  { id: 'revenue', header: 'Revenue', format: 'currency' },  // $1,234.56
  { id: 'units', header: 'Units', format: 'number' },         // 1,234
  { id: 'margin', header: 'Margin', format: 'percent' },      // 12.34% (input: 0.1234)
  { id: 'date', header: 'Date', format: 'date' }              // MM/DD/YYYY
]
```

| Format | Input | Output |
|--------|-------|--------|
| `currency` | `15234.89` | `$15,234.89` |
| `number` | `1240` | `1,240` |
| `percent` | `0.3245` | `32.45%` |
| `date` | `'2026-02-11'` or `Date` | `02/11/2026` |

## Selection

```javascript
{
  id: 'items', type: 'table',
  selectionMode: 'multiple',  // none | single | multiple
  onRowSelect: (selectedRows) => {
    console.debug('Selected:', selectedRows);
  }
}
```

### Conditional Row Selection

Disable selection for specific rows:

```javascript
{
  id: 'items', type: 'table',
  selectionMode: 'multiple',
  isRowSelectable: (row) => row.status === 'Active',
  data: [
    { id: 1, name: 'Item A', status: 'Active' },    // Selectable
    { id: 2, name: 'Item B', status: 'Inactive' }    // Disabled (grayed out)
  ]
}
```

Visual behavior for disabled rows:
- Reduced opacity (0.5)
- Grayed out checkboxes
- Cursor shows "not-allowed"
- "Select All" only selects selectable rows

## Dynamic Data Updates

```javascript
// Replace table data at runtime
modal.setFieldValue('products', newDataArray);
```

## HTML in Cells

Cells containing HTML are rendered automatically:

```javascript
data: [
  {
    id: 1,
    product: 'Widget',
    status: '<span style="color: #107c10;">Active</span>',
    price: '<span style="color: #d32f2f; font-weight: 600;">↑ $205.00</span>'
  }
]
```

## Built-in Features

All features work without configuration:

- **Sortable columns** — Click headers to sort
- **Column filtering** — Right-click header → Filter (Equals, Contains, Greater Than, etc.)
- **Column grouping** — Right-click header → Group By
- **Group expand/collapse** — Click group headers
- **Column visibility** — Right-click header → Show/Hide Columns
- **Select-all checkbox** — In multiple selection mode (respects `isRowSelectable`)
