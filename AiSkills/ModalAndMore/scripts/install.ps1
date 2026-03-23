# ModalAndMore AI Skills Installer

param(
    [switch]$Global,
    [string]$Target = (Get-Location).Path
)

$ErrorActionPreference = "Stop"

# Markers for Copilot instructions (unique per skill)
$MarkerStart = "<!-- MODALANDMORE-AI-SKILLS-START -->"
$MarkerEnd = "<!-- MODALANDMORE-AI-SKILLS-END -->"

# Find source files
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$SlashCommand = Join-Path $RepoRoot "modalandmore.md"
$Conventions = Join-Path $RepoRoot "modalandmore-conventions.md"
$CopilotSnippet = Join-Path $RepoRoot "copilot-instructions.md"
$VersionFile = Join-Path $RepoRoot "VERSION"

# Supporting reference files
$ReferenceFiles = @(
    @{ Source = Join-Path $RepoRoot "API_REFERENCE.md"; Dest = "modalandmore-api-reference.md" },
    @{ Source = Join-Path $RepoRoot "FIELD_TYPES.md"; Dest = "modalandmore-field-types.md" },
    @{ Source = Join-Path $RepoRoot "PATTERNS.md"; Dest = "modalandmore-patterns.md" },
    @{ Source = Join-Path $RepoRoot "ARCHITECTURE.md"; Dest = "modalandmore-architecture.md" }
)

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
Write-Host "ModalAndMore AI Skills Installer" -ForegroundColor Cyan
Write-Host ("=" * "ModalAndMore AI Skills Installer".Length) -ForegroundColor Cyan
Write-Host ""

if ($Global) {
    Write-Host "Mode: Global (all projects)" -ForegroundColor Magenta
    Write-Host ""
    $ClaudeDir = Join-Path $env:USERPROFILE ".claude"

    # 1. Slash command
    if (Test-Path $SlashCommand) {
        $CmdsDir = Join-Path $ClaudeDir "commands"
        if (-not (Test-Path $CmdsDir)) { New-Item -ItemType Directory -Path $CmdsDir -Force | Out-Null }
        Copy-Item -Path $SlashCommand -Destination (Join-Path $CmdsDir "modalandmore.md") -Force
        Write-Host "[Claude] Installed /modalandmore command" -ForegroundColor Green
    }

    # 2. Conventions
    if (Test-Path $Conventions) {
        Copy-Item -Path $Conventions -Destination (Join-Path $ClaudeDir "modalandmore-conventions.md") -Force
        Write-Host "[Claude] Installed conventions" -ForegroundColor Green
    }

    # 3. Version tracker
    if (Test-Path $VersionFile) {
        $Ver = (Get-Content $VersionFile -Raw).Trim()
        Copy-Item -Path $VersionFile -Destination (Join-Path $ClaudeDir "modalandmore.version") -Force
        Write-Host "[Version] v$Ver" -ForegroundColor Green
    }

    # 4. Supporting reference files
    foreach ($ref in $ReferenceFiles) {
        if (Test-Path $ref.Source) {
            Copy-Item -Path $ref.Source -Destination (Join-Path $ClaudeDir $ref.Dest) -Force
            Write-Host "[Claude] Installed $($ref.Dest)" -ForegroundColor Green
        }
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
        Copy-Item -Path $SlashCommand -Destination (Join-Path $CmdsDir "modalandmore.md") -Force
        Write-Host "[Claude] Installed /modalandmore command" -ForegroundColor Green
    }

    # 2. Conventions (Claude)
    if (Test-Path $Conventions) {
        if (-not (Test-Path $ClaudeDir)) { New-Item -ItemType Directory -Path $ClaudeDir -Force | Out-Null }
        Copy-Item -Path $Conventions -Destination (Join-Path $ClaudeDir "modalandmore-conventions.md") -Force
        Write-Host "[Claude] Installed conventions" -ForegroundColor Green
    }

    # 3. Conventions (Copilot)
    if (Test-Path $Conventions) {
        if (-not (Test-Path $GitHubDir)) { New-Item -ItemType Directory -Path $GitHubDir -Force | Out-Null }
        Copy-Item -Path $Conventions -Destination (Join-Path $GitHubDir "modalandmore-conventions.md") -Force
        Write-Host "[Copilot] Installed conventions" -ForegroundColor Green
    }

    # 4. Copilot snippet (smart merge)
    if (Test-Path $CopilotSnippet) {
        Install-CopilotSnippet -TargetFile (Join-Path $GitHubDir "copilot-instructions.md") -SourceFile $CopilotSnippet
    }

    # 5. Supporting reference files
    foreach ($ref in $ReferenceFiles) {
        if (Test-Path $ref.Source) {
            Copy-Item -Path $ref.Source -Destination (Join-Path $ClaudeDir $ref.Dest) -Force
            Copy-Item -Path $ref.Source -Destination (Join-Path $GitHubDir $ref.Dest) -Force
            Write-Host "[Docs] Installed $($ref.Dest)" -ForegroundColor Green
        }
    }

    # 6. Version tracker
    if (Test-Path $VersionFile) {
        $Ver = (Get-Content $VersionFile -Raw).Trim()
        Copy-Item -Path $VersionFile -Destination (Join-Path $ClaudeDir "modalandmore.version") -Force
        Write-Host "[Version] v$Ver" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host ""
