# Architecture & Development

Internal structure, build system, component hierarchy, and development workflow.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| User-facing API | Vanilla JavaScript / TypeScript | Simple, framework-agnostic consumption |
| Internal rendering | React 18 + Fluent UI v9 | Native D365 look-and-feel |
| Build | Vite + TypeScript + Rollup | Bundling and type generation |
| Output | Single minified JS bundle | ~690KB (~280KB gzipped) + `.d.ts` |

React and Fluent UI are **bundled inside** the library — consumers never see or interact with React.

---

## Bundle Output

| File | Description |
|------|-------------|
| `ui-lib.min.js` | Minified library bundle (~690KB) |
| `ui-lib.styles.css` | Compiled CSS styles |
| `ui-lib.types.d.ts` | TypeScript definitions |
| `demo.html` | Interactive demo page |
| `tests.html` | Test suite page |

---

## Project Structure

```
src/
├── index.ts                          # Main entry — exports, global window assignment, iframe detection
├── vite-env.d.ts                     # Vite type declarations
├── components/
│   ├── Modal/
│   │   ├── Modal.ts                  # Core modal engine (~5000 lines)
│   │   ├── Modal.types.ts            # All TypeScript interfaces
│   │   └── ModalHelpers.ts           # alert(), confirm(), prompt() convenience methods
│   ├── Toast/
│   │   ├── Toast.tsx                 # React-based toast notification system
│   │   └── Toast.types.ts            # Toast type definitions
│   ├── Lookup/
│   │   ├── Lookup.ts                 # Modal dialog lookup with table
│   │   └── Lookup.types.ts           # Lookup type definitions
│   ├── Logger/
│   │   └── Logger.ts                 # Styled console logging
│   └── FluentUi/                     # React wrapper components for Fluent UI v9
│       ├── index.ts                  # Barrel export
│       ├── CheckboxFluentUi.tsx
│       ├── SwitchFluentUi.tsx
│       ├── DatePickerFluentUi.tsx
│       ├── DropdownFluentUi.tsx
│       ├── InputFluentUi.tsx
│       ├── TableFluentUi.tsx
│       ├── LookupFluentUi.tsx
│       ├── AddressLookupFluentUi.tsx
│       ├── FileUploadFluentUi.tsx
│       ├── FieldGroupFluentUi.tsx
│       ├── QueryBuilderFluentUi.tsx
│       ├── sharedStyles.ts           # Shared makeStyles definitions
│       ├── helpers.ts                # Utility functions
│       └── ... (30+ components)
├── providers/
│   └── FluentProvider.ts             # Fluent UI theme provider + D365 theme
├── styles/
│   ├── theme.ts                      # Theme tokens
│   └── animations.ts                 # CSS animation definitions
├── types/
│   └── xrm.d.ts                     # D365 Xrm type declarations
├── utils/
│   └── dom.ts                        # DOM utility functions
└── pages/                            # Demo/test page sources
    ├── demo/
    ├── tests/
    ├── howto/
    ├── about/
    └── shared/
```

---

## Component Architecture

### How Modal Works

1. **Constructor** (`new Modal(options)`) — stores config, does NOT render
2. **`.show()`** — creates DOM container, mounts React tree via `createRoot()`
3. **Field rendering** — `createField()` dispatches to FluentUI wrapper components by field type
4. **State management** — React `useState` hooks inside each FluentUI component; `Modal.ts` tracks values via callbacks
5. **Conditional visibility** — `fieldVisibilityMap: Map<string, boolean>` updated by `evaluateVisibilityCondition()` on every field change
6. **Wizard steps** — `progress.steps` renders step indicators; `nextStep()`/`previousStep()` swaps field sets
7. **Button state** — `getButton()` returns a wrapper with chainable methods that update the DOM button directly

### How Toast Works

1. **Static method call** (`Toast.success(...)`) — creates React portal
2. **Toast container** — singleton div appended to document body
3. **Animations** — CSS slide-in from top-right
4. **Auto-dismiss** — `setTimeout` with pause-on-hover support
5. **Sound** — optional notification sound via `Audio` API

### How Lookup Works

1. **Constructor** — stores entity config
2. **`.show()`** — creates Modal with embedded table
3. **Search** — debounced text input queries `Xrm.WebApi.retrieveMultipleRecords()`
4. **Selection** — table row selection via `onRowSelect` callback
5. **Pagination** — fetches pages via OData `$top` and `$skip`

---

## Iframe Architecture (D365)

D365 uses multiple nested iframes:

```
┌─────────────────────────────────┐
│ Top Window (main page)          │
│ ┌─────────────────────────────┐ │
│ │ Form Iframe 1               │ │
│ │ (Account form script)       │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Form Iframe 2               │ │
│ │ (Web resource)              │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Auto-detection in `index.ts`:**
1. Library is loaded once (as D365 form library)
2. IIFE checks `window.top` and `window.parent` for existing instance
3. If found → assigns parent instance to `window.uiLib` + `window.err403`
4. If not found → creates new instance, exposes to parent/top windows
5. Each iframe gets the same singleton — no duplicate loading

---

## Styling Conventions

### Fluent UI v9 — Use `makeStyles` + `tokens`

```typescript
import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    color: tokens.colorNeutralForeground2,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
  }
});
```

### Common Tokens

| Category | Examples |
|----------|---------|
| Colors | `tokens.colorNeutralForeground1`, `tokens.colorBrandBackground` |
| Spacing | `tokens.spacingVerticalS`, `tokens.spacingHorizontalM` |
| Typography | `tokens.fontSizeBase300`, `tokens.fontWeightSemibold` |
| Borders | `tokens.borderRadiusMedium`, `tokens.strokeWidthThin` |

All FluentUI field components use `appearance="filled-darker"` for D365 native style.

---

## Build Commands

```bash
npm install              # Install dependencies
npm run dev              # Dev server (http://localhost:5177)
npm run build            # Build library bundle
npm run build:pages      # Build demo/test pages
npm run build:all        # Build everything
npm run release          # Full release: build + solution update + zip
npm run deploy           # Deploy to D365 environment
```

### Solution Management

```bash
npm run update-solution  # Copy files to solution/src/WebResources
npm run pack-solution    # Create solution ZIP file
```

---

## Version Format

`YYYY.MM.DD.NN` — e.g., `2026.03.02.01`

Tracked in `package.json`, synced to D365 solution version. Releases via GitHub Actions on tag push.

---

## Adding a New Field Type

1. Add type to `FieldConfig['type']` union in `src/components/Modal/Modal.types.ts`
2. Add type-specific properties to `FieldConfig` interface
3. Add case handler in `createField()` in `src/components/Modal/Modal.ts`
4. Create React component in `src/components/FluentUi/` (if needed)
5. Export from `src/components/FluentUi/index.ts`
6. Import in `Modal.ts`
7. Update docs: README.md, copilot-instructions.md, AiSkills/

---

## Adding a New Modal Feature

1. Update `ModalOptions` in `src/components/Modal/Modal.types.ts`
2. Implement in `src/components/Modal/Modal.ts`
3. Update TypeScript definitions (`rollup.dts.config.js`)
4. Add examples to README.md and demo page

---

## Testing

- **Demo page:** `npm run dev` → http://localhost:5177/pages/demo.html
- **Test suite:** http://localhost:5177/pages/tests.html
- Tests are interactive browser-based — no Jest/Vitest unit tests
- Demo page includes a "Builder" tab for visual modal construction (beta)

---

## Deployment Pipeline

1. **Development** — local Vite dev server
2. **Build** — `npm run build:all` produces `build/` and `release/` directories
3. **Solution Pack** — `npm run pack-solution` creates D365 solution ZIP
4. **Testing** — import solution ZIP into test D365 environment
5. **Production** — import solution ZIP into production environment
6. **CI/CD** — GitHub Actions builds and creates releases on tag push

---

## Key Design Decisions

- **Vanilla JS API surface** — consumers don't need React knowledge
- **Bundled React** — no external dependency management for D365 admins
- **Dual namespace** (`uiLib` + `err403`) — backward compatibility during rename
- **Fluent UI v9** — matches D365 native UI, not React-specific v8
- **Single bundle** — one web resource to deploy, simpler D365 solution
- **iframe auto-detection** — zero config for multi-iframe D365 forms
