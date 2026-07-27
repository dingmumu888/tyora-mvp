Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Import-Module (Join-Path $PSScriptRoot 'lib\preview-target-validator.psm1') -Force

$safeCredentialStatuses = @(
    'read_only_check_pass',
    'authentication_failure',
    'temporary_block',
    'dns_failure',
    'timeout',
    'network_failure',
    'tls_certificate_failure',
    'tls_protocol_failure',
    'certificate_invalid',
    'invalid_preview_target',
    'other_failure'
)

function Invoke-ReadOnlyCredentialCheck {
    param(
        [Parameter(Mandatory = $true)][string]$ProductionRef,
        [Parameter(Mandatory = $true)][string]$PreviewRef,
        [Parameter(Mandatory = $true)][string]$PreviewUrl,
        [Parameter(Mandatory = $true)][string]$DirectTemplate,
        [Parameter(Mandatory = $true)][string]$CandidatePassword,
        [Parameter(Mandatory = $true)][string]$CertificateBase64
    )

    $nodeCommand = Get-Command node -ErrorAction Stop
    $runnerPath = Join-Path $PSScriptRoot 'preview-credential-readonly-check.mjs'
    $payload = @{
        productionRef = $ProductionRef
        previewRef = $PreviewRef
        previewSupabaseUrl = $PreviewUrl
        directUrlTemplate = $DirectTemplate
        password = $CandidatePassword
        certificateBase64 = $CertificateBase64
    } | ConvertTo-Json -Compress

    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $nodeCommand.Source
    $startInfo.ArgumentList.Add('--no-warnings')
    $startInfo.ArgumentList.Add($runnerPath)
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardInput = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    foreach ($name in @($startInfo.Environment.Keys)) {
        if ($name -match '(?i:DATABASE|DIRECT_URL|SUPABASE|PASSWORD|SECRET|TOKEN|API_KEY|RESEND|AUTH)') {
            $startInfo.Environment.Remove($name)
        }
    }
    $startInfo.Environment['NODE_NO_WARNINGS'] = '1'

    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $startInfo
    $started = $false
    try {
        if (-not $process.Start()) {
            return 'other_failure'
        }
        $started = $true
        $process.StandardInput.Write($payload)
        $process.StandardInput.Close()

        $outputTask = $process.StandardOutput.ReadToEndAsync()
        $errorTask = $process.StandardError.ReadToEndAsync()
        if (-not $process.WaitForExit(20000)) {
            $process.Kill($true)
            return 'timeout'
        }

        $status = $outputTask.GetAwaiter().GetResult().Trim()
        $discardedError = $errorTask.GetAwaiter().GetResult()
        if ($status -notin $safeCredentialStatuses) {
            return 'other_failure'
        }
        return $status
    }
    catch {
        return 'other_failure'
    }
    finally {
        if ($started -and -not $process.HasExited) {
            try { $process.Kill($true) } catch {}
        }
        $process.Dispose()
        $payload = $null
        $CandidatePassword = $null
        $CertificateBase64 = $null
        $status = $null
        $discardedError = $null
        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'TYORA Preview Credential Check - READ ONLY'
$form.Size = New-Object System.Drawing.Size(800, 875)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::White
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = 'Preview database credential check'
$title.Location = New-Object System.Drawing.Point(30, 22)
$title.Size = New-Object System.Drawing.Size(720, 38)
$title.Font = New-Object System.Drawing.Font('Segoe UI', 20, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($title)

$intro = New-Object System.Windows.Forms.Label
$intro.Text = 'READ ONLY. Target validation runs first. The database check uses only BEGIN READ ONLY, SELECT 1, and ROLLBACK.'
$intro.Location = New-Object System.Drawing.Point(34, 67)
$intro.Size = New-Object System.Drawing.Size(710, 45)
$intro.ForeColor = [System.Drawing.Color]::FromArgb(75, 85, 99)
$form.Controls.Add($intro)

function Add-MaskedField {
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

$productionBox = Add-MaskedField '1. Production project ref' 120
$previewBox = Add-MaskedField '2. Preview project ref' 195
$previewUrlBox = Add-MaskedField '3. Preview Supabase URL' 270
$directBox = Add-MaskedField '4. Raw URI or quoted DIRECT_URL= assignment using literal [YOUR-PASSWORD]' 345
$passwordBox = Add-MaskedField '5. Candidate Preview database password' 420

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

$selectedCertificatePath = $null
$browseButton.Add_Click({
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $candidatePath = $null
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
            $extension = [System.IO.Path]::GetExtension($candidatePath).ToLowerInvariant()
            if ($candidatePath.StartsWith('\\') -or $extension -notin @('.crt', '.cer', '.pem')) {
                throw [System.InvalidOperationException]::new('certificate_invalid')
            }
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
        $extension = $null
    }
})

$note = New-Object System.Windows.Forms.Label
$note.Text = 'All fields are masked. The selected certificate and values remain in memory and are never displayed, logged, saved, or placed in command-line arguments.'
$note.Location = New-Object System.Drawing.Point(34, 580)
$note.Size = New-Object System.Drawing.Size(710, 48)
$note.ForeColor = [System.Drawing.Color]::FromArgb(107, 114, 128)
$form.Controls.Add($note)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = 'not_checked'
$statusLabel.Location = New-Object System.Drawing.Point(34, 645)
$statusLabel.Size = New-Object System.Drawing.Size(710, 34)
$statusLabel.Font = New-Object System.Drawing.Font('Consolas', 11, [System.Drawing.FontStyle]::Bold)
$statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(75, 85, 99)
$form.Controls.Add($statusLabel)

$closeButton = New-Object System.Windows.Forms.Button
$closeButton.Text = 'Close'
$closeButton.Location = New-Object System.Drawing.Point(480, 715)
$closeButton.Size = New-Object System.Drawing.Size(120, 44)
$closeButton.Add_Click({ $form.Close() })
$form.Controls.Add($closeButton)

$checkButton = New-Object System.Windows.Forms.Button
$checkButton.Text = 'Run read-only check'
$checkButton.Location = New-Object System.Drawing.Point(612, 715)
$checkButton.Size = New-Object System.Drawing.Size(132, 44)
$checkButton.BackColor = [System.Drawing.Color]::FromArgb(37, 99, 235)
$checkButton.ForeColor = [System.Drawing.Color]::White
$checkButton.FlatStyle = 'Flat'
$form.Controls.Add($checkButton)

$checkButton.Add_Click({
    $checkButton.Enabled = $false
    $statusLabel.Text = 'checking_read_only'
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(75, 85, 99)
    $form.Refresh()

    $targetResult = Test-TyoraPreviewTarget `
        -ProductionRef $productionBox.Text `
        -PreviewRef $previewBox.Text `
        -PreviewSupabaseUrl $previewUrlBox.Text `
        -DirectUrlTemplate $directBox.Text

    if ($targetResult.Status -ne 'target_validation_pass') {
        $statusLabel.Text = $targetResult.Status
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
        switch ($targetResult.Field) {
            'production_ref' { $productionBox.Focus() }
            'preview_ref' { $previewBox.Focus() }
            'preview_url' { $previewUrlBox.Focus() }
            'direct_url' { $directBox.Focus() }
        }
        $checkButton.Enabled = $true
        return
    }

    if (-not $passwordBox.Text) {
        $statusLabel.Text = 'candidate_password_missing'
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
        $passwordBox.Focus()
        $checkButton.Enabled = $true
        return
    }

    if (-not $script:selectedCertificatePath -or -not $certificateBox.Text) {
        $statusLabel.Text = 'certificate_missing'
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
        $browseButton.Focus()
        $checkButton.Enabled = $true
        return
    }

    $certificateBytes = $null
    $certificateBase64 = $null
    $certificateInfo = $null
    $status = 'certificate_invalid'
    try {
        $extension = [System.IO.Path]::GetExtension($script:selectedCertificatePath).ToLowerInvariant()
        $certificateInfo = [System.IO.FileInfo]::new($script:selectedCertificatePath)
        if (
            $script:selectedCertificatePath.StartsWith('\\') -or
            $extension -notin @('.crt', '.cer', '.pem') -or
            -not $certificateInfo.Exists -or
            $certificateInfo.Length -le 0 -or
            $certificateInfo.Length -gt 262144 -or
            (($certificateInfo.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
        ) {
            throw [System.InvalidOperationException]::new('certificate_invalid')
        }

        $certificateBytes = [System.IO.File]::ReadAllBytes($script:selectedCertificatePath)
        if ($certificateBytes.Length -le 0 -or $certificateBytes.Length -gt 262144) {
            throw [System.InvalidOperationException]::new('certificate_invalid')
        }
        $certificateBase64 = [Convert]::ToBase64String($certificateBytes)

        $status = Invoke-ReadOnlyCredentialCheck `
            -ProductionRef $productionBox.Text.Trim() `
            -PreviewRef $previewBox.Text.Trim() `
            -PreviewUrl $previewUrlBox.Text.Trim() `
            -DirectTemplate $directBox.Text.Trim() `
            -CandidatePassword $passwordBox.Text `
            -CertificateBase64 $certificateBase64
    }
    catch {
        $status = 'certificate_invalid'
    }
    finally {
        if ($certificateBytes) {
            [Array]::Clear($certificateBytes, 0, $certificateBytes.Length)
        }
        $certificateBytes = $null
        $certificateBase64 = $null
        $certificateInfo = $null
        $extension = $null
    }

    $passwordBox.Clear()
    $statusLabel.Text = $status
    if ($status -eq 'read_only_check_pass') {
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
    }
    else {
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
        if ($status -eq 'certificate_invalid') {
            $browseButton.Focus()
        }
        else {
            $passwordBox.Focus()
        }
    }
    $status = $null
    $targetResult = $null
    $checkButton.Enabled = $true
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
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
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
})

$form.Add_Shown({ $productionBox.Focus() })
[void]$form.ShowDialog()
