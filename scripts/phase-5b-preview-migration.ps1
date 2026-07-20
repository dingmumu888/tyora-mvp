Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Import-Module (Join-Path $PSScriptRoot 'lib\preview-target-validator.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'lib\preview-bootstrap-gui-result.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'lib\phase-5b-certificate-validator.psm1') -Force

$script:finalStatus = $null
$script:selectedCertificatePath = $null
$script:passwordPlaceholder = '[YOUR-PASSWORD]'
$script:secretEnvironmentNamePattern = '(?i)(DATABASE|DIRECT_URL|SUPABASE|PASSWORD|SECRET|TOKEN|API_KEY|RESEND|AUTH|NODE_EXTRA_CA_CERTS|^PG(?:HOST|USER|PASSWORD|DATABASE|PORT|SERVICE)$)'

foreach ($name in @([Environment]::GetEnvironmentVariables('Process').Keys)) {
    if ($name -match $script:secretEnvironmentNamePattern) {
        [Environment]::SetEnvironmentVariable([string]$name, $null, 'Process')
    }
}

function Normalize-Phase5bDirectUrlTemplate {
    param([AllowEmptyString()][string]$InputValue)

    $value = if ($null -eq $InputValue) { '' } else { $InputValue.Trim() }
    if (-not $value) { throw [System.InvalidOperationException]::new('direct_url_empty') }

    $assignment = [regex]::Match($value, '^(?i:DIRECT_URL)\s*=\s*(?<body>[\s\S]*)$')
    if ($assignment.Success) {
        $body = $assignment.Groups['body'].Value.Trim()
        if ($body.Length -lt 2) {
            throw [System.InvalidOperationException]::new('direct_url_invalid_assignment')
        }
        $first = $body[0]
        $last = $body[$body.Length - 1]
        if (($first -ne [char]34 -and $first -ne [char]39) -or $first -ne $last) {
            throw [System.InvalidOperationException]::new('direct_url_invalid_assignment')
        }
        $value = $body.Substring(1, $body.Length - 2).Trim()
    }
    elseif ($value -match '^(?i:DIRECT_URL)\b') {
        throw [System.InvalidOperationException]::new('direct_url_invalid_assignment')
    }
    elseif ($value.Length -ge 1) {
        $first = $value[0]
        $last = $value[$value.Length - 1]
        if ($first -eq [char]34 -or $first -eq [char]39 -or $last -eq [char]34 -or $last -eq [char]39) {
            if ($value.Length -lt 2 -or $first -ne $last) {
                throw [System.InvalidOperationException]::new('direct_url_invalid_assignment')
            }
            $value = $value.Substring(1, $value.Length - 2).Trim()
        }
    }

    if (-not $value) { throw [System.InvalidOperationException]::new('direct_url_empty') }
    $value
}

function Invoke-Phase5bMigrationConsole {
    param(
        [Parameter(Mandatory = $true)][string]$ProductionRef,
        [Parameter(Mandatory = $true)][string]$PreviewRef,
        [Parameter(Mandatory = $true)][string]$PreviewSupabaseUrl,
        [Parameter(Mandatory = $true)][string]$PreviewDirectUrl,
        [Parameter(Mandatory = $true)][string]$CertificatePath
    )

    $child = $null
    try {
        [Environment]::SetEnvironmentVariable('TYORA_PRODUCTION_PROJECT_REF', $ProductionRef, 'Process')
        [Environment]::SetEnvironmentVariable('TYORA_PREVIEW_PROJECT_REF', $PreviewRef, 'Process')
        [Environment]::SetEnvironmentVariable('PREVIEW_SUPABASE_URL', $PreviewSupabaseUrl, 'Process')
        [Environment]::SetEnvironmentVariable('PREVIEW_DIRECT_URL', $PreviewDirectUrl, 'Process')
        [Environment]::SetEnvironmentVariable('PREVIEW_SSL_CA_PATH', $CertificatePath, 'Process')

        $pwshCommand = Get-Command pwsh -ErrorAction Stop
        $consolePath = Join-Path $PSScriptRoot 'phase-5b-preview-migration-console.ps1'
        $child = Start-Process `
            -FilePath $pwshCommand.Source `
            -ArgumentList @('-NoLogo', '-NoProfile', '-File', ('"' + $consolePath + '"')) `
            -WorkingDirectory (Split-Path $PSScriptRoot -Parent) `
            -WindowStyle Normal `
            -PassThru `
            -Wait

        $exitCodeProperty = $child.PSObject.Properties['ExitCode']
        if ($null -eq $exitCodeProperty) { return 'phase5b_migration_failed_redacted' }
        if ([int]$exitCodeProperty.Value -eq 0) { return 'phase5b_migration_complete' }
        'phase5b_migration_failed_redacted'
    }
    catch {
        'phase5b_migration_failed_redacted'
    }
    finally {
        foreach ($name in @(
            'TYORA_PRODUCTION_PROJECT_REF',
            'TYORA_PREVIEW_PROJECT_REF',
            'PREVIEW_SUPABASE_URL',
            'PREVIEW_DIRECT_URL',
            'PREVIEW_SSL_CA_PATH'
        )) {
            [Environment]::SetEnvironmentVariable($name, $null, 'Process')
        }
        if ($child) { $child.Dispose() }
        $PreviewDirectUrl = $null
        $CertificatePath = $null
        $child = $null
        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'TYORA Phase 5B - APPROVED PREVIEW MIGRATION'
$form.Size = New-Object System.Drawing.Size(800, 875)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::White
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = 'Apply Phase 5B to tyora-preview only'
$title.Location = New-Object System.Drawing.Point(30, 22)
$title.Size = New-Object System.Drawing.Size(720, 38)
$title.Font = New-Object System.Drawing.Font('Segoe UI', 20, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($title)

$intro = New-Object System.Windows.Forms.Label
$intro.Text = 'APPROVED PREVIEW WRITE. Revalidates target, TLS CA, migration checksum, and history immediately before prisma migrate deploy.'
$intro.Location = New-Object System.Drawing.Point(34, 67)
$intro.Size = New-Object System.Drawing.Size(710, 45)
$intro.ForeColor = [System.Drawing.Color]::FromArgb(153, 27, 27)
$form.Controls.Add($intro)

function Add-Phase5bMaskedField {
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

$productionBox = Add-Phase5bMaskedField '1. Production project ref (identity only)' 120
$previewBox = Add-Phase5bMaskedField '2. Preview project ref' 195
$previewUrlBox = Add-Phase5bMaskedField '3. Preview Supabase URL' 270
$directBox = Add-Phase5bMaskedField '4. Session/direct URI template on port 5432 using literal [YOUR-PASSWORD]' 345
$passwordBox = Add-Phase5bMaskedField '5. Preview database password' 420

$certificateLabel = New-Object System.Windows.Forms.Label
$certificateLabel.Text = '6. Supabase Preview SSL certificate'
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
    try {
        $dialog.Title = 'Select Supabase Preview SSL certificate'
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
            $script:selectedCertificatePath = $candidatePath
            $certificateBox.Text = 'certificate selected'
            $statusLabel.Text = 'certificate_selected_pending_validation'
            $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
        }
    }
    catch {
        $script:selectedCertificatePath = $null
        $certificateBox.Clear()
        $statusLabel.Text = 'certificate_selection_failed'
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
    }
    finally {
        $dialog.FileName = ''
        $dialog.Dispose()
        $candidatePath = $null
    }
})

$note = New-Object System.Windows.Forms.Label
$note.Text = 'All fields are masked. A separate console requires the exact typed phrase: APPLY PHASE 5B <Preview project ref>.'
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
        $statusLabel.Text = 'preview_password_missing'
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
    $uriBuilder = $null
    $migrationStatus = 'phase5b_migration_failed_redacted'
    try {
        if ($passwordValue.Length -gt 4096) {
            throw [System.InvalidOperationException]::new('preview_password_invalid')
        }
        if (-not (Test-Phase5bCertificateFile -CertificatePath $script:selectedCertificatePath)) {
            throw [System.InvalidOperationException]::new('certificate_invalid')
        }

        $directTemplate = Normalize-Phase5bDirectUrlTemplate -InputValue $directBox.Text
        $encodedPassword = [Uri]::EscapeDataString($passwordValue)
        $previewDirectUrl = $directTemplate.Replace($script:passwordPlaceholder, $encodedPassword)
        $uriBuilder = [System.UriBuilder]::new($previewDirectUrl)
        $uriBuilder.Query = 'sslmode=verify-full'
        $previewDirectUrl = $uriBuilder.Uri.AbsoluteUri

        $parsedDirectUrl = [Uri]::new($previewDirectUrl, [UriKind]::Absolute)
        $separator = $parsedDirectUrl.UserInfo.IndexOf(':')
        if ($separator -le 0) {
            throw [System.InvalidOperationException]::new('database_url_encoding_failure')
        }
        $decodedPassword = [Uri]::UnescapeDataString($parsedDirectUrl.UserInfo.Substring($separator + 1))
        if (-not [string]::Equals($decodedPassword, $passwordValue, [StringComparison]::Ordinal)) {
            throw [System.InvalidOperationException]::new('database_url_encoding_failure')
        }

        $statusLabel.Text = 'waiting_for_typed_preview_confirmation'
        $form.Refresh()
        $form.Hide()
        $migrationStatus = Invoke-Phase5bMigrationConsole `
            -ProductionRef $productionBox.Text.Trim() `
            -PreviewRef $previewBox.Text.Trim() `
            -PreviewSupabaseUrl $previewUrlBox.Text.Trim() `
            -PreviewDirectUrl $previewDirectUrl `
            -CertificatePath $script:selectedCertificatePath
    }
    catch {
        $migrationStatus = 'phase5b_migration_failed_redacted'
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
        $uriBuilder = $null
        $parsedDirectUrl = $null
        $decodedPassword = $null
        $rawTargetResult = $null
        $targetResult = $null
        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }

    if ($migrationStatus -eq 'phase5b_migration_complete') {
        $script:finalStatus = $migrationStatus
        $form.Close()
        return
    }

    $statusLabel.Text = 'phase5b_migration_failed_redacted'
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
        'PREVIEW_SSL_CA_PATH'
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
    'phase5b_migration_not_run'
}
