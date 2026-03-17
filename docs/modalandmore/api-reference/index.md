---
title: API Reference
excerpt: Complete API documentation for all uiLib components
---

# API Reference

Full documentation for every component, method, and configuration option.

## Components

| Component | Description |
|-----------|-------------|
| [Toast](./toast) | Slide-in notifications matching D365 native style |
| [Modal](./modal) | Form dialogs, alerts, confirms, prompts, wizards |
| [Fields](./fields) | All field types — text, select, lookup, table, file, etc. |
| [Lookup](./lookup) | Inline dropdown and full modal record pickers |
| [Table](./table) | Sortable, filterable data grids with selection |

## Namespace

```javascript
window.uiLib    // Primary namespace
window.err403   // Backward compatibility alias
```

Both point to the same object. Use `uiLib` in new code.

## Initialization

```javascript
function onFormLoad(executionContext) {
  const health = uiLib.init(executionContext);
  // health: { loaded, cssLoaded, inWindow, version, timestamp, instance }
}
```
