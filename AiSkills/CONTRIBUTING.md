# Contributing: How to Create a Skill

This guide is the **complete blueprint** for creating AI skills. An AI agent or developer can follow this document to create a new skill from scratch, including all install and update scripts.

Drop this file into any project to enable AI-assisted skill creation.

---

## What is a Skill?

A skill is a set of **markdown files** that teach AI assistants (Claude Code, GitHub Copilot) how to do something. No servers, no dependencies — just files that get copied to the right place.

Each skill lives in its own subdirectory under the repository root:

```
AiSkills/
├── CONTRIBUTING.md          ← You are here
├── README.md                ← Repository overview
├── NextDocs/                ← Example skill
├── AnotherSkill/            ← Another skill
└── YetAnother/              ← And another
```

---

## Skill Directory Structure

Every skill **must** follow this layout:

```
SkillName/
├── VERSION                        # Version file (required)
├── README.md                      # User-facing documentation (required)
├── {skill-name}.md                # Claude Code slash command (required)
├── {skill-name}-conventions.md    # Knowledge/conventions file (required)
├── copilot-instructions.md        # Copilot instruction snippet (required)
└── scripts/                       # Installation scripts (required)
    ├── install.sh                 # Mac/Linux/Git Bash installer
    ├── install.ps1                # Windows PowerShell installer
    ├── update.sh                  # Mac/Linux/Git Bash updater
    └── update.ps1                 # Windows PowerShell updater
```

### Required Files

#### `VERSION`

A plain text file with a single line — the version in `yyyy.mm.dd.HHMM` format:

```
2026.03.17.2039
```

This format ensures versions are always sortable and newer versions are always "greater than" older ones. Update the version whenever you make changes.

The install and update scripts copy this file alongside the skill files so the updater can compare versions and skip unnecessary updates.

#### `README.md`

User-facing documentation. Must include:
- What the skill does
- Installation commands (global + per-project)
- Usage instructions for both Claude Code and Copilot
- Update commands
- Uninstall instructions
- What files get installed where

#### `{skill-name}.md` — Slash Command

This becomes the Claude Code slash command (e.g., `/nextdocs`). It should:
1. Confirm the working directory
2. Read the conventions file
3. Ask setup questions
4. Analyze the project
5. Propose a plan
6. Execute after confirmation

The file is installed to:
- **Global**: `~/.claude/commands/{skill-name}.md`
- **Per-project**: `.claude/commands/{skill-name}.md`

#### `{skill-name}-conventions.md` — Knowledge File

The actual knowledge base — conventions, rules, examples. This is the single source of truth that both Claude Code and Copilot read.

Installed to:
- **Claude Code (global)**: `~/.claude/{skill-name}-conventions.md`
- **Claude Code (per-project)**: `.claude/{skill-name}-conventions.md`
- **Copilot (per-project only)**: `.github/{skill-name}-conventions.md`

#### `copilot-instructions.md` — Copilot Snippet

A small markdown fragment that gets **appended** (not overwritten) to the user's `.github/copilot-instructions.md`. Must use markers for safe updates:

```markdown
<!-- SKILLNAME-AI-SKILLS-START -->
<!-- Managed by SkillName AI Skills - https://github.com/your/repo -->

## Skill Title

When doing X, read and follow the conventions in `.github/{skill-name}-conventions.md`.

Key rules:
- Rule 1
- Rule 2
- Rule 3

<!-- SKILLNAME-AI-SKILLS-END -->
```

**Important**: The markers must be unique per skill (e.g., `NEXTDOCS-AI-SKILLS-START`, `MYSKILL-AI-SKILLS-START`).

---

## Install Script Behaviour

### Install Modes

| Mode | Flag | Claude Code | Copilot |
|------|------|-------------|---------|
| **Global** | `--global` / `-Global` | `~/.claude/` | Skipped (requires per-project) |
| **Per-project** | (default) | `.claude/` | `.github/` |

### What Install Scripts Must Do

1. **Copy the slash command** → `commands/{skill-name}.md`
2. **Copy the conventions file** → `{skill-name}-conventions.md`
3. **Copy the VERSION file** → `{skill-name}.version`
4. **For per-project: copy conventions to `.github/`**
5. **For per-project: smart-merge copilot snippet**
   - If markers exist → replace the block between markers
   - If no markers → append to end of file
   - If file doesn't exist → create it

### Smart Merge Rules

The Copilot snippet uses HTML comment markers to allow safe updates without destroying user content:

```
<!-- SKILLNAME-AI-SKILLS-START -->
...skill content...
<!-- SKILLNAME-AI-SKILLS-END -->
```

- **Install**: Append if markers don't exist, replace if they do
- **Update**: Replace the marker block with new content
- **Uninstall**: Remove the marker block

### Install Locations Summary

**Global install** (`--global`):
```
~/.claude/
├── commands/
│   └── {skill-name}.md              # Slash command
├── {skill-name}-conventions.md      # Conventions
└── {skill-name}.version             # Installed version
```

**Per-project install** (default):
```
.claude/
├── commands/
│   └── {skill-name}.md              # Slash command
├── {skill-name}-conventions.md      # Conventions
└── {skill-name}.version             # Installed version

.github/
├── {skill-name}-conventions.md      # Conventions (Copilot copy)
└── copilot-instructions.md          # Reference appended
```

---

## Install Script Templates

### install.sh (Bash)

Use this as the template for `scripts/install.sh`. Replace all `{SKILL}` placeholders.

| Placeholder | Example | Description |
|-------------|---------|-------------|
| `{SKILL}` | `nextdocs` | Lowercase skill name for filenames |
| `{SKILL_DISPLAY}` | `NextDocs` | Display name for output messages |
| `{MARKER_ID}` | `NEXTDOCS` | Uppercase ID for HTML comment markers |

```bash
#!/bin/bash
# {SKILL_DISPLAY} AI Skills Installer

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
NC='\033[0m'

# Markers for Copilot instructions (unique per skill)
MARKER_START="<!-- {MARKER_ID}-AI-SKILLS-START -->"
MARKER_END="<!-- {MARKER_ID}-AI-SKILLS-END -->"

# Parse arguments
GLOBAL=false
TARGET="$(pwd)"

while [[ $# -gt 0 ]]; do
    case $1 in
        --global|-g) GLOBAL=true; shift ;;
        *)           TARGET="$1"; shift ;;
    esac
done

# Find source files (relative to this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
SLASH_COMMAND="$REPO_ROOT/{SKILL}.md"
CONVENTIONS="$REPO_ROOT/{SKILL}-conventions.md"
COPILOT_SNIPPET="$REPO_ROOT/copilot-instructions.md"
VERSION_FILE="$REPO_ROOT/VERSION"

# ── Copilot snippet merge function ──────────────────────────
# This safely inserts/replaces the skill's block in copilot-instructions.md
# without touching any other content in the file.
install_copilot_snippet() {
    local target_file="$1"
    local source_file="$2"
    mkdir -p "$(dirname "$target_file")"

    if [ -f "$target_file" ]; then
        if grep -q "$MARKER_START" "$target_file"; then
            # Markers found → replace the block between them
            echo -e "${YELLOW}[Copilot] Updating existing reference...${NC}"
            local escaped_start escaped_end
            escaped_start=$(printf '%s\n' "$MARKER_START" | sed 's/[[\\.*/^$]/\\&/g')
            escaped_end=$(printf '%s\n' "$MARKER_END" | sed 's/[[\\.*/^$]/\\&/g')

            # Delete old block
            sed "/${escaped_start}/,/${escaped_end}/d" "$target_file" > "$target_file.tmp"
            # Remove trailing blank lines
            sed -i -e :a -e '/^\n*$/{$d;N;ba' -e '}' "$target_file.tmp" 2>/dev/null || true
            # Append new block
            echo "" >> "$target_file.tmp"
            cat "$source_file" >> "$target_file.tmp"
            mv "$target_file.tmp" "$target_file"
            echo -e "${GREEN}[Copilot] Updated${NC}"
        else
            # No markers → append to end
            echo -e "${YELLOW}[Copilot] Adding reference to existing file...${NC}"
            echo "" >> "$target_file"
            cat "$source_file" >> "$target_file"
            echo -e "${GREEN}[Copilot] Added${NC}"
        fi
    else
        # File doesn't exist → create it
        echo -e "${YELLOW}[Copilot] Creating copilot-instructions.md...${NC}"
        cp "$source_file" "$target_file"
        echo -e "${GREEN}[Copilot] Done${NC}"
    fi
}

# ── Main ────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}{SKILL_DISPLAY} AI Skills Installer${NC}"
echo -e "${CYAN}$(printf '=%.0s' $(seq 1 $((${#SKILL_DISPLAY} + 20))))${NC}"
echo ""

if [ "$GLOBAL" = true ]; then
    echo -e "${MAGENTA}Mode: Global (all projects)${NC}"
    echo ""
    CLAUDE_DIR="$HOME/.claude"

    # 1. Slash command
    if [ -f "$SLASH_COMMAND" ]; then
        mkdir -p "$CLAUDE_DIR/commands"
        cp "$SLASH_COMMAND" "$CLAUDE_DIR/commands/{SKILL}.md"
        echo -e "${GREEN}[Claude] Installed /{SKILL} command${NC}"
    fi

    # 2. Conventions
    if [ -f "$CONVENTIONS" ]; then
        cp "$CONVENTIONS" "$CLAUDE_DIR/{SKILL}-conventions.md"
        echo -e "${GREEN}[Claude] Installed conventions${NC}"
    fi

    # 3. Version tracker
    if [ -f "$VERSION_FILE" ]; then
        cp "$VERSION_FILE" "$CLAUDE_DIR/{SKILL}.version"
        echo -e "${GREEN}[Version] v$(cat "$VERSION_FILE" | tr -d '\n')${NC}"
    fi

    echo ""
    echo -e "${GRAY}[Copilot] Skipped — requires per-project install${NC}"
else
    echo -e "${MAGENTA}Mode: Per-project${NC}"
    echo ""
    CLAUDE_DIR="$TARGET/.claude"
    GITHUB_DIR="$TARGET/.github"

    # 1. Slash command
    if [ -f "$SLASH_COMMAND" ]; then
        mkdir -p "$CLAUDE_DIR/commands"
        cp "$SLASH_COMMAND" "$CLAUDE_DIR/commands/{SKILL}.md"
        echo -e "${GREEN}[Claude] Installed /{SKILL} command${NC}"
    fi

    # 2. Conventions (Claude)
    if [ -f "$CONVENTIONS" ]; then
        cp "$CONVENTIONS" "$CLAUDE_DIR/{SKILL}-conventions.md"
        echo -e "${GREEN}[Claude] Installed conventions${NC}"
    fi

    # 3. Conventions (Copilot)
    if [ -f "$CONVENTIONS" ]; then
        mkdir -p "$GITHUB_DIR"
        cp "$CONVENTIONS" "$GITHUB_DIR/{SKILL}-conventions.md"
        echo -e "${GREEN}[Copilot] Installed conventions${NC}"
    fi

    # 4. Copilot snippet (smart merge)
    if [ -f "$COPILOT_SNIPPET" ]; then
        install_copilot_snippet "$GITHUB_DIR/copilot-instructions.md" "$COPILOT_SNIPPET"
    fi

    # 5. Version tracker
    if [ -f "$VERSION_FILE" ]; then
        cp "$VERSION_FILE" "$CLAUDE_DIR/{SKILL}.version"
        echo -e "${GREEN}[Version] v$(cat "$VERSION_FILE" | tr -d '\n')${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Installation complete!${NC}"
echo ""
```

### install.ps1 (PowerShell)

```powershell
# {SKILL_DISPLAY} AI Skills Installer

param(
    [switch]$Global,
    [string]$Target = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

# Markers for Copilot instructions (unique per skill)
$MarkerStart = "<!-- {MARKER_ID}-AI-SKILLS-START -->"
$MarkerEnd = "<!-- {MARKER_ID}-AI-SKILLS-END -->"

# Find source files
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$SlashCommand = Join-Path $RepoRoot "{SKILL}.md"
$Conventions = Join-Path $RepoRoot "{SKILL}-conventions.md"
$CopilotSnippet = Join-Path $RepoRoot "copilot-instructions.md"
$VersionFile = Join-Path $RepoRoot "VERSION"

# ── Copilot snippet merge function ──────────────────────────
function Install-CopilotSnippet {
    param([string]$TargetFile, [string]$SourceFile)

    $TargetDir = Split-Path -Parent $TargetFile
    if (-not (Test-Path $TargetDir)) {
        New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    }

    $SourceContent = Get-Content -Path $SourceFile -Raw

    if (Test-Path $TargetFile) {
        $ExistingContent = Get-Content -Path $TargetFile -Raw

        if ($ExistingContent -match [regex]::Escape($MarkerStart)) {
            # Markers found → replace the block
            Write-Host "[Copilot] Updating existing reference..." -ForegroundColor Yellow
            $Pattern = "(?s)$([regex]::Escape($MarkerStart)).*?$([regex]::Escape($MarkerEnd))"
            $NewContent = $ExistingContent -replace $Pattern, $SourceContent.TrimEnd()
            Set-Content -Path $TargetFile -Value $NewContent -NoNewline
            Write-Host "[Copilot] Updated" -ForegroundColor Green
        } else {
            # No markers → append
            Write-Host "[Copilot] Adding reference to existing file..." -ForegroundColor Yellow
            $Combined = $ExistingContent.TrimEnd() + "`n`n" + $SourceContent
            Set-Content -Path $TargetFile -Value $Combined -NoNewline
            Write-Host "[Copilot] Added" -ForegroundColor Green
        }
    } else {
        # Create new file
        Write-Host "[Copilot] Creating copilot-instructions.md..." -ForegroundColor Yellow
        Copy-Item -Path $SourceFile -Destination $TargetFile -Force
        Write-Host "[Copilot] Done" -ForegroundColor Green
    }
}

# ── Main ────────────────────────────────────────────────────
Write-Host ""
Write-Host "{SKILL_DISPLAY} AI Skills Installer" -ForegroundColor Cyan
Write-Host ("=" * ("{SKILL_DISPLAY} AI Skills Installer".Length)) -ForegroundColor Cyan
Write-Host ""

if ($Global) {
    Write-Host "Mode: Global (all projects)" -ForegroundColor Magenta
    Write-Host ""
    $ClaudeDir = Join-Path $env:USERPROFILE ".claude"

    # 1. Slash command
    if (Test-Path $SlashCommand) {
        $CmdsDir = Join-Path $ClaudeDir "commands"
        if (-not (Test-Path $CmdsDir)) { New-Item -ItemType Directory -Path $CmdsDir -Force | Out-Null }
        Copy-Item -Path $SlashCommand -Destination (Join-Path $CmdsDir "{SKILL}.md") -Force
        Write-Host "[Claude] Installed /{SKILL} command" -ForegroundColor Green
    }

    # 2. Conventions
    if (Test-Path $Conventions) {
        Copy-Item -Path $Conventions -Destination (Join-Path $ClaudeDir "{SKILL}-conventions.md") -Force
        Write-Host "[Claude] Installed conventions" -ForegroundColor Green
    }

    # 3. Version tracker
    if (Test-Path $VersionFile) {
        $Ver = (Get-Content $VersionFile -Raw).Trim()
        Copy-Item -Path $VersionFile -Destination (Join-Path $ClaudeDir "{SKILL}.version") -Force
        Write-Host "[Version] v$Ver" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "[Copilot] Skipped - requires per-project install" -ForegroundColor DarkGray

} else {
    Write-Host "Mode: Per-project" -ForegroundColor Magenta
    Write-Host ""
    $ClaudeDir = Join-Path $Target ".claude"
    $GitHubDir = Join-Path $Target ".github"

    # 1. Slash command
    if (Test-Path $SlashCommand) {
        $CmdsDir = Join-Path $ClaudeDir "commands"
        if (-not (Test-Path $CmdsDir)) { New-Item -ItemType Directory -Path $CmdsDir -Force | Out-Null }
        Copy-Item -Path $SlashCommand -Destination (Join-Path $CmdsDir "{SKILL}.md") -Force
        Write-Host "[Claude] Installed /{SKILL} command" -ForegroundColor Green
    }

    # 2. Conventions (Claude)
    if (Test-Path $Conventions) {
        if (-not (Test-Path $ClaudeDir)) { New-Item -ItemType Directory -Path $ClaudeDir -Force | Out-Null }
        Copy-Item -Path $Conventions -Destination (Join-Path $ClaudeDir "{SKILL}-conventions.md") -Force
        Write-Host "[Claude] Installed conventions" -ForegroundColor Green
    }

    # 3. Conventions (Copilot)
    if (Test-Path $Conventions) {
        if (-not (Test-Path $GitHubDir)) { New-Item -ItemType Directory -Path $GitHubDir -Force | Out-Null }
        Copy-Item -Path $Conventions -Destination (Join-Path $GitHubDir "{SKILL}-conventions.md") -Force
        Write-Host "[Copilot] Installed conventions" -ForegroundColor Green
    }

    # 4. Copilot snippet (smart merge)
    if (Test-Path $CopilotSnippet) {
        Install-CopilotSnippet -TargetFile (Join-Path $GitHubDir "copilot-instructions.md") -SourceFile $CopilotSnippet
    }

    # 5. Version tracker
    if (Test-Path $VersionFile) {
        $Ver = (Get-Content $VersionFile -Raw).Trim()
        Copy-Item -Path $VersionFile -Destination (Join-Path $ClaudeDir "{SKILL}.version") -Force
        Write-Host "[Version] v$Ver" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
```

---

## Update Script Behaviour

### Version Checking

Update scripts **must** compare the source `VERSION` file against the installed `{skill-name}.version` file:

1. Read source version from `SkillName/VERSION`
2. Read installed version from `~/.claude/{skill-name}.version` (global) or `.claude/{skill-name}.version` (project)
3. If source is **newer** → update all files
4. If versions **match** → print "already up to date" and skip
5. If installed version is **missing** → treat as outdated, update all files
6. If source is **older** → warn and skip (unless `--force`)

### What Update Scripts Must Do

1. **Check version** — skip if already current
2. **Copy slash command** (overwrite)
3. **Copy conventions file** (overwrite)
4. **Copy VERSION file** (overwrite)
5. **For per-project: copy conventions to `.github/`** (overwrite)
6. **For per-project: update Copilot snippet** (replace marker block)
7. **Print summary** — what was updated, old version → new version

---

## Update Script Templates

### update.sh (Bash)

```bash
#!/bin/bash
# {SKILL_DISPLAY} AI Skills Updater (with version checking)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m'

MARKER_START="<!-- {MARKER_ID}-AI-SKILLS-START -->"
MARKER_END="<!-- {MARKER_ID}-AI-SKILLS-END -->"

# Parse arguments
GLOBAL=false
FORCE=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --global|-g) GLOBAL=true; shift ;;
        --force|-f)  FORCE=true; shift ;;
        *)           shift ;;
    esac
done

# Source files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
SLASH_COMMAND="$REPO_ROOT/{SKILL}.md"
CONVENTIONS="$REPO_ROOT/{SKILL}-conventions.md"
COPILOT_SNIPPET="$REPO_ROOT/copilot-instructions.md"
VERSION_FILE="$REPO_ROOT/VERSION"

# ── Version comparison ──────────────────────────────────────
# Returns 0 (true) if $1 is strictly greater than $2
version_gt() {
    [ "$1" != "$2" ] && [ "$(printf '%s\n' "$1" "$2" | sort -V | tail -n1)" = "$1" ]
}

# ── Copilot snippet merge (same as install) ─────────────────
update_copilot_snippet() {
    local target_file="$1" source_file="$2"
    [ ! -f "$target_file" ] && return 1

    if grep -q "$MARKER_START" "$target_file"; then
        local escaped_start escaped_end
        escaped_start=$(printf '%s\n' "$MARKER_START" | sed 's/[[\\.*/^$]/\\&/g')
        escaped_end=$(printf '%s\n' "$MARKER_END" | sed 's/[[\\.*/^$]/\\&/g')
        sed "/${escaped_start}/,/${escaped_end}/d" "$target_file" > "$target_file.tmp"
        sed -i -e :a -e '/^\n*$/{$d;N;ba' -e '}' "$target_file.tmp" 2>/dev/null || true
        echo "" >> "$target_file.tmp"
        cat "$source_file" >> "$target_file.tmp"
        mv "$target_file.tmp" "$target_file"
        return 0
    fi
    return 1
}

# ── Main ────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}{SKILL_DISPLAY} AI Skills Updater${NC}"
echo ""

# Read source version
SOURCE_VERSION=""
if [ -f "$VERSION_FILE" ]; then
    SOURCE_VERSION=$(cat "$VERSION_FILE" | tr -d '\n\r ')
fi
if [ -z "$SOURCE_VERSION" ]; then
    echo -e "${RED}Error: VERSION file not found${NC}"; exit 1
fi

# Determine install location
if [ "$GLOBAL" = true ]; then
    CLAUDE_DIR="$HOME/.claude"
else
    TARGET="$(pwd)"
    CLAUDE_DIR="$TARGET/.claude"
    GITHUB_DIR="$TARGET/.github"
fi

INSTALLED_VERSION_FILE="$CLAUDE_DIR/{SKILL}.version"

# Read installed version
INSTALLED_VERSION=""
if [ -f "$INSTALLED_VERSION_FILE" ]; then
    INSTALLED_VERSION=$(cat "$INSTALLED_VERSION_FILE" | tr -d '\n\r ')
fi

# ── Version decision ────────────────────────────────────────
if [ -n "$INSTALLED_VERSION" ] && [ "$FORCE" = false ]; then
    if [ "$SOURCE_VERSION" = "$INSTALLED_VERSION" ]; then
        echo -e "${GREEN}Already up to date (v${INSTALLED_VERSION})${NC}"
        echo -e "${GRAY}Use --force to update anyway${NC}"
        echo ""; exit 0
    fi
    if version_gt "$SOURCE_VERSION" "$INSTALLED_VERSION"; then
        echo -e "${CYAN}Updating: v${INSTALLED_VERSION} → v${SOURCE_VERSION}${NC}"
    else
        echo -e "${YELLOW}Source (v${SOURCE_VERSION}) is older than installed (v${INSTALLED_VERSION})${NC}"
        echo -e "${GRAY}Use --force to downgrade${NC}"
        echo ""; exit 0
    fi
elif [ -z "$INSTALLED_VERSION" ]; then
    echo -e "${YELLOW}No version found — updating all files${NC}"
else
    echo -e "${YELLOW}Force update to v${SOURCE_VERSION}${NC}"
fi
echo ""

# ── Apply updates ───────────────────────────────────────────
updated=0

if [ "$GLOBAL" = true ]; then
    # Slash command
    if [ -f "$CLAUDE_DIR/commands/{SKILL}.md" ]; then
        cp "$SLASH_COMMAND" "$CLAUDE_DIR/commands/{SKILL}.md"
        echo -e "${GREEN}✓ Updated slash command${NC}"; ((updated++))
    fi
    # Conventions
    if [ -f "$CLAUDE_DIR/{SKILL}-conventions.md" ]; then
        cp "$CONVENTIONS" "$CLAUDE_DIR/{SKILL}-conventions.md"
        echo -e "${GREEN}✓ Updated conventions${NC}"; ((updated++))
    fi
else
    # Claude slash command
    if [ -f "$CLAUDE_DIR/commands/{SKILL}.md" ]; then
        cp "$SLASH_COMMAND" "$CLAUDE_DIR/commands/{SKILL}.md"
        echo -e "${GREEN}✓ Updated slash command${NC}"; ((updated++))
    fi
    # Claude conventions
    if [ -f "$CLAUDE_DIR/{SKILL}-conventions.md" ]; then
        cp "$CONVENTIONS" "$CLAUDE_DIR/{SKILL}-conventions.md"
        echo -e "${GREEN}✓ Updated Claude conventions${NC}"; ((updated++))
    fi
    # Copilot conventions
    if [ -f "$GITHUB_DIR/{SKILL}-conventions.md" ]; then
        cp "$CONVENTIONS" "$GITHUB_DIR/{SKILL}-conventions.md"
        echo -e "${GREEN}✓ Updated Copilot conventions${NC}"; ((updated++))
    fi
    # Copilot snippet
    if [ -f "$COPILOT_SNIPPET" ] && [ -f "$GITHUB_DIR/copilot-instructions.md" ]; then
        if update_copilot_snippet "$GITHUB_DIR/copilot-instructions.md" "$COPILOT_SNIPPET"; then
            echo -e "${GREEN}✓ Updated Copilot reference${NC}"; ((updated++))
        fi
    fi
fi

# Always update version tracker
cp "$VERSION_FILE" "$CLAUDE_DIR/{SKILL}.version"

echo ""
if [ $updated -gt 0 ]; then
    echo -e "${GREEN}Updated $updated files → v${SOURCE_VERSION}${NC}"
else
    echo -e "${RED}No files found. Run install.sh first.${NC}"
fi
echo ""
```

### update.ps1 (PowerShell)

```powershell
# {SKILL_DISPLAY} AI Skills Updater (with version checking)

param(
    [switch]$Global,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$MarkerStart = "<!-- {MARKER_ID}-AI-SKILLS-START -->"
$MarkerEnd = "<!-- {MARKER_ID}-AI-SKILLS-END -->"

# Source files
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$SlashCommand = Join-Path $RepoRoot "{SKILL}.md"
$Conventions = Join-Path $RepoRoot "{SKILL}-conventions.md"
$CopilotSnippet = Join-Path $RepoRoot "copilot-instructions.md"
$VersionFile = Join-Path $RepoRoot "VERSION"

# ── Copilot snippet merge ───────────────────────────────────
function Update-CopilotSnippet {
    param([string]$TargetFile, [string]$SourceFile)
    if (-not (Test-Path $TargetFile)) { return $false }

    $Existing = Get-Content -Path $TargetFile -Raw
    if ($Existing -match [regex]::Escape($MarkerStart)) {
        $Source = Get-Content -Path $SourceFile -Raw
        $Pattern = "(?s)$([regex]::Escape($MarkerStart)).*?$([regex]::Escape($MarkerEnd))"
        Set-Content -Path $TargetFile -Value ($Existing -replace $Pattern, $Source.TrimEnd()) -NoNewline
        return $true
    }
    return $false
}

# ── Main ────────────────────────────────────────────────────
Write-Host ""
Write-Host "{SKILL_DISPLAY} AI Skills Updater" -ForegroundColor Cyan
Write-Host ""

# Read source version
if (-not (Test-Path $VersionFile)) {
    Write-Host "Error: VERSION file not found" -ForegroundColor Red; exit 1
}
$SourceVersion = (Get-Content $VersionFile -Raw).Trim()

# Determine install location
if ($Global) {
    $ClaudeDir = Join-Path $env:USERPROFILE ".claude"
} else {
    $Target = (Get-Location).Path
    $ClaudeDir = Join-Path $Target ".claude"
    $GitHubDir = Join-Path $Target ".github"
}

$InstalledVersionFile = Join-Path $ClaudeDir "{SKILL}.version"

# Read installed version
$InstalledVersion = ""
if (Test-Path $InstalledVersionFile) {
    $InstalledVersion = (Get-Content $InstalledVersionFile -Raw).Trim()
}

# ── Version decision ────────────────────────────────────────
if ($InstalledVersion -and -not $Force) {
    if ($SourceVersion -eq $InstalledVersion) {
        Write-Host "Already up to date (v$InstalledVersion)" -ForegroundColor Green
        Write-Host "Use -Force to update anyway" -ForegroundColor DarkGray
        Write-Host ""; exit 0
    }
    if ([version]$SourceVersion -gt [version]$InstalledVersion) {
        Write-Host "Updating: v$InstalledVersion -> v$SourceVersion" -ForegroundColor Cyan
    } else {
        Write-Host "Source (v$SourceVersion) older than installed (v$InstalledVersion)" -ForegroundColor Yellow
        Write-Host "Use -Force to downgrade" -ForegroundColor DarkGray
        Write-Host ""; exit 0
    }
} elseif (-not $InstalledVersion) {
    Write-Host "No version found - updating all files" -ForegroundColor Yellow
} else {
    Write-Host "Force update to v$SourceVersion" -ForegroundColor Yellow
}

Write-Host ""

# ── Apply updates ───────────────────────────────────────────
$updated = 0

if ($Global) {
    $Cmd = Join-Path $ClaudeDir "commands\{SKILL}.md"
    if (Test-Path $Cmd) {
        Copy-Item $SlashCommand $Cmd -Force
        Write-Host "[OK] Updated slash command" -ForegroundColor Green; $updated++
    }
    $Conv = Join-Path $ClaudeDir "{SKILL}-conventions.md"
    if (Test-Path $Conv) {
        Copy-Item $Conventions $Conv -Force
        Write-Host "[OK] Updated conventions" -ForegroundColor Green; $updated++
    }
} else {
    $Cmd = Join-Path $ClaudeDir "commands\{SKILL}.md"
    if (Test-Path $Cmd) {
        Copy-Item $SlashCommand $Cmd -Force
        Write-Host "[OK] Updated slash command" -ForegroundColor Green; $updated++
    }
    $ClaudeConv = Join-Path $ClaudeDir "{SKILL}-conventions.md"
    if (Test-Path $ClaudeConv) {
        Copy-Item $Conventions $ClaudeConv -Force
        Write-Host "[OK] Updated Claude conventions" -ForegroundColor Green; $updated++
    }
    $CopilotConv = Join-Path $GitHubDir "{SKILL}-conventions.md"
    if (Test-Path $CopilotConv) {
        Copy-Item $Conventions $CopilotConv -Force
        Write-Host "[OK] Updated Copilot conventions" -ForegroundColor Green; $updated++
    }
    $CopilotInstr = Join-Path $GitHubDir "copilot-instructions.md"
    if ((Test-Path $CopilotSnippet) -and (Test-Path $CopilotInstr)) {
        if (Update-CopilotSnippet -TargetFile $CopilotInstr -SourceFile $CopilotSnippet) {
            Write-Host "[OK] Updated Copilot reference" -ForegroundColor Green; $updated++
        }
    }
}

# Always update version tracker
Copy-Item $VersionFile (Join-Path $ClaudeDir "{SKILL}.version") -Force

Write-Host ""
if ($updated -gt 0) {
    Write-Host "Updated $updated files -> v$SourceVersion" -ForegroundColor Green
} else {
    Write-Host "No files found. Run install.ps1 first." -ForegroundColor Red
}
Write-Host ""
```

---

## One-Liner Install Commands

Skills should provide one-liner install commands in their README. The pattern is:

**Mac/Linux/Git Bash:**
```bash
t=$(mktemp -d) && git clone --depth 1 "https://github.com/{REPO}" "$t" && bash "$t/{SkillDir}/scripts/install.sh" --global && rm -rf "$t"
```

**Windows (PowerShell):**
```powershell
$t="$env:TEMP\sk-$(Get-Random)"; git clone --depth 1 "https://github.com/{REPO}" $t; & "$t\{SkillDir}\scripts\install.ps1" -Global; Remove-Item -Recurse -Force $t
```

Replace `{REPO}` with the repository path and `{SkillDir}` with the skill directory name.

---

## Uninstall

Skills should document manual uninstall steps in their README. The files to remove:

**Global:**
```bash
rm ~/.claude/commands/{skill-name}.md
rm ~/.claude/{skill-name}-conventions.md
rm ~/.claude/{skill-name}.version
```

**Per-project:**
```bash
rm .claude/commands/{skill-name}.md
rm .claude/{skill-name}-conventions.md
rm .claude/{skill-name}.version
rm .github/{skill-name}-conventions.md
# Manually remove the marker block from .github/copilot-instructions.md
```

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Skill directory | PascalCase | `NextDocs/`, `ApiHelper/` |
| Slash command file | lowercase-with-hyphens | `nextdocs.md`, `api-helper.md` |
| Conventions file | `{name}-conventions.md` | `nextdocs-conventions.md` |
| Version file | `VERSION` (uppercase) | `VERSION` |
| Copilot markers | `UPPERCASE-AI-SKILLS-START/END` | `NEXTDOCS-AI-SKILLS-START` |
| Installed version | `{name}.version` | `nextdocs.version` |

---

## Checklist: Creating a New Skill

- [ ] Create `SkillName/` directory
- [ ] Create `VERSION` file with `1.0.0`
- [ ] Write `{skill-name}.md` slash command with 6-step workflow
- [ ] Write `{skill-name}-conventions.md` with all rules and examples
- [ ] Write `copilot-instructions.md` with unique markers and key rules
- [ ] Write `README.md` with install/usage/update/uninstall instructions
- [ ] Create `scripts/install.sh` following the install behaviour above
- [ ] Create `scripts/install.ps1` matching the bash installer
- [ ] Create `scripts/update.sh` with version checking
- [ ] Create `scripts/update.ps1` matching the bash updater
- [ ] Add skill to the root `README.md` table
- [ ] Test global install on Windows and Mac/Linux
- [ ] Test per-project install on both platforms
- [ ] Test update with version bump
- [ ] Test update when already current (should skip)

---

## Example: NextDocs Skill

The `NextDocs/` skill is the reference implementation. Look at it for a working example of everything described above:

```
NextDocs/
├── VERSION                        # e.g., "1.0.0"
├── README.md
├── nextdocs.md                    # /nextdocs slash command
├── nextdocs-conventions.md        # Documentation conventions
├── copilot-instructions.md        # Copilot snippet with NEXTDOCS markers
└── scripts/
    ├── install.sh
    ├── install.ps1
    ├── update.sh
    └── update.ps1
```
