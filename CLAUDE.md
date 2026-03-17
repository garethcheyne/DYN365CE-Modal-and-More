# Project Context for Claude

This is a UI component library for Microsoft Dynamics 365 CE (uiLib).

## Conventions

Read and follow `.claude/modalandmore-conventions.md` for all library rules and API patterns.

For deeper reference, see `AiSkills/ModalAndMore/`:

| File | Contents |
|------|----------|
| `modalandmore-conventions.md` | Complete conventions — rules, examples, API quick reference |
| `API_REFERENCE.md` | All classes, methods, properties, return types |
| `FIELD_TYPES.md` | Every field type with config, examples, and value shapes |
| `PATTERNS.md` | D365 integration patterns and real-world recipes |
| `ARCHITECTURE.md` | Internal structure, build system, and dev workflow |

## Critical Rules

1. Buttons MUST use constructor: `new uiLib.Button({ label, callback, id })` — never plain objects
2. Use `callback` not `onClick`; `setFocus: true` not `type: 'primary'`
3. Tabs use `asTabs: true` inside `fields` — no top-level `tabs` property
4. Custom fields use `type: 'custom'` with `html` or `render` — NOT `type: 'html'`
5. Return `true` from callback to close modal, `false` to keep open
6. Always provide explicit button IDs for reliable `getButton()` lookups

## Quick Start

```javascript
// Toast
uiLib.Toast.success({ title: 'Saved', message: 'Record updated' });

// Modal with form
const modal = new uiLib.Modal({
  title: 'Edit',
  fields: [{ id: 'name', type: 'text', label: 'Name', required: true }],
  buttons: [
    new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
    new uiLib.Button({ label: 'Save', callback: () => true, setFocus: true, id: 'saveBtn' })
  ]
});
modal.show();
```
