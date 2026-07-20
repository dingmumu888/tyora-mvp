Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot 'lib\phase-5b-certificate-validator.psm1') -Force

function Assert-Phase5bCertificateResult {
    param(
        [Parameter(Mandatory = $true)][bool]$Actual,
        [Parameter(Mandatory = $true)][bool]$Expected,
        [Parameter(Mandatory = $true)][string]$CaseName
    )

    if ($Actual -ne $Expected) {
        throw [System.InvalidOperationException]::new("certificate parser regression: $CaseName")
    }
}

$tempRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$testDirectory = [System.IO.Path]::GetFullPath(
    (Join-Path $tempRoot ('tyora-phase5b-certificate-' + [Guid]::NewGuid().ToString('N')))
)
if (
    -not $testDirectory.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase) -or
    -not [System.IO.Path]::GetFileName($testDirectory).StartsWith('tyora-phase5b-certificate-')
) {
    throw [System.InvalidOperationException]::new('unsafe test directory')
}

$derBytes = $null
try {
    [void][System.IO.Directory]::CreateDirectory($testDirectory)

    $rootCertificateLines = @(& node -e "process.stdout.write(require('node:tls').rootCertificates[0])")
    if ($LASTEXITCODE -ne 0 -or $rootCertificateLines.Count -eq 0) {
        throw [System.InvalidOperationException]::new('local public CA fixture unavailable')
    }
    $pem = [string]::Join("`n", $rootCertificateLines)
    $match = [regex]::Match(
        $pem,
        '-----BEGIN CERTIFICATE-----\s*(?<body>[A-Za-z0-9+/=\s]+?)\s*-----END CERTIFICATE-----'
    )
    if (-not $match.Success) {
        throw [System.InvalidOperationException]::new('local public CA fixture invalid')
    }
    $derBytes = [Convert]::FromBase64String([regex]::Replace($match.Groups['body'].Value, '\s', ''))

    $lfPemPath = Join-Path $testDirectory 'utf8-lf.pem'
    $crlfBomCrtPath = Join-Path $testDirectory 'prod-ca-2021 (1).crt'
    $derCerPath = Join-Path $testDirectory 'binary.cer'
    $invalidPemPath = Join-Path $testDirectory 'invalid.pem'
    $unsupportedPath = Join-Path $testDirectory 'unsupported.txt'

    [System.IO.File]::WriteAllText(
        $lfPemPath,
        $pem.Replace("`r`n", "`n").Replace("`r", "`n"),
        [System.Text.UTF8Encoding]::new($false)
    )
    [System.IO.File]::WriteAllText(
        $crlfBomCrtPath,
        $pem.Replace("`r`n", "`n").Replace("`r", "`n").Replace("`n", "`r`n"),
        [System.Text.UTF8Encoding]::new($true)
    )
    [System.IO.File]::WriteAllBytes($derCerPath, $derBytes)
    [System.IO.File]::WriteAllText(
        $invalidPemPath,
        "-----BEGIN CERTIFICATE-----`r`nnot-base64`r`n-----END CERTIFICATE-----",
        [System.Text.UTF8Encoding]::new($true)
    )
    [System.IO.File]::WriteAllText($unsupportedPath, $pem, [System.Text.UTF8Encoding]::new($false))

    Assert-Phase5bCertificateResult (Test-Phase5bCertificateSelection $lfPemPath) $true 'Browse accepts UTF-8 LF PEM path'
    Assert-Phase5bCertificateResult (Test-Phase5bCertificateSelection $crlfBomCrtPath) $true 'Browse accepts Windows UTF-8 BOM CRLF CRT path'
    Assert-Phase5bCertificateResult (Test-Phase5bCertificateSelection $derCerPath) $true 'Browse accepts DER CER path'
    Assert-Phase5bCertificateResult (Test-Phase5bCertificateSelection $invalidPemPath) $true 'Browse defers certificate content validation'
    Assert-Phase5bCertificateResult (Test-Phase5bCertificateSelection $unsupportedPath) $false 'Browse rejects unsupported extension'

    Assert-Phase5bCertificateResult (Test-Phase5bCertificateFile $lfPemPath) $true 'UTF-8 LF PEM'
    Assert-Phase5bCertificateResult (Test-Phase5bCertificateFile $crlfBomCrtPath) $true 'UTF-8 BOM CRLF CRT'
    Assert-Phase5bCertificateResult (Test-Phase5bCertificateFile $derCerPath) $true 'DER CER'
    Assert-Phase5bCertificateResult (Test-Phase5bCertificateFile $invalidPemPath) $false 'invalid PEM'
    Assert-Phase5bCertificateResult (Test-Phase5bCertificateFile $unsupportedPath) $false 'unsupported extension'

    $migrationGuiSource = [System.IO.File]::ReadAllText(
        (Join-Path $PSScriptRoot 'phase-5b-preview-migration.ps1')
    )
    if ($migrationGuiSource -notmatch 'Test-Phase5bCertificateSelection\s+-CertificatePath\s+\$candidatePath') {
        throw [System.InvalidOperationException]::new('Browse handler does not use path-only certificate selection validation')
    }
    if ($migrationGuiSource -notmatch 'Test-Phase5bCertificateFile\s+-CertificatePath\s+\$script:selectedCertificatePath') {
        throw [System.InvalidOperationException]::new('Continue handler does not perform shared certificate content validation')
    }

    'phase5b_certificate_parser_tests_pass'
}
finally {
    if ($derBytes) { [Array]::Clear($derBytes, 0, $derBytes.Length) }
    $derBytes = $null
    $pem = $null
    $rootCertificateLines = $null
    $match = $null
    if (
        [System.IO.Directory]::Exists($testDirectory) -and
        $testDirectory.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
        [System.IO.Path]::GetFileName($testDirectory).StartsWith('tyora-phase5b-certificate-')
    ) {
        Remove-Item -LiteralPath $testDirectory -Recurse -Force
    }
}
