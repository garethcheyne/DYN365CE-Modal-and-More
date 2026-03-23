#!/bin/bash
# ModalAndMore AI Skills Installer

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;90m'
NC='\033[0m'

# Markers for Copilot instructions (unique per skill)
MARKER_START="<!-- MODALANDMORE-AI-SKILLS-START -->"
MARKER_END="<!-- MODALANDMORE-AI-SKILLS-END -->"

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
SLASH_COMMAND="$REPO_ROOT/modalandmore.md"
CONVENTIONS="$REPO_ROOT/modalandmore-conventions.md"
COPILOT_SNIPPET="$REPO_ROOT/copilot-instructions.md"
VERSION_FILE="$REPO_ROOT/VERSION"

# Supporting reference files
API_REFERENCE="$REPO_ROOT/API_REFERENCE.md"
FIELD_TYPES="$REPO_ROOT/FIELD_TYPES.md"
PATTERNS="$REPO_ROOT/PATTERNS.md"
ARCHITECTURE="$REPO_ROOT/ARCHITECTURE.md"

# ── Copilot snippet merge function ──────────────────────────
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
echo -e "${CYAN}ModalAndMore AI Skills Installer${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

if [ "$GLOBAL" = true ]; then
    echo -e "${MAGENTA}Mode: Global (all projects)${NC}"
    echo ""
    CLAUDE_DIR="$HOME/.claude"

    # 1. Slash command
    if [ -f "$SLASH_COMMAND" ]; then
        mkdir -p "$CLAUDE_DIR/commands"
        cp "$SLASH_COMMAND" "$CLAUDE_DIR/commands/modalandmore.md"
        echo -e "${GREEN}[Claude] Installed /modalandmore command${NC}"
    fi

    # 2. Conventions
    if [ -f "$CONVENTIONS" ]; then
        cp "$CONVENTIONS" "$CLAUDE_DIR/modalandmore-conventions.md"
        echo -e "${GREEN}[Claude] Installed conventions${NC}"
    fi

    # 3. Version tracker
    if [ -f "$VERSION_FILE" ]; then
        cp "$VERSION_FILE" "$CLAUDE_DIR/modalandmore.version"
        echo -e "${GREEN}[Version] v$(cat "$VERSION_FILE" | tr -d '\n')${NC}"
    fi

    # 4. Supporting reference files
    for ref_file in "$API_REFERENCE" "$FIELD_TYPES" "$PATTERNS" "$ARCHITECTURE"; do
        if [ -f "$ref_file" ]; then
            ref_name=$(basename "$ref_file")
            dest_name="modalandmore-$(echo "$ref_name" | tr '[:upper:]' '[:lower:]' | sed 's/_/-/g')"
            cp "$ref_file" "$CLAUDE_DIR/$dest_name"
            echo -e "${GREEN}[Claude] Installed $ref_name${NC}"
        fi
    done

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
        cp "$SLASH_COMMAND" "$CLAUDE_DIR/commands/modalandmore.md"
        echo -e "${GREEN}[Claude] Installed /modalandmore command${NC}"
    fi

    # 2. Conventions (Claude)
    if [ -f "$CONVENTIONS" ]; then
        cp "$CONVENTIONS" "$CLAUDE_DIR/modalandmore-conventions.md"
        echo -e "${GREEN}[Claude] Installed conventions${NC}"
    fi

    # 3. Conventions (Copilot)
    if [ -f "$CONVENTIONS" ]; then
        mkdir -p "$GITHUB_DIR"
        cp "$CONVENTIONS" "$GITHUB_DIR/modalandmore-conventions.md"
        echo -e "${GREEN}[Copilot] Installed conventions${NC}"
    fi

    # 4. Copilot snippet (smart merge)
    if [ -f "$COPILOT_SNIPPET" ]; then
        install_copilot_snippet "$GITHUB_DIR/copilot-instructions.md" "$COPILOT_SNIPPET"
    fi

    # 5. Supporting reference files
    for ref_file in "$API_REFERENCE" "$FIELD_TYPES" "$PATTERNS" "$ARCHITECTURE"; do
        if [ -f "$ref_file" ]; then
            ref_name=$(basename "$ref_file")
            dest_name="modalandmore-$(echo "$ref_name" | tr '[:upper:]' '[:lower:]' | sed 's/_/-/g')"
            cp "$ref_file" "$CLAUDE_DIR/$dest_name"
            cp "$ref_file" "$GITHUB_DIR/$dest_name"
            echo -e "${GREEN}[Docs] Installed $ref_name${NC}"
        fi
    done

    # 6. Version tracker
    if [ -f "$VERSION_FILE" ]; then
        cp "$VERSION_FILE" "$CLAUDE_DIR/modalandmore.version"
        echo -e "${GREEN}[Version] v$(cat "$VERSION_FILE" | tr -d '\n')${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Installation complete!${NC}"
echo ""
