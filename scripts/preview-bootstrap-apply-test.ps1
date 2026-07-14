Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$guiSource = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'preview-bootstrap-apply.ps1') -Raw
$consoleSource = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'preview-bootstrap-apply-console.ps1') -Raw
$testCount = 0

function Assert-Match {
    param([string]$Source, [string]$Pattern, [string]$Name)
    if ($Source -notmatch $Pattern) {
        throw "Assertion failed: $Name"
    }
    $script:testCount += 1
}

function Assert-NoMatch {
    param([string]$Source, [string]$Pattern, [string]$Name)
    if ($Source -match $Pattern) {
        throw "Assertion failed: $Name"
    }
    $script:testCount += 1
}

Assert-Match $guiSource 'Test-TyoraPreviewTarget' 'Preview target guard runs before apply'
$patternMatch = [regex]::Match(
    $guiSource,
    "(?m)^\`$script:secretEnvironmentNamePattern = '(?<pattern>[^']+)'\s*$"
)
if (-not $patternMatch.Success) {
    throw 'Assertion failed: secret environment pattern is declared'
}
[void][regex]::new($patternMatch.Groups['pattern'].Value)
$testCount += 1
Assert-Match $guiSource 'Resolve-PreviewGuiResult' 'target results fail closed'
Assert-Match $guiSource 'Get-ApplyCertificateData' 'selected certificate is validated'
Assert-Match $guiSource '\[Uri\]::EscapeDataString\(\$passwordValue\)' 'password is encoded in memory'
Assert-Match $guiSource 'sslmode=verify-full' 'verified TLS is forced'
Assert-Match $guiSource 'Start-Process' 'typed confirmation opens in a separate real console'
Assert-Match $guiSource 'preview-bootstrap-apply-console\.ps1' 'only the fixed console wrapper is launched'
Assert-NoMatch $guiSource 'ArgumentList.*PreviewDirectUrl' 'database URL is not passed in command-line arguments'
Assert-NoMatch $guiSource 'Set-Content|Out-File|Add-Content|WriteAllText|Set-Clipboard' 'GUI does not persist or copy secrets'

Assert-Match $consoleSource "'--apply'" 'apply flag is explicit'
Assert-Match $consoleSource "'--fingerprint'" 'reviewed fingerprint is explicit'
Assert-Match $consoleSource '16adfdd50300fa666931dd743f8a83cafc078b9a401b336cac2e7eb71e5c7fc3' 'approved fingerprint is pinned'
Assert-Match $consoleSource 'bootstrap-preview-db\.mjs' 'guarded bootstrap runner is used'
Assert-NoMatch $consoleSource 'migrate\s+deploy|db\s+push|seed|reset|cleanup|vercel|deploy' 'no unrelated write or deployment command exists'
Assert-Match $consoleSource 'TYORA_PREVIEW_PROJECT_REF' 'Preview environment is cleared after execution'
Assert-Match $consoleSource 'PREVIEW_DIRECT_URL' 'database credential is cleared after execution'
Assert-Match $consoleSource 'PREVIEW_SSL_CA_BASE64' 'certificate memory is cleared after execution'

"preview-bootstrap-apply: $testCount fake/static tests passed"
