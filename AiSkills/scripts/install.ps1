# uiLib AI Skills Installer
# Registers AiSkills with Claude Code (CLAUDE.md) and GitHub Copilot (.github/copilot-instructions.md)
#
# Usage:
#   .\AiSkills\scripts\install.ps1              # Project-level (run from repo root)
#   .\AiSkills\scripts\install.ps1 -Global      # Global (user-level for all projects)

param(
    [string]$Target,
    [switch]$Global
)

$ErrorActionPreference = "Stop"

# Resolve paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AiSkillsDir = Split-Path -Parent $ScriptDir

# Auto-detect repo root (parent of AiSkills/)
if (-not $Target) {
    $Target = Split-Path -Parent $AiSkillsDir
}

$Target = (Resolve-Path $Target).Path

Write-Host ""
Write-Host "uiLib AI Skills Installer" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

$Installed = 0

if ($Global) {
    Write-Host "Mode: GLOBAL (user-level - applies to all projects)" -ForegroundColor Yellow
    Write-Host ""

    # ─────────────────────────────────────────────
    # Global: Claude Code — ~/.claude/CLAUDE.md
    # ─────────────────────────────────────────────
    $ClaudeGlobalDir = Join-Path $HOME ".claude"
    $ClaudeGlobal = Join-Path $ClaudeGlobalDir "CLAUDE.md"

    if (-not (Test-Path $ClaudeGlobalDir)) {
        New-Item -ItemType Directory -Path $ClaudeGlobalDir -Force | Out-Null
    }

    $SkillSnippet = @"

## uiLib (D365 UI Library)

When working on projects using the uiLib / err403 Dynamics 365 UI library, refer to the ``AiSkills/`` directory in the project root for API docs, field types, patterns, and architecture.

Key rules:
- Buttons MUST use constructor: ``new uiLib.Button({ label, callback, id })``
- Use ``callback`` not ``onClick``; ``setFocus: true`` not ``type: 'primary'``
- Tabs use ``asTabs: true`` inside ``fields`` — no top-level ``tabs`` property
- Custom fields use ``type: 'custom'`` with ``html`` or ``render``
- Return ``true`` from callback to close modal, ``false`` to keep open
"@

    if ((Test-Path $ClaudeGlobal) -and (Get-Content $ClaudeGlobal -Raw) -match "uiLib") {
        Write-Host "[Claude Code] uiLib reference already in $ClaudeGlobal — skipping" -ForegroundColor DarkGray
    } else {
        Write-Host "[Claude Code] Appending uiLib reference to $ClaudeGlobal..." -ForegroundColor Yellow
        Add-Content -Path $ClaudeGlobal -Value $SkillSnippet -Encoding UTF8
        Write-Host "[Claude Code] Updated: $ClaudeGlobal" -ForegroundColor Green
        $Installed++
    }

    # ─────────────────────────────────────────────
    # Global: Copilot — VS Code user settings guidance
    # ─────────────────────────────────────────────
    Write-Host ""
    Write-Host "[Copilot] Global Copilot instructions require VS Code settings." -ForegroundColor Yellow
    Write-Host "  Add this to your VS Code settings.json (Ctrl+Shift+P -> 'Preferences: Open User Settings (JSON)'):" -ForegroundColor White
    Write-Host ""
    Write-Host '  "github.copilot.chat.codeGeneration.instructions": [' -ForegroundColor Cyan
    Write-Host '    { "text": "When using the uiLib D365 library: always use new uiLib.Button() constructor (never plain objects), use callback not onClick, use setFocus not type:primary, tabs use asTabs:true inside fields array, custom fields use type:custom with html or render property. Read AiSkills/ directory for full API docs." }' -ForegroundColor Cyan
    Write-Host '  ]' -ForegroundColor Cyan
    Write-Host ""

} else {
    Write-Host "Mode: PROJECT (this repo only)" -ForegroundColor Yellow
    Write-Host "Target: $Target" -ForegroundColor DarkGray
    Write-Host ""

    # ─────────────────────────────────────────────
    # Project: Claude Code — CLAUDE.md at repo root
    # ─────────────────────────────────────────────
    $ClaudeTarget = Join-Path $Target "CLAUDE.md"
    $ClaudeContent = @"
# Project Context for Claude

This is a UI component library for Microsoft Dynamics 365 CE (uiLib).

## AI Skills Reference

Detailed documentation lives in the ``AiSkills/`` directory. Read these files before generating or modifying library code:

| File | Contents |
|------|----------|
| [AiSkills/SKILL.md](AiSkills/SKILL.md) | Overview, critical API rules, quick examples |
| [AiSkills/API_REFERENCE.md](AiSkills/API_REFERENCE.md) | Complete API — all classes, methods, properties, return types |
| [AiSkills/FIELD_TYPES.md](AiSkills/FIELD_TYPES.md) | Every field type with config, examples, and value shapes |
| [AiSkills/PATTERNS.md](AiSkills/PATTERNS.md) | D365 integration patterns and real-world recipes |
| [AiSkills/ARCHITECTURE.md](AiSkills/ARCHITECTURE.md) | Internal structure, build system, and dev workflow |

## Critical Rules

1. Buttons MUST use constructor: ``new uiLib.Button({ label, callback, id })`` — never plain objects
2. Use ``callback`` not ``onClick``; ``setFocus: true`` not ``type: 'primary'``
3. Tabs use ``asTabs: true`` inside ``fields`` — no top-level ``tabs`` property
4. Custom fields use ``type: 'custom'`` with ``html`` or ``render`` — NOT ``type: 'html'``
5. Return ``true`` from callback to close modal, ``false`` to keep open
6. Always provide explicit button IDs for reliable ``getButton()`` lookups

## Quick Start

``````javascript
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
``````
"@

    Write-Host "[Claude Code] Creating CLAUDE.md..." -ForegroundColor Yellow
    Set-Content -Path $ClaudeTarget -Value $ClaudeContent -Encoding UTF8
    Write-Host "[Claude Code] Created: $ClaudeTarget" -ForegroundColor Green
    $Installed++

    # ─────────────────────────────────────────────
    # Project: Copilot — append to .github/copilot-instructions.md
    # ─────────────────────────────────────────────
    $CopilotDir = Join-Path $Target ".github"
    $CopilotTarget = Join-Path $CopilotDir "copilot-instructions.md"

    if (Test-Path $CopilotTarget) {
        $CopilotContent = Get-Content $CopilotTarget -Raw

        if ($CopilotContent -match "AiSkills/SKILL\.md") {
            Write-Host "[Copilot] Skill reference already present — skipping" -ForegroundColor DarkGray
        } else {
            $SkillRef = @"


## AI Skills Reference

> For detailed API docs, field types, patterns, and architecture, see the ``AiSkills/`` directory:
> - [AiSkills/SKILL.md](../AiSkills/SKILL.md) — Overview and critical rules
> - [AiSkills/API_REFERENCE.md](../AiSkills/API_REFERENCE.md) — Complete API reference
> - [AiSkills/FIELD_TYPES.md](../AiSkills/FIELD_TYPES.md) — All field types with examples
> - [AiSkills/PATTERNS.md](../AiSkills/PATTERNS.md) — D365 integration patterns
> - [AiSkills/ARCHITECTURE.md](../AiSkills/ARCHITECTURE.md) — Internal architecture and dev workflow
"@
            Write-Host "[Copilot] Appending skill reference to copilot-instructions.md..." -ForegroundColor Yellow
            Add-Content -Path $CopilotTarget -Value $SkillRef -Encoding UTF8
            Write-Host "[Copilot] Updated: $CopilotTarget" -ForegroundColor Green
            $Installed++
        }
    } else {
        Write-Host "[Copilot] copilot-instructions.md not found — skipping" -ForegroundColor DarkGray
        Write-Host "         Create .github/copilot-instructions.md first, then re-run." -ForegroundColor DarkGray
    }
}

# ─────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────
Write-Host ""
if ($Installed -gt 0) {
    Write-Host "Done! $Installed AI system(s) configured." -ForegroundColor Green
} else {
    Write-Host "No changes made (already installed or missing prerequisites)." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "Verification:" -ForegroundColor Cyan
Write-Host "  Claude Code  — CLAUDE.md at repo root (project) or ~/.claude/CLAUDE.md (global)"
Write-Host "  Copilot      — .github/copilot-instructions.md references AiSkills/"
Write-Host ""
