Set-StrictMode -Version Latest

function Test-Phase5bCertificateSelection {
    [CmdletBinding()]
    param([Parameter(Mandatory = $true)][string]$CertificatePath)

    $certificateInfo = $null
    try {
        $extension = [System.IO.Path]::GetExtension($CertificatePath).ToLowerInvariant()
        $certificateInfo = [System.IO.FileInfo]::new($CertificatePath)
        -not $CertificatePath.StartsWith('\\') -and
            $extension -in @('.crt', '.cer', '.pem') -and
            $certificateInfo.Exists -and
            $certificateInfo.Length -gt 0 -and
            $certificateInfo.Length -le 262144 -and
            (($certificateInfo.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -eq 0)
    }
    catch {
        $false
    }
    finally {
        $certificateInfo = $null
        $extension = $null
    }
}

function Test-Phase5bCertificateFile {
    [CmdletBinding()]
    param([Parameter(Mandatory = $true)][string]$CertificatePath)

    $certificateBytes = $null
    $certificateBase64 = $null
    $certificateInfo = $null
    $process = $null
    $safeOutput = $null
    $discardedError = $null
    try {
        if (-not (Test-Phase5bCertificateSelection -CertificatePath $CertificatePath)) {
            return $false
        }

        $certificateInfo = [System.IO.FileInfo]::new($CertificatePath)
        $certificateBytes = [System.IO.File]::ReadAllBytes($CertificatePath)
        if ($certificateBytes.Length -le 0 -or $certificateBytes.Length -gt 262144) {
            return $false
        }
        $certificateBase64 = [Convert]::ToBase64String($certificateBytes)

        $nodeCommand = Get-Command node -ErrorAction Stop
        $validatorPath = [System.IO.Path]::GetFullPath(
            (Join-Path $PSScriptRoot '..\phase-5b-certificate-validator.mjs')
        )
        if (-not [System.IO.File]::Exists($validatorPath) -or $validatorPath.Contains('"')) {
            return $false
        }

        $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
        $startInfo.FileName = $nodeCommand.Source
        $startInfo.Arguments = '"' + $validatorPath + '"'
        $startInfo.UseShellExecute = $false
        $startInfo.CreateNoWindow = $true
        $startInfo.RedirectStandardInput = $true
        $startInfo.RedirectStandardOutput = $true
        $startInfo.RedirectStandardError = $true

        $process = [System.Diagnostics.Process]::new()
        $process.StartInfo = $startInfo
        if (-not $process.Start()) { return $false }
        $process.StandardInput.Write($certificateBase64)
        $process.StandardInput.Close()
        $safeOutput = $process.StandardOutput.ReadToEnd()
        $discardedError = $process.StandardError.ReadToEnd()
        $process.WaitForExit()

        $process.ExitCode -eq 0 -and $safeOutput.Trim() -eq 'certificate_valid'
    }
    catch {
        $false
    }
    finally {
        if ($certificateBytes) { [Array]::Clear($certificateBytes, 0, $certificateBytes.Length) }
        if ($process) { $process.Dispose() }
        $certificateBytes = $null
        $certificateBase64 = $null
        $certificateInfo = $null
        $process = $null
        $safeOutput = $null
        $discardedError = $null
        $extension = $null
        $nodeCommand = $null
        $validatorPath = $null
        $startInfo = $null
    }
}

Export-ModuleMember -Function Test-Phase5bCertificateSelection, Test-Phase5bCertificateFile
