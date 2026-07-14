Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\preview-database-url-builder.psm1') -Force

$productionRef = 'prodref12345678901234'
$previewRef = 'preview1234567890123'
$baseTemplate = "postgresql://postgres.${previewRef}:[YOUR-PASSWORD]@aws-0-fake-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
$testCount = 0

function Assert-Equal {
    param(
        [Parameter(Mandatory = $true)]$Actual,
        [Parameter(Mandatory = $true)]$Expected,
        [Parameter(Mandatory = $true)][string]$Name
    )
    if ($Actual -ne $Expected) {
        throw "Assertion failed: $Name"
    }
    $script:testCount += 1
}

function Invoke-Builder {
    param(
        [string]$Production = $productionRef,
        [string]$Preview = $previewRef,
        [string]$Template = $baseTemplate,
        [string]$Password = 'fake password'
    )
    New-TyoraPreviewDatabaseUrl `
        -ProductionRef $Production `
        -PreviewRef $Preview `
        -DatabaseUrlTemplate $Template `
        -CandidatePassword $Password
}

$rawResult = Invoke-Builder
Assert-Equal $rawResult.Status 'database_url_ready' 'raw URI is accepted'
Assert-Equal `
    $rawResult.RawUri `
    $baseTemplate.Replace('[YOUR-PASSWORD]', [Uri]::EscapeDataString('fake password')) `
    'raw URI is preserved except for the password placeholder'
$rawResult.RawUri = $null
$rawResult = $null

$quoted = "`r`n DATABASE_URL='$baseTemplate' `r`n"
$quotedResult = Invoke-Builder -Template $quoted
Assert-Equal $quotedResult.Status 'database_url_ready' 'quoted assignment is accepted'
$quotedResult.RawUri = $null
$quotedResult = $null

$specialPassword = 'fake %2F p@ss:word/?#[]'
$specialResult = Invoke-Builder -Password $specialPassword
$expectedEncoded = [Uri]::EscapeDataString($specialPassword)
Assert-Equal `
    $specialResult.RawUri `
    $baseTemplate.Replace('[YOUR-PASSWORD]', $expectedEncoded) `
    'password is percent-encoded exactly once'
$specialResult.RawUri = $null
$specialResult = $null
$specialPassword = $null
$expectedEncoded = $null

Assert-Equal `
    (Invoke-Builder -Production $previewRef).Status `
    'refs_equal' `
    'matching refs are rejected'

$productionTemplate = $baseTemplate.Replace($previewRef, $productionRef)
Assert-Equal `
    (Invoke-Builder -Template $productionTemplate).Status `
    'production_target_rejected' `
    'production target is rejected'

$otherPreview = 'otherpreview123456789'
$mismatchTemplate = $baseTemplate.Replace($previewRef, $otherPreview)
Assert-Equal `
    (Invoke-Builder -Template $mismatchTemplate).Status `
    'database_url_preview_ref_mismatch' `
    'other Preview ref is rejected'

Assert-Equal `
    (Invoke-Builder -Template $baseTemplate.Replace(':6543/', ':5432/')).Status `
    'database_url_invalid_port' `
    'port 5432 is rejected'

Assert-Equal `
    (Invoke-Builder -Template $baseTemplate.Replace('/postgres?', '/other?')).Status `
    'database_url_invalid_database' `
    'non-postgres database is rejected'

$directHost = "postgresql://postgres.${previewRef}:[YOUR-PASSWORD]@db.${previewRef}.supabase.co:6543/postgres"
Assert-Equal `
    (Invoke-Builder -Template $directHost).Status `
    'database_url_invalid_transaction_pooler' `
    'direct host is rejected'

Assert-Equal `
    (Invoke-Builder -Template $baseTemplate.Replace('[YOUR-PASSWORD]', 'literal')).Status `
    'database_url_password_placeholder_missing' `
    'missing placeholder is rejected'

$multiplePlaceholder = $baseTemplate + '&value=[YOUR-PASSWORD]'
Assert-Equal `
    (Invoke-Builder -Template $multiplePlaceholder).Status `
    'database_url_password_placeholder_multiple' `
    'multiple placeholders are rejected'

$placeholderInQuery = "postgresql://postgres.${previewRef}:dummy@aws-0-fake-region.pooler.supabase.com:6543/postgres?value=[YOUR-PASSWORD]"
Assert-Equal `
    (Invoke-Builder -Template $placeholderInQuery).Status `
    'database_url_placeholder_not_password' `
    'placeholder outside password is rejected'

Assert-Equal `
    (Invoke-Builder -Template "DATABASE_URL=$baseTemplate").Status `
    'database_url_invalid_assignment' `
    'unquoted assignment is rejected'

Assert-Equal `
    (Invoke-Builder -Production 'INVALID').Status `
    'invalid_production_ref_format' `
    'invalid production ref is rejected'

Assert-Equal `
    (Invoke-Builder -Preview 'INVALID').Status `
    'invalid_preview_ref_format' `
    'invalid preview ref is rejected'

Assert-Equal `
    (Invoke-Builder -Password '').Status `
    'candidate_password_missing' `
    'empty password is rejected'

$guiSource = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'preview-database-url-builder.ps1') -Raw
$moduleSource = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'lib\preview-database-url-builder.psm1') -Raw
$combinedSource = $guiSource + "`n" + $moduleSource

foreach ($forbidden in @(
    'Invoke-WebRequest',
    'Invoke-RestMethod',
    'Start-Process',
    '\$env:',
    'System\.Net\.Http',
    'System\.Net\.Sockets',
    'WebClient',
    'TcpClient',
    'Npgsql',
    '\bpg\b',
    'DATABASE_URL\s*=\s*\$env:',
    'Set-Content',
    'Out-File',
    'WriteAllText',
    'Add-Content',
    'Clipboard\]::Get',
    'Write-Host',
    'Write-Output'
)) {
    if ($combinedSource -match $forbidden) {
        throw "Forbidden operation found in offline builder"
    }
}
$testCount += 1

if ($guiSource -notmatch '\[System\.Windows\.Forms\.Clipboard\]::SetText\(\$generatedUri\)') {
    throw 'Clipboard copy operation is missing or does not use only the generated URI'
}
$testCount += 1

"preview-database-url-builder: $testCount fake-value tests passed"
