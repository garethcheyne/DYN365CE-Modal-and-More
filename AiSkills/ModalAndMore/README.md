# ModalAndMore AI Skill

Teach Claude Code and GitHub Copilot how to correctly generate code using the **uiLib** D365 UI Library (Toast, Modal, Lookup, Table, and more).

No servers, no dependencies — just markdown files that get copied to the right place.

---

## Quick Install

### Per-Project (default)

**Mac/Linux/Git Bash:**
```bash
t=$(mktemp -d) && git clone --depth 1 "https://github.com/garethcheyne/DYN365CE-Modal-and-More" "$t" && bash "$t/AiSkills/ModalAndMore/scripts/install.sh" && rm -rf "$t"
```

**Windows (PowerShell):**
```powershell
$t="$env:TEMP\sk-$(Get-Random)"; git clone --depth 1 "https://github.com/garethcheyne/DYN365CE-Modal-and-More" $t; & "$t\AiSkills\ModalAndMore\scripts\install.ps1"; Remove-Item -Recurse -Force $t
```

### Global (all projects)

**Mac/Linux/Git Bash:**
```bash
t=$(mktemp -d) && git clone --depth 1 "https://github.com/garethcheyne/DYN365CE-Modal-and-More" "$t" && bash "$t/AiSkills/ModalAndMore/scripts/install.sh" --global && rm -rf "$t"
```

**Windows (PowerShell):**
```powershell
$t="$env:TEMP\sk-$(Get-Random)"; git clone --depth 1 "https://github.com/garethcheyne/DYN365CE-Modal-and-More" $t; & "$t\AiSkills\ModalAndMore\scripts\install.ps1" -Global; Remove-Item -Recurse -Force $t
```

---

## What Gets Installed

### Per-Project

```
.claude/
├── commands/
│   └── modalandmore.md              # /modalandmore slash command
├── modalandmore-conventions.md      # Conventions (Claude)
├── modalandmore-api-reference.md    # Complete API reference
├── modalandmore-field-types.md      # All field types with examples
├── modalandmore-patterns.md         # D365 integration patterns
├── modalandmore-architecture.md     # Internal structure & dev workflow
└── modalandmore.version             # Installed version

.github/
├── modalandmore-conventions.md      # Conventions (Copilot)
├── modalandmore-api-reference.md    # Complete API reference
├── modalandmore-field-types.md      # All field types with examples
├── modalandmore-patterns.md         # D365 integration patterns
├── modalandmore-architecture.md     # Internal structure & dev workflow
└── copilot-instructions.md          # Reference appended (with markers)
```

### Global

```
~/.claude/
├── commands/
│   └── modalandmore.md              # /modalandmore slash command
├── modalandmore-conventions.md      # Conventions
├── modalandmore-api-reference.md    # Complete API reference
├── modalandmore-field-types.md      # All field types with examples
├── modalandmore-patterns.md         # D365 integration patterns
├── modalandmore-architecture.md     # Internal structure & dev workflow
└── modalandmore.version             # Installed version
```

> Copilot requires per-project install — global mode only configures Claude Code.

---

## Usage

### Claude Code

Use the `/modalandmore` slash command to get interactive help building uiLib components:

```
/modalandmore
```

Claude will ask what you're building (Toast, Modal, Wizard, Lookup, etc.) and generate correct code following all library conventions.

### GitHub Copilot

Copilot automatically reads the conventions from `.github/modalandmore-conventions.md`. Just ask it to generate uiLib code and it will follow the rules.

---

## Update

**Mac/Linux/Git Bash:**
```bash
t=$(mktemp -d) && git clone --depth 1 "https://github.com/garethcheyne/DYN365CE-Modal-and-More" "$t" && bash "$t/AiSkills/ModalAndMore/scripts/update.sh" && rm -rf "$t"
```

**Windows (PowerShell):**
```powershell
$t="$env:TEMP\sk-$(Get-Random)"; git clone --depth 1 "https://github.com/garethcheyne/DYN365CE-Modal-and-More" $t; & "$t\AiSkills\ModalAndMore\scripts\update.ps1"; Remove-Item -Recurse -Force $t
```

The updater checks versions automatically and only updates if a newer version is available. Use `--force` / `-Force` to update regardless.

---

## Uninstall

### Per-Project

```bash
rm .claude/commands/modalandmore.md
rm .claude/modalandmore-conventions.md
rm .claude/modalandmore-api-reference.md
rm .claude/modalandmore-field-types.md
rm .claude/modalandmore-patterns.md
rm .claude/modalandmore-architecture.md
rm .claude/modalandmore.version
rm .github/modalandmore-conventions.md
rm .github/modalandmore-api-reference.md
rm .github/modalandmore-field-types.md
rm .github/modalandmore-patterns.md
rm .github/modalandmore-architecture.md
# Manually remove the MODALANDMORE-AI-SKILLS block from .github/copilot-instructions.md
```

### Global

```bash
rm ~/.claude/commands/modalandmore.md
rm ~/.claude/modalandmore-conventions.md
rm ~/.claude/modalandmore-api-reference.md
rm ~/.claude/modalandmore-field-types.md
rm ~/.claude/modalandmore-patterns.md
rm ~/.claude/modalandmore-architecture.md
rm ~/.claude/modalandmore.version
```

---

## Skill Contents

| File | Purpose |
|------|---------|
| `VERSION` | Version in `yyyy.mm.dd.HHMM` format |
| `modalandmore.md` | Claude Code `/modalandmore` slash command |
| `modalandmore-conventions.md` | Knowledge base — all rules, examples, API patterns |
| `copilot-instructions.md` | Copilot snippet with `MODALANDMORE` markers |
| `SKILL.md` | Skill entry point with applyTo frontmatter |
| `API_REFERENCE.md` | Complete API reference |
| `FIELD_TYPES.md` | All field types with config and value shapes |
| `PATTERNS.md` | D365 integration patterns and recipes |
| `ARCHITECTURE.md` | Internal structure and dev workflow |
| `scripts/install.sh` | Bash installer |
| `scripts/install.ps1` | PowerShell installer |
| `scripts/update.sh` | Bash updater with version checking |
| `scripts/update.ps1` | PowerShell updater with version checking |
