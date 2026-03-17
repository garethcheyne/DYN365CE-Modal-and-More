---
title: Modal & More — UI Library for Dynamics 365
description: Professional-grade UI components that seamlessly integrate with Dynamics 365 CE
author: gareth-cheyne
category: dynamics-365-ce
---

# Modal & More

**Free and open source** professional-grade UI components that seamlessly integrate with Dynamics 365, giving your forms, ribbons, and custom pages the same polished look and feel as native D365 interfaces.

Available as `window.uiLib` (recommended) or `window.err403` (backward compatibility).

## What's Included

- **Toast Notifications** — Success, error, warning, and info messages matching D365 native style
- **Modal Dialogs** — Forms, wizards, alerts, confirms, prompts with full validation and conditional visibility
- **Advanced Lookups** — Inline dropdown and full-screen modal record pickers
- **Data Tables** — Sortable, filterable, selectable grids with column formatting
- **Query Builder** — Visual FetchXML/OData filter builder
- **File Upload** — Drag-and-drop with validation
- **Address Lookup** — Google Maps / Azure Maps autocomplete
- **Modal Builder** (Beta) — Visual drag-and-drop modal designer with code export

## Architecture

- **User-facing API**: Vanilla JavaScript — no React knowledge required
- **Internal**: React 18 + Microsoft Fluent UI v9 (bundled, invisible to consumers)
- **Build**: Vite + TypeScript + Rollup
- **Output**: Single minified bundle (~690KB, ~280KB gzipped)

## Quick Start

```javascript
// Initialize in D365 form OnLoad
function onFormLoad(executionContext) {
  const health = uiLib.init(executionContext);
  if (!health.loaded) return;

  // Show a toast
  uiLib.Toast.success({ title: 'Ready', message: 'Library loaded' });

  // Open a modal
  const modal = new uiLib.Modal({
    title: 'Hello',
    fields: [{ id: 'name', label: 'Name', type: 'text', required: true }],
    buttons: [
      new uiLib.Button({ label: 'Cancel', callback: () => true, id: 'cancelBtn' }),
      new uiLib.Button({ label: 'Save', callback: () => true, setFocus: true, id: 'saveBtn' })
    ]
  });
  modal.show();
}
```

## Links

- [GitHub Repository](https://github.com/garethcheyne/DYN365CE-Modal-and-More)
- [Getting Started →](./getting-started/)
- [API Reference →](./api-reference/)
- [Guides →](./guides/)
