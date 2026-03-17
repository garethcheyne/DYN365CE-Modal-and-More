---
applyTo: "**"
---

# UI Library for Dynamics 365 (`uiLib`)

## Skill Overview

**Name:** D365 UI Library (`uiLib`)
**Purpose:** Generate, modify, and troubleshoot code that uses this UI component library for Microsoft Dynamics 365 CE.
**Trigger phrases:** "toast notification", "modal dialog", "lookup", "D365 form", "uiLib", "err403", "wizard", "field visibility", "conditional required", "query builder", "data grid", "file upload", "address lookup"

> **IMPORTANT:** Before generating any code using this library, read the relevant reference files in this `AiSkills/` directory. The library has strict API conventions — using wrong patterns will produce broken code.

## What This Library Does

- **Toast Notifications** — Slide-in notifications matching D365 native style
- **Modal Dialogs** — Form modals, alerts, confirms, prompts, wizards with step indicators
- **Lookup Dialogs** — D365-style record pickers (inline dropdown + full modal)
- **Data Tables** — Sortable, filterable, selectable data grids with column formatting
- **Query Builder** — Visual FetchXML/OData filter builder
- **File Upload** — Drag-and-drop file upload with validation
- **Address Lookup** — Google Maps / Azure Maps autocomplete
- **Field Groups** — Collapsible sections for form organization
- **Logger** — Styled console logging with `[ui-Lib]` branding

## How It's Consumed

```javascript
// Available globally when loaded as D365 form library
window.uiLib   // Primary namespace
window.err403  // Backward compatibility alias

// Initialize in D365 form OnLoad
function onFormLoad(executionContext) {
  const health = uiLib.init(executionContext);
  if (!health.loaded) return;
}
```

**Output:** Single minified JS bundle (~690KB, ~280KB gzipped) loaded as a D365 web resource.
**Consumer API:** Vanilla JavaScript — React internals are hidden from the user.

## Critical Rules (Read Before Generating Code)

### 1. Buttons MUST use constructor — never plain objects

```javascript
// ❌ WRONG — will silently fail
buttons: [{ label: 'Save', onClick: () => {} }]

// ✅ CORRECT
buttons: [new uiLib.Button({ label: 'Save', callback: () => true, id: 'saveBtn' })]
```

### 2. Use `callback` not `onClick`; `setFocus` not `type: 'primary'`

```javascript
// ❌ WRONG properties
new uiLib.Button({ onClick: () => {}, type: 'primary' })

// ✅ CORRECT properties
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
// ❌ Fragile — relies on auto-generation
new uiLib.Button('Submit', callback, true);
modal.getButton('submit');

// ✅ Self-documenting
new uiLib.Button({ label: 'Submit', callback, setFocus: true, id: 'submitBtn' });
modal.getButton('submitBtn');
```

### 6. Return `true` from callback to close modal, `false` to keep open

### 7. `onStepChange` callback does NOT exist — handle in button callbacks

### 8. `content` property is for groups/tabs only — custom fields use `html` or `render`

## Reference Files

| File | Contents |
|------|----------|
| [SKILL.md](SKILL.md) | This file — overview, rules, and entry point |
| [API_REFERENCE.md](API_REFERENCE.md) | Complete API: all classes, methods, properties, return types |
| [FIELD_TYPES.md](FIELD_TYPES.md) | Every field type with config, examples, and value shapes |
| [PATTERNS.md](PATTERNS.md) | Common integration patterns, D365 recipes, and real-world examples |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Internal structure, build system, component hierarchy, and dev workflow |

## Quick Examples

### Toast

```javascript
uiLib.Toast.success({ title: 'Saved', message: 'Record updated', duration: 6000 });
uiLib.Toast.error({ title: 'Error', message: 'Failed to save' });
const t = uiLib.Toast.info({ title: 'Working...', duration: 0 });
t.close(); // manual dismiss
```

### Alert / Confirm / Prompt

```javascript
await uiLib.Modal.alert('Done', 'Record saved');
const yes = await uiLib.Modal.confirm('Delete?', 'Are you sure?');
const name = await uiLib.ModalHelpers.prompt('Name', 'Enter name', 'default');
```

### Form Modal

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
        // { name: '...', email: '...', active: true }
        return true; // close
      },
      setFocus: true,
      requiresValidation: true,
      id: 'saveBtn'
    })
  ]
});
modal.show();
```

### Wizard

```javascript
const wizard = new uiLib.Modal({
  title: 'Setup',
  progress: {
    enabled: true, currentStep: 1,
    steps: [
      { id: 's1', label: 'Info', fields: [{ id: 'name', type: 'text', required: true }] },
      { id: 's2', label: 'Prefs', fields: [{ id: 'theme', type: 'select', options: ['Light','Dark'] }] }
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
