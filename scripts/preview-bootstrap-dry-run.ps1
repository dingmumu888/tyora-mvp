Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Import-Module (Join-Path $PSScriptRoot 'lib\preview-target-validator.psm1') -Force
Import-Module (Join-Path $PSScriptRoot 'lib\preview-bootstrap-gui-result.psm1') -Force

$script:finalReport = $null
$script:selectedCertificatePath = $null
$script:passwordPlaceholder = '[YOUR-PASSWORD]'

function Normalize-DirectUrlTemplate {
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

function Get-SelectedCertificateData {
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

function Invoke-GuardedPreviewDryRun {
    param(
        [Parameter(Mandatory = $true)][string]$ProductionRef,
        [Parameter(Mandatory = $true)][string]$PreviewRef,
        [Parameter(Mandatory = $true)][string]$PreviewSupabaseUrl,
        [Parameter(Mandatory = $true)][string]$PreviewDirectUrl,
        [Parameter(Mandatory = $true)][string]$CertificateBase64
    )

    $nodeCommand = Get-Command node -ErrorAction Stop
    $runnerPath = Join-Path $PSScriptRoot 'bootstrap-preview-db.mjs'
    $startInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $startInfo.FileName = $nodeCommand.Source
    $startInfo.ArgumentList.Add('--no-warnings')
    $startInfo.ArgumentList.Add($runnerPath)
    $startInfo.WorkingDirectory = (Split-Path $PSScriptRoot -Parent)
    $startInfo.UseShellExecute = $false
    $startInfo.CreateNoWindow = $true
    $startInfo.RedirectStandardInput = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.RedirectStandardError = $true

    foreach ($name in @($startInfo.Environment.Keys)) {
        if ($name -match '(?i:DATABASE|DIRECT_URL|SUPABASE|PASSWORD|SECRET|TOKEN|API_KEY|RESEND|AUTH|NODE_EXTRA_CA_CERTS)') {
            [void]$startInfo.Environment.Remove($name)
        }
    }
    $startInfo.Environment['TYORA_PRODUCTION_PROJECT_REF'] = $ProductionRef
    $startInfo.Environment['TYORA_PREVIEW_PROJECT_REF'] = $PreviewRef
    $startInfo.Environment['PREVIEW_SUPABASE_URL'] = $PreviewSupabaseUrl
    $startInfo.Environment['PREVIEW_DIRECT_URL'] = $PreviewDirectUrl
    $startInfo.Environment['PREVIEW_SSL_CA_BASE64'] = $CertificateBase64
    $startInfo.Environment['NODE_NO_WARNINGS'] = '1'
    $startInfo.Environment['NO_COLOR'] = '1'

    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $startInfo
    $started = $false
    $stdout = $null
    $discardedError = $null
    try {
        if (-not $process.Start()) {
            return [pscustomobject]@{ Status = 'dry_run_start_failed'; Report = $null }
        }
        $started = $true
        $process.StandardInput.Close()
        $outputTask = $process.StandardOutput.ReadToEndAsync()
        $errorTask = $process.StandardError.ReadToEndAsync()
        if (-not $process.WaitForExit(180000)) {
            $process.Kill($true)
            return [pscustomobject]@{ Status = 'dry_run_timeout'; Report = $null }
        }

        $stdout = $outputTask.GetAwaiter().GetResult()
        $discardedError = $errorTask.GetAwaiter().GetResult()
        $exitCodeProperty = $process.PSObject.Properties['ExitCode']
        if ($null -eq $exitCodeProperty -or $process.ExitCode -ne 0) {
            return [pscustomobject]@{ Status = 'dry_run_failed_redacted'; Report = $null }
        }

        $expectedSuffix = $PreviewRef.Substring($PreviewRef.Length - 6)
        $safetyMatch = [regex]::Match(
            $stdout,
            '(?m)^Preview safety checks passed for project \.\.\.(?<suffix>[a-z0-9]{6}) \((?<mode>direct|session-pooler), port 5432\)\.$'
        )
        $baselineMatch = [regex]::Match(
            $stdout,
            '(?m)^Schema baseline prepared in memory \((?<bytes>\d+) bytes, (?<entries>\d+) history entries\)\.$'
        )
        $fingerprintMatch = [regex]::Match(
            $stdout,
            '(?m)^Reviewed baseline fingerprint: (?<fingerprint>[a-f0-9]{64})$'
        )
        $completeMatch = [regex]::Match(
            $stdout,
            '(?m)^Dry-run complete\. No database changes were made\.'
        )
        if (
            -not $safetyMatch.Success -or
            -not $baselineMatch.Success -or
            -not $fingerprintMatch.Success -or
            -not $completeMatch.Success -or
            $safetyMatch.Groups['suffix'].Value -cne $expectedSuffix
        ) {
            return [pscustomobject]@{ Status = 'dry_run_output_rejected'; Report = $null }
        }

        $report = @(
            'Phase 0.5 Preview bootstrap dry-run report',
            'isolation.refs_different=yes',
            'isolation.preview_api_matches_preview_ref=yes',
            'isolation.database_target_matches_preview_ref=yes',
            'isolation.production_ref_excluded=yes',
            ('preview.project_suffix=...' + $expectedSuffix),
            ('preview.connection_mode=' + $safetyMatch.Groups['mode'].Value),
            'preview.port=5432',
            'preview.database=postgres',
            'tls.mode=verify-full',
            'tls.selected_supabase_ca=enabled',
            'tls.hostname_verification=enabled',
            'database.transaction=BEGIN READ ONLY / catalog SELECT / ROLLBACK',
            'database.public_schema_empty=yes',
            ('schema.baseline_bytes=' + $baselineMatch.Groups['bytes'].Value),
            ('schema.migration_history_entries=' + $baselineMatch.Groups['entries'].Value),
            ('schema.baseline_fingerprint=' + $fingerprintMatch.Groups['fingerprint'].Value),
            'apply_flag_used=no',
            'database_changes=none',
            'result=dry_run_complete'
        )
        [pscustomobject]@{ Status = 'dry_run_complete'; Report = $report }
    }
    catch {
        [pscustomobject]@{ Status = 'dry_run_failed_redacted'; Report = $null }
    }
    finally {
        if ($started) {
            try {
                $hasExitedProperty = $process.PSObject.Properties['HasExited']
                if ($null -ne $hasExitedProperty -and -not $process.HasExited) {
                    $process.Kill($true)
                }
            }
            catch {}
        }
        foreach ($name in @(
            'TYORA_PRODUCTION_PROJECT_REF',
            'TYORA_PREVIEW_PROJECT_REF',
            'PREVIEW_SUPABASE_URL',
            'PREVIEW_DIRECT_URL',
            'PREVIEW_SSL_CA_BASE64'
        )) {
            [void]$startInfo.Environment.Remove($name)
        }
        $process.Dispose()
        $stdout = $null
        $discardedError = $null
        $PreviewDirectUrl = $null
        $CertificateBase64 = $null
        $report = $null
        $safetyMatch = $null
        $baselineMatch = $null
        $fingerprintMatch = $null
        $completeMatch = $null
        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'TYORA Preview Bootstrap - DRY RUN / READ ONLY'
$form.Size = New-Object System.Drawing.Size(800, 875)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::White
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = 'Preview bootstrap dry-run'
$title.Location = New-Object System.Drawing.Point(30, 22)
$title.Size = New-Object System.Drawing.Size(720, 38)
$title.Font = New-Object System.Drawing.Font('Segoe UI', 20, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($title)

$intro = New-Object System.Windows.Forms.Label
$intro.Text = 'READ ONLY. Verifies isolation and emptiness, prepares a local schema fingerprint, and never applies it.'
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
            $certificateData = Get-SelectedCertificateData -CertificatePath $candidatePath
            if (-not $certificateData.Valid) {
                throw [System.InvalidOperationException]::new('certificate_invalid')
            }
            $certificateData.CertificateBase64 = $null
            $certificateData = $null
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
$note.Text = 'All fields are masked. No value is written to disk or passed in command-line arguments. Success closes this window and returns only a redacted report.'
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
$closeButton.Text = 'Cancel'
$closeButton.Location = New-Object System.Drawing.Point(480, 715)
$closeButton.Size = New-Object System.Drawing.Size(120, 44)
$closeButton.Add_Click({ $form.Close() })
$form.Controls.Add($closeButton)

$runButton = New-Object System.Windows.Forms.Button
$runButton.Text = 'Run dry-run'
$runButton.Location = New-Object System.Drawing.Point(612, 715)
$runButton.Size = New-Object System.Drawing.Size(132, 44)
$runButton.BackColor = [System.Drawing.Color]::FromArgb(37, 99, 235)
$runButton.ForeColor = [System.Drawing.Color]::White
$runButton.FlatStyle = 'Flat'
$form.Controls.Add($runButton)

$runButton.Add_Click({
    $runButton.Enabled = $false
    $statusLabel.Text = 'validating_isolation'
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
        $rawTargetResult = $null
        $targetResult = $null
        $targetStatus = $null
        return
    }
    $rawTargetResult = $null
    $targetResult = $null
    $targetStatus = $null
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
    $dryRunResult = $null
    try {
        if ($passwordValue.Length -gt 4096) {
            throw [System.InvalidOperationException]::new('candidate_password_invalid')
        }
        $certificateData = Get-SelectedCertificateData `
            -CertificatePath $script:selectedCertificatePath
        if (-not $certificateData.Valid) {
            throw [System.InvalidOperationException]::new('certificate_invalid')
        }
        $certificateBase64 = $certificateData.CertificateBase64
        $certificateData.CertificateBase64 = $null

        $directTemplate = Normalize-DirectUrlTemplate -InputValue $directBox.Text
        $encodedPassword = [Uri]::EscapeDataString($passwordValue)
        $previewDirectUrl = $directTemplate.Replace(
            $script:passwordPlaceholder,
            $encodedPassword
        )
        $previewDirectUrl = [regex]::Replace(
            $previewDirectUrl,
            '(?i)(\?sslmode=)(require|verify-ca|verify-full)$',
            '${1}verify-full'
        )

        $parsedDirectUrl = [Uri]::new($previewDirectUrl, [UriKind]::Absolute)
        $encodedUserInfo = $parsedDirectUrl.UserInfo
        $separator = $encodedUserInfo.IndexOf(':')
        if ($separator -le 0) {
            throw [System.InvalidOperationException]::new('database_url_encoding_failure')
        }
        $decodedPassword = [Uri]::UnescapeDataString(
            $encodedUserInfo.Substring($separator + 1)
        )
        if (-not [string]::Equals(
            $decodedPassword,
            $passwordValue,
            [StringComparison]::Ordinal
        )) {
            throw [System.InvalidOperationException]::new('database_url_encoding_failure')
        }

        $statusLabel.Text = 'checking_preview_read_only'
        $form.Refresh()
        $rawDryRunResult = @(
            Invoke-GuardedPreviewDryRun `
                -ProductionRef $productionBox.Text.Trim() `
                -PreviewRef $previewBox.Text.Trim() `
                -PreviewSupabaseUrl $previewUrlBox.Text.Trim() `
                -PreviewDirectUrl $previewDirectUrl `
                -CertificateBase64 $certificateBase64
        )
        $dryRunResult = Resolve-PreviewGuiResult `
            -InputObject $rawDryRunResult `
            -FallbackStatus 'dry_run_result_invalid' `
            -IncludeReport
    }
    catch {
        $statusLabel.Text = 'local_secret_build_failed'
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
    }
    finally {
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
        $encodedUserInfo = $null
        $decodedPassword = $null
        $rawDryRunResult = $null
        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }

    if ($null -eq $dryRunResult) {
        $passwordBox.Focus()
        $runButton.Enabled = $true
        return
    }

    $dryRunStatus = [string]$dryRunResult.Status
    if ($dryRunStatus -eq 'dry_run_complete') {
        $script:finalReport = @($dryRunResult.Report)
        $dryRunResult.Report = $null
        $dryRunResult = $null
        $form.Close()
        return
    }

    $statusLabel.Text = $dryRunStatus
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
    $dryRunResult = $null
    $dryRunStatus = $null
    $passwordBox.Focus()
    $runButton.Enabled = $true
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

if ($script:finalReport) {
    $script:finalReport
    $script:finalReport = $null
}
else {
    'dry_run_cancelled'
}
