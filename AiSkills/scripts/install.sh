#!/bin/bash
# uiLib AI Skills Installer
# Registers AiSkills with Claude Code (CLAUDE.md) and GitHub Copilot (.github/copilot-instructions.md)
#
# Usage:
#   ./AiSkills/scripts/install.sh              # Project-level (run from repo root)
#   ./AiSkills/scripts/install.sh --global     # Global (user-level for all projects)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m'

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AISKILLS_DIR="$(dirname "$SCRIPT_DIR")"

GLOBAL_MODE=false
if [ "${1:-}" = "--global" ] || [ "${1:-}" = "-g" ]; then
    GLOBAL_MODE=true
fi

# Auto-detect repo root (parent of AiSkills/)
TARGET="$(dirname "$AISKILLS_DIR")"

echo ""
echo -e "${CYAN}uiLib AI Skills Installer${NC}"
echo -e "${CYAN}=========================${NC}"

INSTALLED=0

if [ "$GLOBAL_MODE" = true ]; then
    echo -e "${YELLOW}Mode: GLOBAL (user-level — applies to all projects)${NC}"
    echo ""

    # ─────────────────────────────────────────────
    # Global: Claude Code — ~/.claude/CLAUDE.md
    # ─────────────────────────────────────────────
    CLAUDE_GLOBAL_DIR="$HOME/.claude"
    CLAUDE_GLOBAL="$CLAUDE_GLOBAL_DIR/CLAUDE.md"

    mkdir -p "$CLAUDE_GLOBAL_DIR"

    SKILL_SNIPPET="

## uiLib (D365 UI Library)

When working on projects using the uiLib / err403 Dynamics 365 UI library, refer to the \`AiSkills/\` directory in the project root for API docs, field types, patterns, and architecture.

Key rules:
- Buttons MUST use constructor: \`new uiLib.Button({ label, callback, id })\`
- Use \`callback\` not \`onClick\`; \`setFocus: true\` not \`type: 'primary'\`
- Tabs use \`asTabs: true\` inside \`fields\` — no top-level \`tabs\` property
- Custom fields use \`type: 'custom'\` with \`html\` or \`render\`
- Return \`true\` from callback to close modal, \`false\` to keep open"

    if [ -f "$CLAUDE_GLOBAL" ] && grep -q "uiLib" "$CLAUDE_GLOBAL" 2>/dev/null; then
        echo -e "${DIM}[Claude Code] uiLib reference already in $CLAUDE_GLOBAL — skipping${NC}"
    else
        echo -e "${YELLOW}[Claude Code] Appending uiLib reference to $CLAUDE_GLOBAL...${NC}"
        echo "$SKILL_SNIPPET" >> "$CLAUDE_GLOBAL"
        echo -e "${GREEN}[Claude Code] Updated: $CLAUDE_GLOBAL${NC}"
        INSTALLED=$((INSTALLED + 1))
    fi

    # ─────────────────────────────────────────────
    # Global: Copilot — VS Code user settings
    # ─────────────────────────────────────────────
    echo ""
    echo -e "${YELLOW}[Copilot] Global Copilot instructions require VS Code settings.${NC}"
    echo -e "  Add this to your VS Code settings.json (Ctrl+Shift+P → 'Preferences: Open User Settings (JSON)'):"
    echo ""
    echo -e "  ${CYAN}\"github.copilot.chat.codeGeneration.instructions\": [${NC}"
    echo -e "  ${CYAN}  { \"text\": \"When using the uiLib D365 library: always use new uiLib.Button() constructor (never plain objects), use callback not onClick, use setFocus not type:primary, tabs use asTabs:true inside fields array, custom fields use type:custom with html or render property. Read AiSkills/ directory for full API docs.\" }${NC}"
    echo -e "  ${CYAN}]${NC}"
    echo ""

else
    echo -e "${YELLOW}Mode: PROJECT (this repo only)${NC}"
    echo -e "${DIM}Target: $TARGET${NC}"
    echo ""

    # ─────────────────────────────────────────────
    # Project: Claude Code — CLAUDE.md at repo root
    # ─────────────────────────────────────────────
    CLAUDE_TARGET="$TARGET/CLAUDE.md"

    cat > "$CLAUDE_TARGET" << 'CLAUDEEOF'
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
CLAUDEEOF

    echo -e "${GREEN}[Claude Code] Created: $CLAUDE_TARGET${NC}"
    INSTALLED=$((INSTALLED + 1))

    # ─────────────────────────────────────────────
    # Project: Copilot — append to .github/copilot-instructions.md
    # ─────────────────────────────────────────────
    COPILOT_TARGET="$TARGET/.github/copilot-instructions.md"

    if [ -f "$COPILOT_TARGET" ]; then
        if grep -q "AiSkills/SKILL\.md" "$COPILOT_TARGET" 2>/dev/null; then
            echo -e "${DIM}[Copilot] Skill reference already present — skipping${NC}"
        else
            cat >> "$COPILOT_TARGET" << 'COPILOTEOF'


## AI Skills Reference

> For detailed API docs, field types, patterns, and architecture, see the `AiSkills/` directory:
> - [AiSkills/SKILL.md](../AiSkills/SKILL.md) — Overview and critical rules
> - [AiSkills/API_REFERENCE.md](../AiSkills/API_REFERENCE.md) — Complete API reference
> - [AiSkills/FIELD_TYPES.md](../AiSkills/FIELD_TYPES.md) — All field types with examples
> - [AiSkills/PATTERNS.md](../AiSkills/PATTERNS.md) — D365 integration patterns
> - [AiSkills/ARCHITECTURE.md](../AiSkills/ARCHITECTURE.md) — Internal architecture and dev workflow
COPILOTEOF
            echo -e "${GREEN}[Copilot] Updated: $COPILOT_TARGET${NC}"
            INSTALLED=$((INSTALLED + 1))
        fi
    else
        echo -e "${DIM}[Copilot] No .github/copilot-instructions.md found — skipping${NC}"
        echo -e "${DIM}         Create it first, then re-run.${NC}"
    fi
fi

# ─────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────
echo ""
if [ "$INSTALLED" -gt 0 ]; then
    echo -e "${GREEN}Done! $INSTALLED AI system(s) configured.${NC}"
else
    echo -e "${YELLOW}No changes made (already installed or missing prerequisites).${NC}"
fi
echo ""
echo -e "${CYAN}Verification:${NC}"
echo "  Claude Code  — CLAUDE.md at repo root (project) or ~/.claude/CLAUDE.md (global)"
echo "  Copilot      — .github/copilot-instructions.md references AiSkills/"
echo ""
