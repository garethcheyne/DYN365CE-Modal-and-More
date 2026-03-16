# AiSkills — Installation Guide

AI-readable documentation for the uiLib (D365 UI Library). These docs teach AI agents (GitHub Copilot, Claude Code, etc.) how to correctly generate code using this library.

---

## What's Inside

| File | Purpose |
|------|---------|
| `SKILL.md` | Entry point — overview, critical API rules, quick examples |
| `API_REFERENCE.md` | Complete API reference — all classes, methods, return types |
| `FIELD_TYPES.md` | Every field type with config, examples, and value shapes |
| `PATTERNS.md` | Real-world D365 integration patterns and recipes |
| `ARCHITECTURE.md` | Internal structure, build system, and dev workflow |

---

## Installation

### Option 1: Project-Level (This Repo Only)

Registers the skill docs with both Claude Code and GitHub Copilot for this project.

**PowerShell (Windows):**

```powershell
.\AiSkills\scripts\install.ps1
```

**Bash (macOS/Linux/WSL):**

```bash
chmod +x ./AiSkills/scripts/install.sh
./AiSkills/scripts/install.sh
```

**What it does:**

| AI System | Action |
|-----------|--------|
| **Claude Code** | Creates `CLAUDE.md` at repo root — Claude auto-loads this on every session |
| **GitHub Copilot** | Appends skill references to `.github/copilot-instructions.md` |

### Option 2: Global (All Projects on Your Machine)

Teaches the AI about uiLib across every project you work on.

**PowerShell:**

```powershell
.\AiSkills\scripts\install.ps1 -Global
```

**Bash:**

```bash
./AiSkills/scripts/install.sh --global
```

**What it does:**

| AI System | Action |
|-----------|--------|
| **Claude Code** | Appends uiLib rules to `~/.claude/CLAUDE.md` (user-level context) |
| **GitHub Copilot** | Prints VS Code settings to add manually (see below) |

### Option 3: Manual Setup

If you prefer to set things up yourself:

#### Claude Code

Create or edit `CLAUDE.md` at your project root (or `~/.claude/CLAUDE.md` for global):

```markdown
# Project Context

When working with the uiLib D365 library, read the `AiSkills/` directory for full API documentation.

Key rules:
- Buttons MUST use `new uiLib.Button({ label, callback, id })` — never plain objects
- Use `callback` not `onClick`; `setFocus: true` not `type: 'primary'`
- Tabs use `asTabs: true` inside `fields` — no top-level `tabs` property
- Custom fields use `type: 'custom'` with `html` or `render`
- Return `true` from callback to close modal, `false` to keep open
```

#### GitHub Copilot (Project-Level)

Add this to your `.github/copilot-instructions.md`:

```markdown
## AI Skills Reference

> For detailed API docs, field types, patterns, and architecture, see the `AiSkills/` directory:
> - [AiSkills/SKILL.md](../AiSkills/SKILL.md) — Overview and critical rules
> - [AiSkills/API_REFERENCE.md](../AiSkills/API_REFERENCE.md) — Complete API reference
> - [AiSkills/FIELD_TYPES.md](../AiSkills/FIELD_TYPES.md) — All field types with examples
> - [AiSkills/PATTERNS.md](../AiSkills/PATTERNS.md) — D365 integration patterns
> - [AiSkills/ARCHITECTURE.md](../AiSkills/ARCHITECTURE.md) — Internal architecture
```

#### GitHub Copilot (Global — VS Code Settings)

Open VS Code settings (`Ctrl+Shift+P` → **Preferences: Open User Settings (JSON)**) and add:

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "text": "When using the uiLib D365 library: always use new uiLib.Button() constructor (never plain objects), use callback not onClick, use setFocus not type:primary, tabs use asTabs:true inside fields array, custom fields use type:custom with html or render property. Read AiSkills/ directory for full API docs."
    }
  ]
}
```

---

## Verifying Installation

### Claude Code

Start a Claude Code session in your project. Ask:

> "What files should you read before generating uiLib code?"

It should mention the `AiSkills/` directory and list the reference files.

### GitHub Copilot

Open Copilot Chat in VS Code and ask:

> "How do I create a modal with uiLib?"

It should use `new uiLib.Button()` constructor (not plain objects) and include an `id` on each button.

---

## How It Works

| AI System | Discovery Mechanism |
|-----------|-------------------|
| **Claude Code** | Reads `CLAUDE.md` at project root automatically when a session starts. Global: reads `~/.claude/CLAUDE.md`. |
| **GitHub Copilot** | Reads `.github/copilot-instructions.md` when workspace is opened. The `applyTo: "**"` frontmatter in `SKILL.md` makes it available as a Copilot skill. Global: uses `codeGeneration.instructions` in VS Code user settings. |

Both systems follow the references to read the detailed docs in `AiSkills/` on demand.

---

## Updating the Docs

If you add new features to the library, update the relevant file(s) in `AiSkills/`:

- New field type → `FIELD_TYPES.md`
- New API method → `API_REFERENCE.md`  
- New integration pattern → `PATTERNS.md`
- Architectural change → `ARCHITECTURE.md`
- New critical rule → `SKILL.md` (Critical Rules section)

No need to re-run the install scripts — the references are already in place.
