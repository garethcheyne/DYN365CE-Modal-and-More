# Testing the UI Library for Dynamics 365

> **Note:** The library is available as `window.uiLib` (primary) or `window.err403` (backward compatible).

## Solution Contents

The D365 solution package includes:

1. **err403_err403-ui-lib.min.js** - The main library (64 KB)
2. **err403_demo.html** - Interactive demo page with all component examples
3. **err403_tests.html** - Comprehensive test suite for automated and manual testing
4. **README.md** - Quick start guide

## After Importing the Solution

### 1. Access the Demo Page

Navigate to:
```
https://[your-org].dynamics.com/WebResources/err403_/demo.html
```

**What's included:**
- Toast examples (5 types + sound)
- Logger examples (BUG, WAR, ERR)
- 11 Modal examples (basic, forms, tabs, progress, side cart, draggable, etc.)
- 3 Lookup examples (basic, multi-select, advanced)

### 2. Run the Test Suite

Navigate to:
```
https://[your-org].dynamics.com/WebResources/err403_/tests.html
```

**Available tests:**

**Toast Tests (8 tests):**
- Success, Info, Warning, Error, Custom toasts
- Toast with sound
- Stack multiple toasts (tests max 5 visible)
- Auto-dismiss timing

**Modal Tests (8 tests):**
- Basic modal
- Form with validation
- Tabbed modal
- Progress indicator
- Side cart modal
- Draggable modal
- All field types
- Nested modals

**Lookup Tests (8 tests):**
- Basic lookup
- Multi-select mode
- Advanced features (custom labels, sorting)
- Search functionality
- Pagination
- Column sorting
- FetchXML filters
- Metadata caching

**Logger Tests (4 tests):**
- BUG logging
- WAR logging
- ERR logging
- Multiple log types

**Integration Tests (3 tests):**
- Modal + Toast interaction
- Lookup in Modal
- Error handling

**Special Features:**
- Click individual test buttons for focused testing
- Use "Run All Tests" to execute automated tests
- Manual tests (modals, lookups) require user interaction
- All test results logged to console and on-screen

### 3. Use in Your Own Code

**In a Form OnLoad Event:**
```javascript
function onLoad(executionContext) {
  const health = uiLib.init(executionContext);
  if (!health.loaded) return;
  
  const formContext = executionContext.getFormContext();
  
  // Show welcome toast
  uiLib.Toast.success({
    message: 'Form loaded successfully!',
    duration: 3000
  });
}
```

**In a Custom Button/Ribbon:**
```javascript
function openAccountSelector() {
  new uiLib.Lookup({
    entityName: 'account',
    columns: ['name', 'accountnumber', 'telephone1'],
    onSelect: function(results) {
      if (results.length > 0) {
        uiLib.Toast.success({
          message: 'Selected: ' + results[0].name
        });
      }
    }
  }).show();
}
```

**In a Custom HTML Web Resource:**
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
      uiLib.Modal.alert('Custom Modal', 'This is a custom modal!').then(() => {
        uiLib.Toast.success({
          message: 'Modal closed!'
        });
      });
    }
  </script>
</body>
</html>
```

## Testing Checklist

### Pre-Import
- [x] Solution built successfully
- [x] Version format corrected (1.0.0.0)
- [x] Managed solution enabled
- [x] All web resources included (JS + 2 HTML files)

### Post-Import
- [ ] Solution imported successfully
- [ ] Demo page loads without errors
- [ ] Test page loads without errors
- [ ] All Toast types display correctly
- [ ] All Modal types open and close properly
- [ ] Lookup component displays mock data
- [ ] Lookup works with real D365 entities (if Xrm API available)
- [ ] Logger writes to browser console
- [ ] Components work in form contexts
- [ ] Components work in custom web resources

### Known Limitations
- **Lookup Mock Data**: When Xrm API is not available, lookup uses mock data
- **Iframe Support**: Library detects iframe context and renders in top window
- **Sound Effects**: Toast sounds require user interaction first (browser autoplay policies)

## Troubleshooting

### Demo/Test Pages Don't Load
- Check URL format: `https://[org].dynamics.com/WebResources/err403_/demo.html`
- Verify solution was imported successfully
- Check browser console for errors

### Lookup Shows Mock Data
- This is normal when not in D365 form context
- For real data, open lookup from a form's JavaScript
- Check Xrm object availability: `console.log(typeof Xrm)`

### Styles Look Wrong
- Library uses Fluent UI styles (built-in)
- No external CSS dependencies
- Should work in all modern browsers

### Components Don't Appear
- Verify library loaded: `console.log(typeof uiLib)` (should show "object")
- Check script path in your code
- Look for JavaScript errors in console

## Next Steps

1. Import the solution
2. Test with demo page
3. Run test suite
4. Integrate into your forms/pages
5. Report any issues for fixes

## Support

For issues or questions:
- Email: info@err403.com
- Website: https://err403.com
