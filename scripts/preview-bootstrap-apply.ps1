Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Import-Module (Join-Path $PSScriptRoot 'lib\preview-target-validator.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'lib\preview-bootstrap-gui-result.psm1') -Force

$script:finalStatus = $null
$script:selectedCertificatePath = $null
$script:passwordPlaceholder = '[YOUR-PASSWORD]'
$script:secretEnvironmentNamePattern = '(?i)(DATABASE|DIRECT_URL|SUPABASE|PASSWORD|SECRET|TOKEN|API_KEY|RESEND|AUTH|NODE_EXTRA_CA_CERTS|^PG(?:HOST|USER|PASSWORD|DATABASE|PORT|SERVICE)$)'

foreach ($name in @([Environment]::GetEnvironmentVariables('Process').Keys)) {
    if ($name -match $script:secretEnvironmentNamePattern) {
        [Environment]::SetEnvironmentVariable([string]$name, $null, 'Process')
    }
}

function Normalize-ApplyDirectUrlTemplate {
    param([AllowEmptyString()][string]$InputValue)

    $value = if ($null -eq $InputValue) { '' } else { $InputValue.Trim() }
    $assignment = [regex]::Match($value, '^(?i:DIRECT_URL)\s*=\s*(?<body>[\s\S]*)$')
    if ($assignment.Success) {
        $body = $assignment.Groups['body'].Value.Trim()
        $value = $body.Substring(1, $body.Length - 2).Trim()
    }
    elseif ($value.Length -ge 2) {
        $first = $value[0]
        $last = $value[$value.Length - 1]
        if (($first -eq [char]34 -or $first -eq [char]39) -and $first -eq $last) {
            $value = $value.Substring(1, $value.Length - 2).Trim()
        }
    }
    $value
}

function Get-ApplyCertificateData {
    param([Parameter(Mandatory = $true)][string]$CertificatePath)

    $certificateBytes = $null
    $certificate = $null
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
            return [pscustomobject]@{ Valid = $false; CertificateBase64 = $null }
        }

        $certificateBytes = [System.IO.File]::ReadAllBytes($CertificatePath)
        $certificateText = [System.Text.Encoding]::ASCII.GetString($certificateBytes)
        if ($certificateText.Contains('-----BEGIN CERTIFICATE-----')) {
            $pemMatch = [regex]::Match(
                $certificateText,
                '-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----'
            )
            if (-not $pemMatch.Success) {
                return [pscustomobject]@{ Valid = $false; CertificateBase64 = $null }
            }
            $certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::CreateFromPem(
                $pemMatch.Value
            )
        }
        else {
            $certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(
                $certificateBytes
            )
        }

        $basicConstraints = @(
            $certificate.Extensions | Where-Object {
                $_ -is [System.Security.Cryptography.X509Certificates.X509BasicConstraintsExtension]
            }
        ) | Select-Object -First 1
        if ($null -eq $basicConstraints -or -not $basicConstraints.CertificateAuthority) {
            return [pscustomobject]@{ Valid = $false; CertificateBase64 = $null }
        }

        [pscustomobject]@{
            Valid = $true
            CertificateBase64 = [Convert]::ToBase64String($certificateBytes)
        }
    }
    catch {
        [pscustomobject]@{ Valid = $false; CertificateBase64 = $null }
    }
    finally {
        if ($certificateBytes) {
            [Array]::Clear($certificateBytes, 0, $certificateBytes.Length)
        }
        if ($certificate) {
            $certificate.Dispose()
        }
        $certificateBytes = $null
        $certificateText = $null
        $pemMatch = $null
        $basicConstraints = $null
        $certificateInfo = $null
        $extension = $null
    }
}

function Invoke-PreviewApplyConsole {
    param(
        [Parameter(Mandatory = $true)][string]$ProductionRef,
        [Parameter(Mandatory = $true)][string]$PreviewRef,
        [Parameter(Mandatory = $true)][string]$PreviewSupabaseUrl,
        [Parameter(Mandatory = $true)][string]$PreviewDirectUrl,
        [Parameter(Mandatory = $true)][string]$CertificateBase64
    )

    $child = $null
    try {
        [Environment]::SetEnvironmentVariable('TYORA_PRODUCTION_PROJECT_REF', $ProductionRef, 'Process')
        [Environment]::SetEnvironmentVariable('TYORA_PREVIEW_PROJECT_REF', $PreviewRef, 'Process')
        [Environment]::SetEnvironmentVariable('PREVIEW_SUPABASE_URL', $PreviewSupabaseUrl, 'Process')
        [Environment]::SetEnvironmentVariable('PREVIEW_DIRECT_URL', $PreviewDirectUrl, 'Process')
        [Environment]::SetEnvironmentVariable('PREVIEW_SSL_CA_BASE64', $CertificateBase64, 'Process')

        $pwshCommand = Get-Command pwsh -ErrorAction Stop
        $consolePath = Join-Path $PSScriptRoot 'preview-bootstrap-apply-console.ps1'
        $child = Start-Process `
            -FilePath $pwshCommand.Source `
            -ArgumentList @('-NoLogo', '-NoProfile', '-File', ('"' + $consolePath + '"')) `
            -WorkingDirectory (Split-Path $PSScriptRoot -Parent) `
            -WindowStyle Normal `
            -PassThru `
            -Wait

        $exitCodeProperty = $child.PSObject.Properties['ExitCode']
        if ($null -eq $exitCodeProperty) {
            return 'preview_bootstrap_apply_failed_redacted'
        }
        if ([int]$exitCodeProperty.Value -eq 0) {
            return 'preview_bootstrap_apply_complete'
        }
        'preview_bootstrap_apply_failed_redacted'
    }
    catch {
        'preview_bootstrap_apply_failed_redacted'
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
        if ($child) {
            $child.Dispose()
        }
        $PreviewDirectUrl = $null
        $CertificateBase64 = $null
        $child = $null
        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'TYORA Preview Bootstrap - APPROVED PREVIEW WRITE'
$form.Size = New-Object System.Drawing.Size(800, 875)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::White
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = 'Initialize tyora-preview only'
$title.Location = New-Object System.Drawing.Point(30, 22)
$title.Size = New-Object System.Drawing.Size(720, 38)
$title.Font = New-Object System.Drawing.Font('Segoe UI', 20, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($title)

$intro = New-Object System.Windows.Forms.Label
$intro.Text = 'APPROVED WRITE. Rechecks isolation, emptiness, TLS, and the reviewed fingerprint before one atomic Preview transaction.'
$intro.Location = New-Object System.Drawing.Point(34, 67)
$intro.Size = New-Object System.Drawing.Size(710, 45)
$intro.ForeColor = [System.Drawing.Color]::FromArgb(153, 27, 27)
$form.Controls.Add($intro)

function Add-ApplyMaskedField {
    param(
        [Parameter(Mandatory = $true)][string]$Label,
        [Parameter(Mandatory = $true)][int]$Y
    )

    $fieldLabel = New-Object System.Windows.Forms.Label
    $fieldLabel.Text = $Label
    $fieldLabel.Location = New-Object System.Drawing.Point(34, $Y)
    $fieldLabel.Size = New-Object System.Drawing.Size(710, 24)
    $fieldLabel.Font = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Bold)
    $form.Controls.Add($fieldLabel)

    $box = New-Object System.Windows.Forms.TextBox
    $box.Location = New-Object System.Drawing.Point(34, ($Y + 27))
    $box.Size = New-Object System.Drawing.Size(710, 31)
    $box.UseSystemPasswordChar = $true
    $form.Controls.Add($box)
    $box
}

$productionBox = Add-ApplyMaskedField '1. Production project ref' 120
$previewBox = Add-ApplyMaskedField '2. Preview project ref' 195
$previewUrlBox = Add-ApplyMaskedField '3. Preview Supabase URL' 270
$directBox = Add-ApplyMaskedField '4. Raw URI or quoted DIRECT_URL= assignment using literal [YOUR-PASSWORD]' 345
$passwordBox = Add-ApplyMaskedField '5. Candidate Preview database password' 420

$certificateLabel = New-Object System.Windows.Forms.Label
$certificateLabel.Text = '6. Supabase SSL certificate'
$certificateLabel.Location = New-Object System.Drawing.Point(34, 495)
$certificateLabel.Size = New-Object System.Drawing.Size(710, 24)
$certificateLabel.Font = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($certificateLabel)

$certificateBox = New-Object System.Windows.Forms.TextBox
$certificateBox.Location = New-Object System.Drawing.Point(34, 522)
$certificateBox.Size = New-Object System.Drawing.Size(570, 31)
$certificateBox.UseSystemPasswordChar = $true
$certificateBox.ReadOnly = $true
$certificateBox.TabStop = $false
$form.Controls.Add($certificateBox)

$browseButton = New-Object System.Windows.Forms.Button
$browseButton.Text = 'Browse...'
$browseButton.Location = New-Object System.Drawing.Point(616, 519)
$browseButton.Size = New-Object System.Drawing.Size(128, 36)
$form.Controls.Add($browseButton)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = 'not_checked'
$statusLabel.Location = New-Object System.Drawing.Point(34, 645)
$statusLabel.Size = New-Object System.Drawing.Size(710, 34)
$statusLabel.Font = New-Object System.Drawing.Font('Consolas', 11, [System.Drawing.FontStyle]::Bold)
$statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(75, 85, 99)
$form.Controls.Add($statusLabel)

$browseButton.Add_Click({
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $candidatePath = $null
    $certificateData = $null
    try {
        $dialog.Title = 'Select Supabase SSL certificate'
        $dialog.Filter = 'Certificate files (*.crt;*.cer;*.pem)|*.crt;*.cer;*.pem'
        $dialog.CheckFileExists = $true
        $dialog.CheckPathExists = $true
        $dialog.Multiselect = $false
        $dialog.RestoreDirectory = $true
        $dialog.AddToRecent = $false
        $dialog.ValidateNames = $true
        $dialog.DereferenceLinks = $true
        if ($dialog.ShowDialog($form) -eq [System.Windows.Forms.DialogResult]::OK) {
            $candidatePath = [System.IO.Path]::GetFullPath($dialog.FileName)
            $certificateData = Get-ApplyCertificateData -CertificatePath $candidatePath
            if (-not $certificateData.Valid) {
                throw [System.InvalidOperationException]::new('certificate_invalid')
            }
            $certificateData.CertificateBase64 = $null
            $script:selectedCertificatePath = $candidatePath
            $certificateBox.Text = 'certificate selected'
            $statusLabel.Text = 'certificate_selected'
            $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
        }
    }
    catch {
        $script:selectedCertificatePath = $null
        $certificateBox.Clear()
        $statusLabel.Text = 'certificate_invalid'
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
    }
    finally {
        $dialog.FileName = ''
        $dialog.Dispose()
        $candidatePath = $null
        $certificateData = $null
    }
})

$note = New-Object System.Windows.Forms.Label
$note.Text = 'After Continue, a separate console asks you to type the exact Preview project ref. No secret is passed in command-line arguments or saved to disk.'
$note.Location = New-Object System.Drawing.Point(34, 580)
$note.Size = New-Object System.Drawing.Size(710, 48)
$note.ForeColor = [System.Drawing.Color]::FromArgb(107, 114, 128)
$form.Controls.Add($note)

$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Text = 'Cancel'
$cancelButton.Location = New-Object System.Drawing.Point(438, 715)
$cancelButton.Size = New-Object System.Drawing.Size(120, 44)
$cancelButton.Add_Click({ $form.Close() })
$form.Controls.Add($cancelButton)

$runButton = New-Object System.Windows.Forms.Button
$runButton.Text = 'Continue to typed confirmation'
$runButton.Location = New-Object System.Drawing.Point(570, 715)
$runButton.Size = New-Object System.Drawing.Size(174, 44)
$runButton.BackColor = [System.Drawing.Color]::FromArgb(185, 28, 28)
$runButton.ForeColor = [System.Drawing.Color]::White
$runButton.FlatStyle = 'Flat'
$form.Controls.Add($runButton)

$runButton.Add_Click({
    $runButton.Enabled = $false
    $statusLabel.Text = 'validating_preview_only'
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(75, 85, 99)
    $form.Refresh()

    $rawTargetResult = @(
        Test-TyoraPreviewTarget `
            -ProductionRef $productionBox.Text `
            -PreviewRef $previewBox.Text `
            -PreviewSupabaseUrl $previewUrlBox.Text `
            -DirectUrlTemplate $directBox.Text
    )
    $targetResult = Resolve-PreviewGuiResult `
        -InputObject $rawTargetResult `
        -FallbackStatus 'target_result_invalid' `
        -IncludeField
    $targetStatus = [string]$targetResult.Status
    if ($targetStatus -ne 'target_validation_pass') {
        $statusLabel.Text = $targetStatus
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
        switch ($targetResult.Field) {
            'production_ref' { $productionBox.Focus() }
            'preview_ref' { $previewBox.Focus() }
            'preview_url' { $previewUrlBox.Focus() }
            'direct_url' { $directBox.Focus() }
        }
        $runButton.Enabled = $true
        return
    }
    if (-not $passwordBox.Text) {
        $statusLabel.Text = 'candidate_password_missing'
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
        $passwordBox.Focus()
        $runButton.Enabled = $true
        return
    }
    if (-not $script:selectedCertificatePath -or -not $certificateBox.Text) {
        $statusLabel.Text = 'certificate_missing'
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
        $browseButton.Focus()
        $runButton.Enabled = $true
        return
    }

    $passwordValue = $passwordBox.Text
    $passwordBox.Clear()
    $directTemplate = $null
    $encodedPassword = $null
    $previewDirectUrl = $null
    $certificateData = $null
    $certificateBase64 = $null
    $applyStatus = 'preview_bootstrap_apply_failed_redacted'
    try {
        if ($passwordValue.Length -gt 4096) {
            throw [System.InvalidOperationException]::new('candidate_password_invalid')
        }
        $certificateData = Get-ApplyCertificateData `
            -CertificatePath $script:selectedCertificatePath
        if (-not $certificateData.Valid) {
            throw [System.InvalidOperationException]::new('certificate_invalid')
        }
        $certificateBase64 = $certificateData.CertificateBase64
        $certificateData.CertificateBase64 = $null

        $directTemplate = Normalize-ApplyDirectUrlTemplate -InputValue $directBox.Text
        $encodedPassword = [Uri]::EscapeDataString($passwordValue)
        $previewDirectUrl = $directTemplate.Replace(
            $script:passwordPlaceholder,
            $encodedPassword
        )
        if ($previewDirectUrl.Contains('?')) {
            $previewDirectUrl = [regex]::Replace(
                $previewDirectUrl,
                '(?i)([?&]sslmode=)(require|verify-ca|verify-full)',
                '${1}verify-full'
            )
        }
        else {
            $previewDirectUrl += '?sslmode=verify-full'
        }

        $parsedDirectUrl = [Uri]::new($previewDirectUrl, [UriKind]::Absolute)
        $separator = $parsedDirectUrl.UserInfo.IndexOf(':')
        if ($separator -le 0) {
            throw [System.InvalidOperationException]::new('database_url_encoding_failure')
        }
        $decodedPassword = [Uri]::UnescapeDataString(
            $parsedDirectUrl.UserInfo.Substring($separator + 1)
        )
        if (-not [string]::Equals(
            $decodedPassword,
            $passwordValue,
            [StringComparison]::Ordinal
        )) {
            throw [System.InvalidOperationException]::new('database_url_encoding_failure')
        }

        $statusLabel.Text = 'waiting_for_typed_preview_confirmation'
        $form.Refresh()
        $form.Hide()
        $applyStatus = Invoke-PreviewApplyConsole `
            -ProductionRef $productionBox.Text.Trim() `
            -PreviewRef $previewBox.Text.Trim() `
            -PreviewSupabaseUrl $previewUrlBox.Text.Trim() `
            -PreviewDirectUrl $previewDirectUrl `
            -CertificateBase64 $certificateBase64
    }
    catch {
        $applyStatus = 'preview_bootstrap_apply_failed_redacted'
    }
    finally {
        if (-not $form.IsDisposed) {
            $form.Show()
            $form.Activate()
        }
        $passwordValue = $null
        $encodedPassword = $null
        $previewDirectUrl = $null
        $directTemplate = $null
        $certificateBase64 = $null
        if ($certificateData) {
            $certificateData.CertificateBase64 = $null
        }
        $certificateData = $null
        $parsedDirectUrl = $null
        $decodedPassword = $null
        $rawTargetResult = $null
        $targetResult = $null
        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }

    if ($applyStatus -eq 'preview_bootstrap_apply_complete') {
        $script:finalStatus = $applyStatus
        $form.Close()
        return
    }

    $statusLabel.Text = 'preview_bootstrap_apply_failed_redacted'
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
    $passwordBox.Focus()
    $runButton.Enabled = $true
})

$form.Add_FormClosed({
    $productionBox.Clear()
    $previewBox.Clear()
    $previewUrlBox.Clear()
    $directBox.Clear()
    $passwordBox.Clear()
    $certificateBox.Clear()
    $script:selectedCertificatePath = $null
    $statusLabel.Text = ''
    foreach ($name in @(
        'TYORA_PRODUCTION_PROJECT_REF',
        'TYORA_PREVIEW_PROJECT_REF',
        'PREVIEW_SUPABASE_URL',
        'PREVIEW_DIRECT_URL',
        'PREVIEW_SSL_CA_BASE64'
    )) {
        [Environment]::SetEnvironmentVariable($name, $null, 'Process')
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
})

$form.Add_Shown({ $productionBox.Focus() })
[void]$form.ShowDialog()

if ($script:finalStatus) {
    $script:finalStatus
    $script:finalStatus = $null
}
else {
    'preview_bootstrap_apply_cancelled'
}
