#!/bin/bash
# ModalAndMore AI Skills Updater (with version checking)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
GRAY='\033[0;90m'
NC='\033[0m'

MARKER_START="<!-- MODALANDMORE-AI-SKILLS-START -->"
MARKER_END="<!-- MODALANDMORE-AI-SKILLS-END -->"

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
SLASH_COMMAND="$REPO_ROOT/modalandmore.md"
CONVENTIONS="$REPO_ROOT/modalandmore-conventions.md"
COPILOT_SNIPPET="$REPO_ROOT/copilot-instructions.md"
VERSION_FILE="$REPO_ROOT/VERSION"

# Supporting reference files
API_REFERENCE="$REPO_ROOT/API_REFERENCE.md"
FIELD_TYPES="$REPO_ROOT/FIELD_TYPES.md"
PATTERNS="$REPO_ROOT/PATTERNS.md"
ARCHITECTURE="$REPO_ROOT/ARCHITECTURE.md"

# ── Version comparison ──────────────────────────────────────
version_gt() {
    [ "$1" != "$2" ] && [ "$(printf '%s\n' "$1" "$2" | sort -V | tail -n1)" = "$1" ]
}

# ── Copilot snippet merge ───────────────────────────────────
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
echo -e "${CYAN}ModalAndMore AI Skills Updater${NC}"
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

INSTALLED_VERSION_FILE="$CLAUDE_DIR/modalandmore.version"

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
    if [ -f "$CLAUDE_DIR/commands/modalandmore.md" ]; then
        cp "$SLASH_COMMAND" "$CLAUDE_DIR/commands/modalandmore.md"
        echo -e "${GREEN}✓ Updated slash command${NC}"; ((updated++))
    fi
    # Conventions
    if [ -f "$CLAUDE_DIR/modalandmore-conventions.md" ]; then
        cp "$CONVENTIONS" "$CLAUDE_DIR/modalandmore-conventions.md"
        echo -e "${GREEN}✓ Updated conventions${NC}"; ((updated++))
    fi
else
    # Claude slash command
    if [ -f "$CLAUDE_DIR/commands/modalandmore.md" ]; then
        cp "$SLASH_COMMAND" "$CLAUDE_DIR/commands/modalandmore.md"
        echo -e "${GREEN}✓ Updated slash command${NC}"; ((updated++))
    fi
    # Claude conventions
    if [ -f "$CLAUDE_DIR/modalandmore-conventions.md" ]; then
        cp "$CONVENTIONS" "$CLAUDE_DIR/modalandmore-conventions.md"
        echo -e "${GREEN}✓ Updated Claude conventions${NC}"; ((updated++))
    fi
    # Copilot conventions
    if [ -f "$GITHUB_DIR/modalandmore-conventions.md" ]; then
        cp "$CONVENTIONS" "$GITHUB_DIR/modalandmore-conventions.md"
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
cp "$VERSION_FILE" "$CLAUDE_DIR/modalandmore.version"

echo ""
if [ $updated -gt 0 ]; then
    echo -e "${GREEN}Updated $updated files → v${SOURCE_VERSION}${NC}"
else
    echo -e "${RED}No files found. Run install.sh first.${NC}"
fi
echo ""
