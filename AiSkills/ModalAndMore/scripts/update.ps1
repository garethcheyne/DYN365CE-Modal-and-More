# ModalAndMore AI Skills Updater (with version checking)

param(
    [switch]$Global,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$MarkerStart = "<!-- MODALANDMORE-AI-SKILLS-START -->"
$MarkerEnd = "<!-- MODALANDMORE-AI-SKILLS-END -->"

# Source files
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
Write-Host "ModalAndMore AI Skills Updater" -ForegroundColor Cyan
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

$InstalledVersionFile = Join-Path $ClaudeDir "modalandmore.version"

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
    $Cmd = Join-Path $ClaudeDir "commands\modalandmore.md"
    if (Test-Path $Cmd) {
        Copy-Item $SlashCommand $Cmd -Force
        Write-Host "[OK] Updated slash command" -ForegroundColor Green; $updated++
    }
    $Conv = Join-Path $ClaudeDir "modalandmore-conventions.md"
    if (Test-Path $Conv) {
        Copy-Item $Conventions $Conv -Force
        Write-Host "[OK] Updated conventions" -ForegroundColor Green; $updated++
    }
    # Supporting reference files
    foreach ($ref in $ReferenceFiles) {
        if (Test-Path $ref.Source) {
            Copy-Item -Path $ref.Source -Destination (Join-Path $ClaudeDir $ref.Dest) -Force
            Write-Host "[OK] Updated $($ref.Dest)" -ForegroundColor Green; $updated++
        }
    }
} else {
    $Cmd = Join-Path $ClaudeDir "commands\modalandmore.md"
    if (Test-Path $Cmd) {
        Copy-Item $SlashCommand $Cmd -Force
        Write-Host "[OK] Updated slash command" -ForegroundColor Green; $updated++
    }
    $ClaudeConv = Join-Path $ClaudeDir "modalandmore-conventions.md"
    if (Test-Path $ClaudeConv) {
        Copy-Item $Conventions $ClaudeConv -Force
        Write-Host "[OK] Updated Claude conventions" -ForegroundColor Green; $updated++
    }
    $CopilotConv = Join-Path $GitHubDir "modalandmore-conventions.md"
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
    # Supporting reference files
    foreach ($ref in $ReferenceFiles) {
        if (Test-Path $ref.Source) {
            Copy-Item -Path $ref.Source -Destination (Join-Path $ClaudeDir $ref.Dest) -Force
            Copy-Item -Path $ref.Source -Destination (Join-Path $GitHubDir $ref.Dest) -Force
            Write-Host "[OK] Updated $($ref.Dest)" -ForegroundColor Green; $updated++
        }
    }
}

# Always update version tracker
Copy-Item $VersionFile (Join-Path $ClaudeDir "modalandmore.version") -Force

Write-Host ""
if ($updated -gt 0) {
    Write-Host "Updated $updated files -> v$SourceVersion" -ForegroundColor Green
} else {
    Write-Host "No files found. Run install.ps1 first." -ForegroundColor Red
}
Write-Host ""
