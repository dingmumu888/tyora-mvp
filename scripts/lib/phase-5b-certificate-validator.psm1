Set-StrictMode -Version Latest

function Test-Phase5bCertificateFile {
    [CmdletBinding()]
    param([Parameter(Mandatory = $true)][string]$CertificatePath)

    $certificateBytes = $null
    $certificateText = $null
    $normalizedText = $null
    $decodedByteArrays = @()
    $certificates = @()
    $strictUtf8 = $null
    $certificateInfo = $null
    try {
        $extension = [System.IO.Path]::GetExtension($CertificatePath).ToLowerInvariant()
        $certificateInfo = [System.IO.FileInfo]::new($CertificatePath)
        if (
            $CertificatePath.StartsWith('\\') -or
            $extension -notin @('.crt', '.cer', '.pem') -or
            -not $certificateInfo.Exists -or
            $certificateInfo.Length -le 0 -or
            $certificateInfo.Length -gt 16384 -or
            (($certificateInfo.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
        ) {
            return $false
        }

        $certificateBytes = [System.IO.File]::ReadAllBytes($CertificatePath)
        $strictUtf8 = [System.Text.UTF8Encoding]::new($false, $true)
        try {
            $certificateText = $strictUtf8.GetString($certificateBytes)
        }
        catch {
            $certificateText = $null
        }

        $beginMarker = '-----BEGIN CERTIFICATE-----'
        $endMarker = '-----END CERTIFICATE-----'
        if ($null -ne $certificateText -and $certificateText.Contains($beginMarker)) {
            if ($certificateText.Length -gt 0 -and $certificateText[0] -eq [char]0xFEFF) {
                $certificateText = $certificateText.Substring(1)
            }
            $normalizedText = $certificateText.Replace("`r`n", "`n").Replace("`r", "`n")
            $pemPattern = '-----BEGIN CERTIFICATE-----\s*(?<body>[A-Za-z0-9+/=\s]+?)\s*-----END CERTIFICATE-----'
            $pemMatches = [regex]::Matches(
                $normalizedText,
                $pemPattern,
                [System.Text.RegularExpressions.RegexOptions]::CultureInvariant
            )
            $beginCount = [regex]::Matches($normalizedText, [regex]::Escape($beginMarker)).Count
            $endCount = [regex]::Matches($normalizedText, [regex]::Escape($endMarker)).Count
            if ($pemMatches.Count -eq 0 -or $beginCount -ne $endCount -or $pemMatches.Count -ne $beginCount) {
                return $false
            }

            foreach ($pemMatch in $pemMatches) {
                $base64Body = [regex]::Replace($pemMatch.Groups['body'].Value, '\s', '')
                if (-not $base64Body) { return $false }
                $decodedBytes = [Convert]::FromBase64String($base64Body)
                $decodedByteArrays += ,$decodedBytes
                $certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(
                    $decodedBytes
                )
                $certificates += $certificate
            }
        }
        else {
            $certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(
                $certificateBytes
            )
            $certificates += $certificate
        }

        foreach ($certificate in $certificates) {
            foreach ($certificateExtension in $certificate.Extensions) {
                if ($certificateExtension.Oid.Value -ne '2.5.29.19') { continue }

                if ($certificateExtension -is [System.Security.Cryptography.X509Certificates.X509BasicConstraintsExtension]) {
                    $basicConstraints = $certificateExtension
                }
                else {
                    $basicConstraints = [System.Security.Cryptography.X509Certificates.X509BasicConstraintsExtension]::new()
                    $basicConstraints.CopyFrom($certificateExtension)
                }
                if ($basicConstraints.CertificateAuthority) { return $true }
            }
        }
        $false
    }
    catch {
        $false
    }
    finally {
        if ($certificateBytes) { [Array]::Clear($certificateBytes, 0, $certificateBytes.Length) }
        foreach ($decodedBytes in $decodedByteArrays) {
            if ($decodedBytes) { [Array]::Clear($decodedBytes, 0, $decodedBytes.Length) }
        }
        foreach ($certificate in $certificates) {
            if ($certificate) { $certificate.Dispose() }
        }
        $certificateBytes = $null
        $certificateText = $null
        $normalizedText = $null
        $decodedByteArrays = @()
        $certificates = @()
        $strictUtf8 = $null
        $certificateInfo = $null
        $extension = $null
        $pemMatches = $null
        $pemMatch = $null
        $base64Body = $null
        $decodedBytes = $null
        $certificate = $null
        $certificateExtension = $null
        $basicConstraints = $null
    }
}

Export-ModuleMember -Function Test-Phase5bCertificateFile
