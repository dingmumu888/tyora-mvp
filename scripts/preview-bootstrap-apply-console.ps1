Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$reviewedFingerprint = '16adfdd50300fa666931dd743f8a83cafc078b9a401b336cac2e7eb71e5c7fc3'
$repositoryRoot = Split-Path $PSScriptRoot -Parent
$runnerPath = Join-Path $PSScriptRoot 'bootstrap-preview-db.mjs'
$exitCode = 1

try {
    $nodeCommand = Get-Command node -ErrorAction Stop
    & $nodeCommand.Source `
        $runnerPath `
        '--apply' `
        '--fingerprint' `
        $reviewedFingerprint
    $exitCode = if ($null -eq $LASTEXITCODE) { 1 } else { [int]$LASTEXITCODE }
}
catch {
    Write-Host 'Preview initialization stopped safely.' -ForegroundColor Red
    $exitCode = 1
}
finally {
    foreach ($name in @(
        'TYORA_PRODUCTION_PROJECT_REF',
        'TYORA_PREVIEW_PROJECT_REF',
        'PREVIEW_SUPABASE_URL',
        'PREVIEW_DIRECT_URL',
        'PREVIEW_SSL_CA_BASE64'
    )) {
        [Environment]::SetEnvironmentVariable($name, $null, 'Process')
    }
}

if ($exitCode -eq 0) {
    Write-Host ''
    Write-Host 'tyora-preview initialization completed.' -ForegroundColor Green
}
else {
    Write-Host ''
    Write-Host 'No successful Preview initialization was reported.' -ForegroundColor Red
}

[void](Read-Host 'Press Enter to close this confirmation window')
exit $exitCode
