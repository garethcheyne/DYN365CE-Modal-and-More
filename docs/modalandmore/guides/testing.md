---
title: Testing
description: Demo page, test suite, and integration testing checklist
author: gareth-cheyne
category: dynamics-365-ce
---

# Testing

## Solution Contents

The D365 solution package includes:

| File | Description |
|------|-------------|
| `err403_ui-lib.min.js` | Main library bundle |
| `err403_demo.html` | Interactive demo page with all component examples |
| `err403_tests.html` | Comprehensive test suite |

## Demo Page

Navigate to:

```
https://[your-org].dynamics.com/WebResources/err403_/demo.html
```

**Includes:**

- Toast examples (5 types + sound)
- Logger examples (BUG, WAR, ERR)
- 11 Modal examples (basic, forms, tabs, progress, side cart, draggable, etc.)
- 3 Lookup examples (basic, multi-select, advanced)

## Test Suite

Navigate to:

```
https://[your-org].dynamics.com/WebResources/err403_/tests.html
```

### Available Tests

**Toast Tests (8):** Success, Info, Warning, Error, Custom, Sound, Stack multiple, Auto-dismiss timing

**Modal Tests (8):** Basic, Form with validation, Tabbed, Progress indicator, Side cart, Draggable, All field types, Nested modals

**Lookup Tests (8):** Basic, Multi-select, Advanced features, Search, Pagination, Column sorting, FetchXML filters, Metadata caching

**Logger Tests (4):** BUG, WAR, ERR, Multiple types

**Integration Tests (3):** Modal + Toast interaction, Lookup in Modal, Error handling

### Running Tests

- Click individual test buttons for focused testing
- Use **Run All Tests** to execute the full automated suite
- Manual tests (modals, lookups) require user interaction
- Results are logged to console and displayed on-screen

## Local Development Testing

```bash
npm run dev     # Start dev server at http://localhost:5177
npm run demo    # Open demo page
npm run test    # Open test suite
```

## Code Examples for Testing

### Form OnLoad

```javascript
function onLoad(executionContext) {
  const health = uiLib.init(executionContext);
  if (!health.loaded) return;

  uiLib.Toast.success({
    message: 'Form loaded successfully!',
    duration: 3000
  });
}
```

### Custom Ribbon Button

```javascript
function openAccountSelector() {
  new uiLib.Lookup({
    entityName: 'account',
    tableColumns: [
      { id: 'name', header: 'Account Name', sortable: true, elastic: true },
      { id: 'accountnumber', header: 'Account #', sortable: true, width: '140px' },
      { id: 'telephone1', header: 'Phone', width: '140px' }
    ],
    onSelect: function(results) {
      if (results.length > 0) {
        uiLib.Toast.success({ message: 'Selected: ' + results[0].name });
      }
    }
  }).show();
}
```

### Custom Web Resource

```html
<!DOCTYPE html>
<html>
<head>
  <title>Custom Page</title>
  <script src="/WebResources/err403_/ui-lib.min.js"></script>
</head>
<body>
  <button onclick="showModal()">Click Me</button>
  <script>
    function showModal() {
      uiLib.Modal.alert('Hello', 'This is a custom modal!').then(() => {
        uiLib.Toast.success({ message: 'Modal closed!' });
      });
    }
  </script>
</body>
</html>
```

## Testing Checklist

### Pre-Import

- [ ] Solution built successfully (`npm run release`)
- [ ] Version format correct
- [ ] All web resources included

### Post-Import

- [ ] Solution imported successfully
- [ ] Demo page loads without errors
- [ ] Test page loads without errors
- [ ] All Toast types display correctly
- [ ] All Modal types open and close properly
- [ ] Lookup displays data (mock or live)
- [ ] Logger writes to browser console
- [ ] Components work in form contexts
- [ ] Components work in custom web resources

### Known Limitations

- **Lookup mock data**: When Xrm API is not available, lookup uses mock data
- **Iframe support**: Library detects iframe context and renders in top window
- **Sound effects**: Toast sounds require prior user interaction (browser autoplay policies)

## Support

- **Issues**: [GitHub Issues](https://github.com/garethcheyne/DYN365CE-Modal-and-More/issues)
- **Email**: info@err403.com
- **Website**: https://err403.com
