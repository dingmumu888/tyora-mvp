Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path $PSScriptRoot 'lib\preview-target-validator.psm1'
Import-Module $modulePath -Force

$productionRef = 'prodref12345678901234'
$previewRef = 'preview1234567890123'
$previewUrl = "https://$previewRef.supabase.co"
$placeholder = '[YOUR-PASSWORD]'
$failures = [System.Collections.Generic.List[string]]::new()

function Assert-Status {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Expected,
        [Parameter(Mandatory = $true)][string]$DirectUrl,
        [string]$Production = $productionRef,
        [string]$Preview = $previewRef,
        [string]$SupabaseUrl = $previewUrl
    )

    $result = Test-TyoraPreviewTarget `
        -ProductionRef $Production `
        -PreviewRef $Preview `
        -PreviewSupabaseUrl $SupabaseUrl `
        -DirectUrlTemplate $DirectUrl

    if ($result.Status -ne $Expected) {
        $failures.Add("$Name expected $Expected but received $($result.Status)")
    }
}

$pooler = "postgresql://postgres.$previewRef`:$placeholder@ap-northeast-1.pooler.supabase.com:5432/postgres"
$direct = "postgres://postgres`:$placeholder@db.$previewRef.supabase.co:5432/postgres"

Assert-Status 'raw session pooler' 'target_validation_pass' $pooler
Assert-Status 'raw direct host' 'target_validation_pass' $direct
Assert-Status 'double quoted assignment' 'target_validation_pass' "`r`n DIRECT_URL=`"$pooler`" `r`n"
Assert-Status 'single quoted assignment' 'target_validation_pass' " DIRECT_URL='$pooler' "
Assert-Status 'quoted raw URI' 'target_validation_pass' "`"$direct`""
Assert-Status 'postgres scheme' 'target_validation_pass' $direct
Assert-Status 'optional TLS query' 'target_validation_pass' ($pooler + '?sslmode=require')
Assert-Status 'missing placeholder' 'direct_url_password_placeholder_missing' ($pooler.Replace($placeholder, 'dummy'))
Assert-Status 'duplicate placeholder' 'direct_url_password_placeholder_multiple' ($pooler + $placeholder)
Assert-Status 'invalid assignment' 'direct_url_invalid_assignment' "DIRECT_URL=$pooler"
Assert-Status 'invalid URI' 'direct_url_invalid_uri' "postgresql://postgres.$previewRef`:$placeholder@"
Assert-Status 'invalid scheme' 'direct_url_invalid_scheme' ($pooler.Replace('postgresql://', 'mysql://'))
Assert-Status 'invalid port' 'direct_url_invalid_port' ($pooler.Replace(':5432/', ':6543/'))
Assert-Status 'invalid database' 'direct_url_invalid_database' ($pooler.Replace('/postgres', '/customer_data'))
Assert-Status 'pooler username mismatch' 'direct_url_ref_mismatch' ($pooler.Replace("postgres.$previewRef", 'postgres.otherpreview123456'))
Assert-Status 'direct host mismatch' 'direct_url_ref_mismatch' ($direct.Replace("db.$previewRef.supabase.co", 'db.otherpreview123456.supabase.co'))
Assert-Status 'unsupported query' 'direct_url_unsupported_query' ($pooler + '?host=production.invalid')
Assert-Status 'invalid sslmode' 'direct_url_invalid_sslmode' ($pooler + '?sslmode=disable')
Assert-Status 'preview URL mismatch' 'preview_url_ref_mismatch' $pooler -SupabaseUrl "https://$productionRef.supabase.co"
Assert-Status 'equal refs' 'refs_equal' $pooler -Preview $productionRef -SupabaseUrl "https://$productionRef.supabase.co"

$validatorSources = @(
    (Get-Content -LiteralPath $modulePath -Raw),
    (Get-Content -LiteralPath (Join-Path $PSScriptRoot 'preview-target-validator.ps1') -Raw)
) -join "`n"

$forbiddenOperations = @(
    'Invoke-WebRequest',
    'Invoke-RestMethod',
    'Test-NetConnection',
    'System.Net.Sockets',
    'Npgsql',
    'psql',
    'prisma',
    'migrate',
    'db push',
    'Set-Content',
    'Out-File',
    'WriteAllText',
    'AppendAllText'
)

foreach ($operation in $forbiddenOperations) {
    if ($validatorSources -match [regex]::Escape($operation)) {
        $failures.Add("validator source contains forbidden operation: $operation")
    }
}

if ($failures.Count -gt 0) {
    foreach ($failure in $failures) {
        Write-Error $failure
    }
    exit 1
}

Write-Output 'preview-target-validator: 20 fake-value tests passed'
