---
title: Modal Dialogs
excerpt: Form dialogs, alerts, confirms, prompts, and wizards
---

# Modal Dialogs

Professional modal system with forms, wizards, tabs, conditional visibility, and loading overlays.

## Quick Helpers

```javascript
// Simple dialogs
await uiLib.Modal.alert('Title', 'Message');
const confirmed = await uiLib.Modal.confirm('Delete?', 'Are you sure?');
const modal = uiLib.Modal.open({ title: 'Form', fields: [...] });

// With icon types (ModalHelpers)
await uiLib.ModalHelpers.alert('Success!', '<b>Saved</b>', 'success');
const yes = await uiLib.ModalHelpers.confirm('Delete?', 'Sure?', 'warning');
const name = await uiLib.ModalHelpers.prompt('Name', 'Enter name', 'default');
```

## Constructor

```javascript
const modal = new uiLib.Modal({
  // Basic
  id: 'myModal',
  title: 'Modal Title',
  message: 'Plain text message',
  content: '<div>HTML content</div>',
  icon: 'INFO',  // INFO | SUCCESS | WARNING | ERROR | QUESTION

  // Size
  size: 'medium',  // small | medium | large | fullscreen | { width, height }
  width: 800,
  height: 600,

  // Behavior
  draggable: true,
  allowDismiss: false,      // Click outside to close (default: false)
  allowEscapeClose: true,   // Escape key to close
  buttonAlignment: 'right', // left | center | right | space-between

  // Auto-save
  autoSave: true,
  autoSaveKey: 'myFormData',

  // Fields and buttons
  fields: [...],
  buttons: [...]
});
modal.show();
```

## Instance Methods

| Method | Description |
|--------|-------------|
| `show()` | Show modal |
| `showAsync()` | Show and wait for close (returns `{ button, data }`) |
| `close()` | Close programmatically |
| `getFieldValue(id)` | Get single field value |
| `getFieldValues()` | Get all values as object |
| `setFieldValue(id, value)` | Update field value |
| `nextStep()` | Wizard: go to next step |
| `previousStep()` | Wizard: go to previous step |
| `goToStep(stepId)` | Wizard: go to specific step |
| `getButton(id)` | Get button by ID, label, or index |
| `setLoading(show, options)` | Show/hide loading overlay |
| `getElement(selector?)` | Get modal DOM element(s) |

## Button Constructor

```javascript
// Object style (recommended)
new uiLib.Button({
  label: 'Save',              // Required
  callback: () => true,       // Required — return true to close, false to keep open
  setFocus: true,             // Make primary/blue
  preventClose: false,        // Keep modal open after click
  isDestructive: false,       // Red danger style
  requiresValidation: true,   // Disable until form is valid
  validateAllSteps: false,    // Wizards: false = current step only
  id: 'saveBtn'               // Unique ID (strongly recommended)
});
```

**Chainable instance methods:** `setLabel(text)`, `setDisabled(bool)`, `setVisible(bool)`, `enable()`, `disable()`, `show()`, `hide()`

## Loading Overlay

```javascript
// Spinner mode
modal.setLoading(true, 'Processing...');

// Progress bar mode
modal.setLoading(true, { message: 'Importing...', progress: 45 });

// Hide
modal.setLoading(false);
```

## Wizard Pattern

```javascript
const wizard = new uiLib.Modal({
  title: 'Setup Wizard',
  progress: {
    enabled: true,
    currentStep: 1,
    allowStepNavigation: true,
    steps: [
      { id: 'step1', label: 'Info', message: 'Step 1 instructions', fields: [...] },
      { id: 'step2', label: 'Prefs', fields: [...] },
      { id: 'step3', label: 'Review', fields: [...] }
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

**Step indicators:** Blue (current), Green checkmark (valid), Red exclamation (invalid), Gray (pending)

## Tabs

```javascript
new uiLib.Modal({
  title: 'Tabbed Modal',
  fields: [{
    id: 'tabs',
    asTabs: true,  // REQUIRED for tabs
    fields: [
      { id: 'tab1', label: 'General', content: '<p>HTML</p>', fields: [...] },
      { id: 'tab2', label: 'Advanced', content: '<div>More</div>' }
    ]
  }]
});
```

## Conditional Visibility

```javascript
fields: [
  { id: 'type', type: 'select', options: ['Business', 'Individual'] },
  {
    id: 'company', type: 'text',
    visibleWhen: { field: 'type', operator: 'equals', value: 'Business' }
  }
]
// Operators: equals, notEquals, contains, greaterThan, lessThan, truthy, falsy
```

## Conditional Required

```javascript
fields: [
  { id: 'method', type: 'select', options: ['Email', 'Phone'] },
  {
    id: 'email', type: 'email',
    requiredWhen: { field: 'method', operator: 'equals', value: 'Email' }
  }
]
```

## Side Cart

```javascript
new uiLib.Modal({
  title: 'With Side Panel',
  sideCart: {
    enabled: true,
    position: 'right',
    width: 300,
    content: '<div>Side panel HTML</div>'
  },
  fields: [...]
});
```
