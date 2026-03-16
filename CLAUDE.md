# Project Context for Claude

This is a UI component library for Microsoft Dynamics 365 CE (uiLib).

## AI Skills Reference

Detailed documentation lives in the `AiSkills/` directory. Read these files before generating or modifying library code:

| File | Contents |
|------|----------|
| [AiSkills/SKILL.md](AiSkills/SKILL.md) | Overview, critical API rules, quick examples |
| [AiSkills/API_REFERENCE.md](AiSkills/API_REFERENCE.md) | Complete API — all classes, methods, properties, return types |
| [AiSkills/FIELD_TYPES.md](AiSkills/FIELD_TYPES.md) | Every field type with config, examples, and value shapes |
| [AiSkills/PATTERNS.md](AiSkills/PATTERNS.md) | D365 integration patterns and real-world recipes |
| [AiSkills/ARCHITECTURE.md](AiSkills/ARCHITECTURE.md) | Internal structure, build system, and dev workflow |

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
