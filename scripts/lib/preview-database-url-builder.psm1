Set-StrictMode -Version Latest

$script:ProjectRefPattern = '^[a-z0-9]{8,40}$'
$script:PasswordPlaceholder = '[YOUR-PASSWORD]'
$script:DummyPassword = 'TYORA-offline-parser-value'

function New-BuilderResult {
    param(
        [Parameter(Mandatory = $true)][string]$Status,
        [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Field,
        [AllowNull()][string]$RawUri = $null
    )

    [pscustomobject]@{
        Status = $Status
        Field = $Field
        RawUri = $RawUri
    }
}

function Normalize-DatabaseUrlTemplate {
    param([AllowEmptyString()][string]$InputValue)

    $value = if ($null -eq $InputValue) { '' } else { $InputValue.Trim() }
    if (-not $value) {
        return New-BuilderResult 'database_url_empty' 'database_url'
    }

    $assignment = [regex]::Match(
        $value,
        '^(?i:DATABASE_URL)\s*=\s*(?<body>[\s\S]*)$'
    )

    if ($assignment.Success) {
        $body = $assignment.Groups['body'].Value.Trim()
        if ($body.Length -lt 2) {
            return New-BuilderResult 'database_url_invalid_assignment' 'database_url'
        }

        $firstCharacter = $body[0]
        $lastCharacter = $body[$body.Length - 1]
        $isDoubleQuoted = $firstCharacter -eq [char]34 -and $lastCharacter -eq [char]34
        $isSingleQuoted = $firstCharacter -eq [char]39 -and $lastCharacter -eq [char]39
        if (-not $isDoubleQuoted -and -not $isSingleQuoted) {
            return New-BuilderResult 'database_url_invalid_assignment' 'database_url'
        }
        $value = $body.Substring(1, $body.Length - 2).Trim()
    }
    elseif ($value -match '^(?i:DATABASE_URL)\b') {
        return New-BuilderResult 'database_url_invalid_assignment' 'database_url'
    }
    elseif ($value.Length -ge 1) {
        $firstCharacter = $value[0]
        $lastCharacter = $value[$value.Length - 1]
        $startsWithQuote = $firstCharacter -eq [char]34 -or $firstCharacter -eq [char]39
        $endsWithQuote = $lastCharacter -eq [char]34 -or $lastCharacter -eq [char]39
        if ($startsWithQuote -or $endsWithQuote) {
            if ($value.Length -lt 2 -or $firstCharacter -ne $lastCharacter) {
                return New-BuilderResult 'database_url_invalid_assignment' 'database_url'
            }
            $value = $value.Substring(1, $value.Length - 2).Trim()
        }
    }

    if (-not $value -or $value -match '\s') {
        return New-BuilderResult 'database_url_invalid_template' 'database_url'
    }

    New-BuilderResult 'normalized' '' $value
}

function New-TyoraPreviewDatabaseUrl {
    [CmdletBinding()]
    param(
        [AllowEmptyString()][string]$ProductionRef,
        [AllowEmptyString()][string]$PreviewRef,
        [AllowEmptyString()][string]$DatabaseUrlTemplate,
        [AllowEmptyString()][string]$CandidatePassword
    )

    $production = if ($null -eq $ProductionRef) { '' } else { $ProductionRef.Trim() }
    $preview = if ($null -eq $PreviewRef) { '' } else { $PreviewRef.Trim() }

    if ($production -cnotmatch $script:ProjectRefPattern) {
        return New-BuilderResult 'invalid_production_ref_format' 'production_ref'
    }
    if ($preview -cnotmatch $script:ProjectRefPattern) {
        return New-BuilderResult 'invalid_preview_ref_format' 'preview_ref'
    }
    if ([string]::Equals($production, $preview, [StringComparison]::Ordinal)) {
        return New-BuilderResult 'refs_equal' 'preview_ref'
    }
    if ([string]::IsNullOrEmpty($CandidatePassword) -or $CandidatePassword.Length -gt 4096) {
        return New-BuilderResult 'candidate_password_missing' 'password'
    }

    $normalized = Normalize-DatabaseUrlTemplate -InputValue $DatabaseUrlTemplate
    if ($normalized.Status -ne 'normalized') {
        return $normalized
    }

    $template = $normalized.RawUri
    if ($template.IndexOf($production, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
        return New-BuilderResult 'production_target_rejected' 'database_url'
    }

    $firstPlaceholder = $template.IndexOf($script:PasswordPlaceholder, [StringComparison]::Ordinal)
    $lastPlaceholder = $template.LastIndexOf($script:PasswordPlaceholder, [StringComparison]::Ordinal)
    if ($firstPlaceholder -lt 0) {
        return New-BuilderResult 'database_url_password_placeholder_missing' 'database_url'
    }
    if ($firstPlaceholder -ne $lastPlaceholder) {
        return New-BuilderResult 'database_url_password_placeholder_multiple' 'database_url'
    }

    $dummyEncoded = [Uri]::EscapeDataString($script:DummyPassword)
    $candidate = $template.Replace($script:PasswordPlaceholder, $dummyEncoded)

    try {
        $uri = [Uri]::new($candidate, [UriKind]::Absolute)
    }
    catch {
        return New-BuilderResult 'database_url_invalid_uri' 'database_url'
    }

    if ($uri.Scheme -cne 'postgresql' -and $uri.Scheme -cne 'postgres') {
        return New-BuilderResult 'database_url_invalid_scheme' 'database_url'
    }
    if (-not [string]::IsNullOrEmpty($uri.Fragment)) {
        return New-BuilderResult 'database_url_fragment_not_allowed' 'database_url'
    }
    if ($uri.Port -ne 6543) {
        return New-BuilderResult 'database_url_invalid_port' 'database_url'
    }

    try {
        $database = [Uri]::UnescapeDataString($uri.AbsolutePath).Trim('/')
    }
    catch {
        return New-BuilderResult 'database_url_invalid_database' 'database_url'
    }
    if (-not [string]::Equals($database, 'postgres', [StringComparison]::Ordinal)) {
        return New-BuilderResult 'database_url_invalid_database' 'database_url'
    }

    $encodedUserInfo = $uri.UserInfo
    $credentialSeparator = $encodedUserInfo.IndexOf(':')
    if ($credentialSeparator -le 0 -or $credentialSeparator -ne $encodedUserInfo.LastIndexOf(':')) {
        return New-BuilderResult 'database_url_invalid_credentials' 'database_url'
    }

    try {
        $username = [Uri]::UnescapeDataString(
            $encodedUserInfo.Substring(0, $credentialSeparator)
        )
        $dummyPassword = [Uri]::UnescapeDataString(
            $encodedUserInfo.Substring($credentialSeparator + 1)
        )
    }
    catch {
        return New-BuilderResult 'database_url_invalid_credentials' 'database_url'
    }
    if (-not [string]::Equals($dummyPassword, $script:DummyPassword, [StringComparison]::Ordinal)) {
        return New-BuilderResult 'database_url_placeholder_not_password' 'database_url'
    }

    $host = $uri.Host.ToLowerInvariant()
    if (-not $host.EndsWith('.pooler.supabase.com', [StringComparison]::OrdinalIgnoreCase)) {
        return New-BuilderResult 'database_url_invalid_transaction_pooler' 'database_url'
    }

    $expectedUsername = ('postgres.' + $preview).ToLowerInvariant()
    if (-not [string]::Equals($username, $expectedUsername, [StringComparison]::OrdinalIgnoreCase)) {
        return New-BuilderResult 'database_url_preview_ref_mismatch' 'database_url'
    }

    $generatedUri = $null
    try {
        $encodedPassword = [Uri]::EscapeDataString($CandidatePassword)
        $generatedUri = $template.Replace($script:PasswordPlaceholder, $encodedPassword)
        $generated = [Uri]::new($generatedUri, [UriKind]::Absolute)
        $generatedUserInfo = $generated.UserInfo
        $generatedSeparator = $generatedUserInfo.IndexOf(':')
        if ($generatedSeparator -le 0) {
            return New-BuilderResult 'database_url_encoding_failure' 'password'
        }
        $decodedGeneratedPassword = [Uri]::UnescapeDataString(
            $generatedUserInfo.Substring($generatedSeparator + 1)
        )
        if (-not [string]::Equals(
            $decodedGeneratedPassword,
            $CandidatePassword,
            [StringComparison]::Ordinal
        )) {
            return New-BuilderResult 'database_url_encoding_failure' 'password'
        }

        New-BuilderResult 'database_url_ready' '' $generatedUri
    }
    catch {
        New-BuilderResult 'database_url_encoding_failure' 'password'
    }
    finally {
        $encodedPassword = $null
        $decodedGeneratedPassword = $null
        $generatedUserInfo = $null
        $generated = $null
        $candidate = $null
        $dummyPassword = $null
    }
}

Export-ModuleMember -Function New-TyoraPreviewDatabaseUrl
