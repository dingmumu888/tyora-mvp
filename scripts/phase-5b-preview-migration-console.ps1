Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$runnerPath = Join-Path $PSScriptRoot 'phase-5b-preview-migration.mjs'
$exitCode = 1

try {
    $nodeCommand = Get-Command node -ErrorAction Stop
    & $nodeCommand.Source $runnerPath '--apply'
    $exitCode = if ($null -eq $LASTEXITCODE) { 1 } else { [int]$LASTEXITCODE }
}
catch {
    Write-Host 'Phase 5B Preview migration stopped safely.' -ForegroundColor Red
    $exitCode = 1
}
finally {
    foreach ($name in @(
        'TYORA_PRODUCTION_PROJECT_REF',
        'TYORA_PREVIEW_PROJECT_REF',
        'PREVIEW_SUPABASE_URL',
        'PREVIEW_DIRECT_URL',
        'PREVIEW_SSL_CA_PATH'
    )) {
        [Environment]::SetEnvironmentVariable($name, $null, 'Process')
    }
}

if ($exitCode -eq 0) {
    Write-Host ''
    Write-Host 'phase5b_migration_complete' -ForegroundColor Green
}
else {
    Write-Host ''
    Write-Host 'phase5b_migration_failed_redacted' -ForegroundColor Red
}

[void](Read-Host 'Press Enter to close this confirmation window')
exit $exitCode
