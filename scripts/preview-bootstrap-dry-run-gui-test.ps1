Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$source = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'preview-bootstrap-dry-run.ps1') -Raw
Import-Module (Join-Path $PSScriptRoot 'lib\preview-bootstrap-gui-result.psm1') -Force
$testCount = 0

function Assert-Match {
    param([string]$Pattern, [string]$Name)
    if ($source -notmatch $Pattern) {
        throw "Assertion failed: $Name"
    }
    $script:testCount += 1
}

function Assert-NoMatch {
    param([string]$Pattern, [string]$Name)
    if ($source -match $Pattern) {
        throw "Assertion failed: $Name"
    }
    $script:testCount += 1
}

function Assert-Equal {
    param([object]$Actual, [object]$Expected, [string]$Name)
    if ($Actual -ne $Expected) {
        throw "Assertion failed: $Name"
    }
    $script:testCount += 1
}

Assert-Match "ArgumentList\.Add\('\-\-no-warnings'\)" 'only non-secret Node option is present'
Assert-Match 'ArgumentList\.Add\(\$runnerPath\)' 'only the runner path is passed as a positional argument'
Assert-NoMatch '\-\-apply' 'apply flag is absent'
Assert-NoMatch '\-\-fingerprint' 'apply fingerprint flag is absent'
Assert-Match 'Environment\[''PREVIEW_DIRECT_URL''\] = \$PreviewDirectUrl' 'Preview URL uses only the child environment'
Assert-Match 'Environment\[''PREVIEW_SSL_CA_BASE64''\] = \$CertificateBase64' 'selected CA is provided in memory to the child process configuration'
Assert-Match '''\$\{1\}verify-full''' 'TLS mode is forced to verify-full'
Assert-Match 'Test-TyoraPreviewTarget' 'isolation target guard runs before the child process'
Assert-Match 'Get-SelectedCertificateData' 'certificate validation runs before the child process'
Assert-Match 'BEGIN READ ONLY / catalog SELECT / ROLLBACK' 'report declares the exact database operation class'
Assert-Match 'database_changes=none' 'report declares no changes'
Assert-Match '\[void\]\$startInfo\.Environment\.Remove\(\$name\)' 'environment removal return values are suppressed'
Assert-Match 'Resolve-PreviewGuiResult' 'raw results are normalized before Status is read'
Assert-NoMatch '(?m)^\s*\$startInfo\.Environment\.Remove\(' 'no environment removal Boolean leaks into the result pipeline'

$validResult = Resolve-PreviewGuiResult `
    -InputObject ([pscustomobject]@{ Status = 'dry_run_failed_redacted'; Report = $null }) `
    -FallbackStatus 'dry_run_result_invalid' `
    -IncludeReport
Assert-Equal $validResult.Status 'dry_run_failed_redacted' 'a single structured result is preserved'

$dictionary = [System.Collections.Generic.Dictionary[string, string]]::new()
$dictionary.Add('PREVIEW_DIRECT_URL', 'fake-only')
$leakedPipelineResult = @(
    [pscustomobject]@{ Status = 'dry_run_failed_redacted'; Report = $null }
    $dictionary.Remove('PREVIEW_DIRECT_URL')
)
$resolvedLeakedResult = Resolve-PreviewGuiResult `
    -InputObject $leakedPipelineResult `
    -FallbackStatus 'dry_run_result_invalid' `
    -IncludeReport
Assert-Equal $leakedPipelineResult.Count 2 'regression fixture reproduces result plus Boolean pipeline contamination'
Assert-Equal $resolvedLeakedResult.Status 'dry_run_result_invalid' 'pipeline contamination fails closed without a missing Status exception'

$missingStatusResult = Resolve-PreviewGuiResult `
    -InputObject ([pscustomobject]@{ Report = $null }) `
    -FallbackStatus 'dry_run_result_invalid' `
    -IncludeReport
Assert-Equal $missingStatusResult.Status 'dry_run_result_invalid' 'missing Status property fails closed'

$nullResult = Resolve-PreviewGuiResult `
    -InputObject $null `
    -FallbackStatus 'dry_run_result_invalid' `
    -IncludeReport
Assert-Equal $nullResult.Status 'dry_run_result_invalid' 'null process result fails closed'

foreach ($forbidden in @(
    'Set-Content',
    'Out-File',
    'WriteAllText',
    'Add-Content',
    'Invoke-WebRequest',
    'Invoke-RestMethod',
    'Set-Clipboard',
    'Clipboard\]::SetText',
    'StandardError\.Write',
    'console\.log'
)) {
    Assert-NoMatch $forbidden 'no persistence, external API, clipboard, or raw logging operation'
}

"preview-bootstrap-dry-run-gui: $testCount fake/static tests passed"
