---
title: Installation
description: How to install and set up the UI Library in your Dynamics 365 environment
author: gareth-cheyne
category: dynamics-365-ce
---

# Installation

## Download

Download the latest release from [GitHub Releases](https://github.com/garethcheyne/DYN365CE-Modal-and-More/releases).

Each release includes:

| File | Description |
|------|-------------|
| `err403UILibrary_*.zip` | D365 solution package (import this) |
| `ui-lib.min.js` | Standalone library bundle |
| `ui-lib.min.js.map` | Source map for debugging |
| `ui-lib.types.d.ts` | TypeScript definitions |

## Import to Dynamics 365

1. Navigate to [make.powerapps.com](https://make.powerapps.com)
2. Select your target environment
3. Go to **Solutions** → **Import**
4. Upload the `.zip` solution file
5. Click **Next** → **Import**
6. Wait for import to complete

## Add to Form Libraries

For each form where you want to use the library:

1. Open the form in the Form Designer
2. Go to **Form Properties** → **Events** → **Form Libraries**
3. Click **Add** and search for `err403_/ui-lib.min.js`
4. Move it to the **top** of the library list (it must load before your scripts)
5. **Save and Publish** the form

## Initialize in Your Code

### Form OnLoad Event

```javascript
function onFormLoad(executionContext) {
  const health = uiLib.init(executionContext);

  if (!health.loaded) {
    console.error('UI Library failed to load');
    return;
  }

  if (!health.cssLoaded) {
    console.warn('UI Library CSS not loaded — components may appear unstyled');
  }

  // Library is ready
  const formContext = executionContext.getFormContext();
}
```

### Ribbon Commands

```javascript
function onRibbonClick() {
  // No executionContext in ribbon — just use uiLib directly
  uiLib.Modal.confirm('Action', 'Perform this action?').then((confirmed) => {
    if (confirmed) performAction();
  });
}
```

### Web Resource (Iframe)

```javascript
// Library auto-detects parent window — no manual iframe handling needed
if (typeof uiLib !== 'undefined') {
  uiLib.Toast.success({ message: 'Web resource loaded' });
}
```

## Health State

The `uiLib.init()` function returns a health object:

| Property | Type | Description |
|----------|------|-------------|
| `loaded` | boolean | Library initialization completed |
| `cssLoaded` | boolean | CSS stylesheet found and loaded |
| `inWindow` | boolean | Available as `window.uiLib` |
| `version` | string | Current version (e.g., `2026.01.24.01`) |
| `timestamp` | string | ISO timestamp of initialization |
| `instance` | object | Reference to library instance |

## Development Setup

For contributing or local development:

```bash
git clone https://github.com/garethcheyne/DYN365CE-Modal-and-More.git
cd DYN365CE-Modal-and-More
npm install
npm run dev          # Start dev server at http://localhost:5177
npm run demo         # Open demo page
```

### Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Build library bundle |
| `npm run build:pages` | Build demo/test pages |
| `npm run build:all` | Build everything |
| `npm run release` | Full release: build + update solution + pack zip |
