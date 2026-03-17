---
title: Getting Started
description: Install and configure the UI Library for Dynamics 365
author: gareth-cheyne
category: dynamics-365-ce
---

# Getting Started

Get up and running with the UI Library in your Dynamics 365 environment.

## Prerequisites

- A Dynamics 365 CE environment (online or on-premises)
- Permission to import unmanaged solutions
- Access to Form Properties for the forms you want to customize

## Installation Steps

### 1. Download the Solution

Download the latest release from [GitHub Releases](https://github.com/garethcheyne/DYN365CE-Modal-and-More/releases).

The release includes:
- D365 solution package (`.zip`)
- Library bundle (`ui-lib.min.js`)
- TypeScript definitions (`ui-lib.types.d.ts`)

### 2. Import to Dynamics 365

1. Navigate to [make.powerapps.com](https://make.powerapps.com)
2. Select your environment
3. Go to **Solutions** → **Import**
4. Upload the `.zip` file
5. Click **Next** → **Import**

### 3. Add to Form Libraries

1. Open the form you want to customize
2. Go to **Form Properties** → **Events** → **Form Libraries**
3. Add `err403_/ui-lib.min.js`
4. Place it at the **top** of the library list (loads before your scripts)

### 4. Initialize in Your Code

```javascript
function onFormLoad(executionContext) {
  const health = uiLib.init(executionContext);
  if (!health.loaded) return;

  // Library is ready — use uiLib.Toast, uiLib.Modal, etc.
}
```

## Iframe Architecture

D365 uses multiple iframes. The library handles this automatically:

- **Form library**: Loaded once in the top window
- **Form scripts**: Run in child iframes, auto-assigned from parent
- **Web resources**: Custom iframes, also auto-assigned
- **No manual detection needed**: Just check `typeof uiLib !== 'undefined'`

## Next Steps

- [Quick Reference](./quick-reference) — Compact API cheat sheet
- [API Reference](../api-reference/) — Full API documentation
- [Guides](../guides/) — Release workflow, solution deployment, testing
