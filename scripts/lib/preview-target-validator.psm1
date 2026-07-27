Set-StrictMode -Version Latest

$script:ProjectRefPattern = '^[a-z0-9]{8,40}$'
$script:PasswordPlaceholder = '[YOUR-PASSWORD]'
$script:DummyPassword = 'TYORA dummy parser value'

function New-TargetValidationResult {
    param(
        [Parameter(Mandatory = $true)][string]$Status,
        [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Field
    )

    [pscustomobject]@{
        Status = $Status
        Field = $Field
    }
}

function Normalize-DirectUrlTemplate {
    param([AllowEmptyString()][string]$InputValue)

    $value = if ($null -eq $InputValue) { '' } else { $InputValue.Trim() }
    if (-not $value) {
        return [pscustomobject]@{
            Status = 'direct_url_empty'
            Value = $null
        }
    }

    $assignment = [regex]::Match(
        $value,
        '^(?i:DIRECT_URL)\s*=\s*(?<body>[\s\S]*)$'
    )

    if ($assignment.Success) {
        $body = $assignment.Groups['body'].Value.Trim()
        if ($body.Length -lt 2) {
            return [pscustomobject]@{
                Status = 'direct_url_invalid_assignment'
                Value = $null
            }
        }

        $firstCharacter = $body[0]
        $lastCharacter = $body[$body.Length - 1]
        $isDoubleQuoted = $firstCharacter -eq [char]34 -and $lastCharacter -eq [char]34
        $isSingleQuoted = $firstCharacter -eq [char]39 -and $lastCharacter -eq [char]39
        if (-not $isDoubleQuoted -and -not $isSingleQuoted) {
            return [pscustomobject]@{
                Status = 'direct_url_invalid_assignment'
                Value = $null
            }
        }

        $value = $body.Substring(1, $body.Length - 2).Trim()
    }
    elseif ($value -match '^(?i:DIRECT_URL)\b') {
        return [pscustomobject]@{
            Status = 'direct_url_invalid_assignment'
            Value = $null
        }
    }
    elseif ($value.Length -ge 1) {
        $firstCharacter = $value[0]
        $lastCharacter = $value[$value.Length - 1]
        $startsWithQuote = $firstCharacter -eq [char]34 -or $firstCharacter -eq [char]39
        $endsWithQuote = $lastCharacter -eq [char]34 -or $lastCharacter -eq [char]39

        if ($startsWithQuote -or $endsWithQuote) {
            if ($value.Length -lt 2 -or $firstCharacter -ne $lastCharacter) {
                return [pscustomobject]@{
                    Status = 'direct_url_invalid_assignment'
                    Value = $null
                }
            }
            $value = $value.Substring(1, $value.Length - 2).Trim()
        }
    }

    if (-not $value) {
        return [pscustomobject]@{
            Status = 'direct_url_empty'
            Value = $null
        }
    }

    [pscustomobject]@{
        Status = 'normalized'
        Value = $value
    }
}

function Test-PreviewSupabaseUrl {
    param(
        [Parameter(Mandatory = $true)][string]$PreviewRef,
        [AllowEmptyString()][string]$PreviewUrlText
    )

    $value = if ($null -eq $PreviewUrlText) { '' } else { $PreviewUrlText.Trim() }
    if (-not $value) {
        return 'preview_url_invalid_uri'
    }

    try {
        $uri = [Uri]::new($value, [UriKind]::Absolute)
    }
    catch {
        return 'preview_url_invalid_uri'
    }

    $expectedHost = ($PreviewRef + '.supabase.co').ToLowerInvariant()
    $path = $uri.AbsolutePath.Trim()
    if (
        $uri.Scheme -cne 'https' -or
        $uri.Host.ToLowerInvariant() -cne $expectedHost -or
        -not [string]::IsNullOrEmpty($uri.UserInfo) -or
        -not $uri.IsDefaultPort -or
        ($path -ne '' -and $path -ne '/') -or
        -not [string]::IsNullOrEmpty($uri.Query) -or
        -not [string]::IsNullOrEmpty($uri.Fragment)
    ) {
        return 'preview_url_ref_mismatch'
    }

    'valid'
}

function Test-DirectUrlQuery {
    param([Parameter(Mandatory = $true)][Uri]$Uri)

    if (-not $Uri.Query) {
        return 'valid'
    }

    $segments = @($Uri.Query.TrimStart('?').Split('&', [StringSplitOptions]::RemoveEmptyEntries))
    if ($segments.Count -ne 1) {
        return 'direct_url_unsupported_query'
    }

    $separatorIndex = $segments[0].IndexOf('=')
    if ($separatorIndex -le 0) {
        return 'direct_url_unsupported_query'
    }

    try {
        $key = [Uri]::UnescapeDataString($segments[0].Substring(0, $separatorIndex))
        $value = [Uri]::UnescapeDataString($segments[0].Substring($separatorIndex + 1))
    }
    catch {
        return 'direct_url_unsupported_query'
    }

    if (-not [string]::Equals($key, 'sslmode', [StringComparison]::OrdinalIgnoreCase)) {
        return 'direct_url_unsupported_query'
    }
    if ($value -notin @('require', 'verify-ca', 'verify-full')) {
        return 'direct_url_invalid_sslmode'
    }

    'valid'
}

function Test-TyoraPreviewTarget {
    [CmdletBinding()]
    param(
        [AllowEmptyString()][string]$ProductionRef,
        [AllowEmptyString()][string]$PreviewRef,
        [AllowEmptyString()][string]$PreviewSupabaseUrl,
        [AllowEmptyString()][string]$DirectUrlTemplate
    )

    $production = if ($null -eq $ProductionRef) { '' } else { $ProductionRef.Trim() }
    $preview = if ($null -eq $PreviewRef) { '' } else { $PreviewRef.Trim() }

    if ($production -cnotmatch $script:ProjectRefPattern) {
        return New-TargetValidationResult 'invalid_production_ref_format' 'production_ref'
    }
    if ($preview -cnotmatch $script:ProjectRefPattern) {
        return New-TargetValidationResult 'invalid_preview_ref_format' 'preview_ref'
    }
    if ([string]::Equals($production, $preview, [StringComparison]::Ordinal)) {
        return New-TargetValidationResult 'refs_equal' 'preview_ref'
    }

    $previewUrlStatus = Test-PreviewSupabaseUrl -PreviewRef $preview -PreviewUrlText $PreviewSupabaseUrl
    if ($previewUrlStatus -ne 'valid') {
        return New-TargetValidationResult $previewUrlStatus 'preview_url'
    }

    $normalized = Normalize-DirectUrlTemplate -InputValue $DirectUrlTemplate
    if ($normalized.Status -ne 'normalized') {
        return New-TargetValidationResult $normalized.Status 'direct_url'
    }

    $template = $normalized.Value
    $firstPlaceholder = $template.IndexOf($script:PasswordPlaceholder, [StringComparison]::Ordinal)
    $lastPlaceholder = $template.LastIndexOf($script:PasswordPlaceholder, [StringComparison]::Ordinal)
    if ($firstPlaceholder -lt 0) {
        return New-TargetValidationResult 'direct_url_password_placeholder_missing' 'direct_url'
    }
    if ($firstPlaceholder -ne $lastPlaceholder) {
        return New-TargetValidationResult 'direct_url_password_placeholder_multiple' 'direct_url'
    }

    $dummyEncoded = [Uri]::EscapeDataString($script:DummyPassword)
    $candidate = $template.Replace($script:PasswordPlaceholder, $dummyEncoded)

    try {
        $uri = [Uri]::new($candidate, [UriKind]::Absolute)
    }
    catch {
        return New-TargetValidationResult 'direct_url_invalid_uri' 'direct_url'
    }

    if ($uri.Scheme -cne 'postgresql' -and $uri.Scheme -cne 'postgres') {
        return New-TargetValidationResult 'direct_url_invalid_scheme' 'direct_url'
    }
    if (-not [string]::IsNullOrEmpty($uri.Fragment)) {
        return New-TargetValidationResult 'direct_url_fragment_not_allowed' 'direct_url'
    }

    try {
        $decodedUserInfo = [Uri]::UnescapeDataString($uri.UserInfo)
    }
    catch {
        return New-TargetValidationResult 'direct_url_invalid_credentials' 'direct_url'
    }

    $credentialSeparator = $decodedUserInfo.IndexOf(':')
    if ($credentialSeparator -le 0) {
        return New-TargetValidationResult 'direct_url_invalid_credentials' 'direct_url'
    }

    $username = $decodedUserInfo.Substring(0, $credentialSeparator)
    $password = $decodedUserInfo.Substring($credentialSeparator + 1)
    if (-not [string]::Equals($password, $script:DummyPassword, [StringComparison]::Ordinal)) {
        return New-TargetValidationResult 'direct_url_placeholder_not_password' 'direct_url'
    }

    if ($uri.Port -ne 5432) {
        return New-TargetValidationResult 'direct_url_invalid_port' 'direct_url'
    }

    try {
        $database = [Uri]::UnescapeDataString($uri.AbsolutePath).Trim('/')
    }
    catch {
        return New-TargetValidationResult 'direct_url_invalid_database' 'direct_url'
    }
    if (-not [string]::Equals($database, 'postgres', [StringComparison]::Ordinal)) {
        return New-TargetValidationResult 'direct_url_invalid_database' 'direct_url'
    }

    $queryStatus = Test-DirectUrlQuery -Uri $uri
    if ($queryStatus -ne 'valid') {
        return New-TargetValidationResult $queryStatus 'direct_url'
    }

    $host = $uri.Host.ToLowerInvariant()
    $expectedDirectHost = ('db.' + $preview + '.supabase.co').ToLowerInvariant()
    $expectedPoolerUsername = ('postgres.' + $preview).ToLowerInvariant()
    $isDirectHost = [string]::Equals(
        $host,
        $expectedDirectHost,
        [StringComparison]::OrdinalIgnoreCase
    )
    $isSessionPooler =
        $host.EndsWith('.pooler.supabase.com', [StringComparison]::OrdinalIgnoreCase) -and
        [string]::Equals(
            $username,
            $expectedPoolerUsername,
            [StringComparison]::OrdinalIgnoreCase
        )

    if (-not $isDirectHost -and -not $isSessionPooler) {
        return New-TargetValidationResult 'direct_url_ref_mismatch' 'direct_url'
    }

    New-TargetValidationResult 'target_validation_pass' ''
}

Export-ModuleMember -Function Test-TyoraPreviewTarget
