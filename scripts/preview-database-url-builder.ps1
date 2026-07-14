Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Import-Module (Join-Path $PSScriptRoot 'lib\preview-database-url-builder.psm1') -Force

$form = New-Object System.Windows.Forms.Form
$form.Text = 'TYORA Preview DATABASE_URL Builder - OFFLINE ONLY'
$form.Size = New-Object System.Drawing.Size(800, 700)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::White
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = 'Preview DATABASE_URL Builder'
$title.Location = New-Object System.Drawing.Point(30, 22)
$title.Size = New-Object System.Drawing.Size(720, 38)
$title.Font = New-Object System.Drawing.Font('Segoe UI', 20, [System.Drawing.FontStyle]::Bold)
$form.Controls.Add($title)

$intro = New-Object System.Windows.Forms.Label
$intro.Text = 'OFFLINE ONLY. Validates a Preview transaction pooler template on port 6543, then copies the raw URI without displaying it.'
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
$templateBox = Add-MaskedField '3. Raw URI or quoted DATABASE_URL= assignment using literal [YOUR-PASSWORD]' 270
$passwordBox = Add-MaskedField '4. Candidate Preview database password' 345

$note = New-Object System.Windows.Forms.Label
$note.Text = 'All inputs are masked. The generated URI is copied directly to the Windows clipboard and is never shown or written to disk.'
$note.Location = New-Object System.Drawing.Point(34, 430)
$note.Size = New-Object System.Drawing.Size(710, 48)
$note.ForeColor = [System.Drawing.Color]::FromArgb(107, 114, 128)
$form.Controls.Add($note)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = 'not_built'
$statusLabel.Location = New-Object System.Drawing.Point(34, 495)
$statusLabel.Size = New-Object System.Drawing.Size(710, 34)
$statusLabel.Font = New-Object System.Drawing.Font('Consolas', 11, [System.Drawing.FontStyle]::Bold)
$statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(75, 85, 99)
$form.Controls.Add($statusLabel)

$closeButton = New-Object System.Windows.Forms.Button
$closeButton.Text = 'Close'
$closeButton.Location = New-Object System.Drawing.Point(480, 565)
$closeButton.Size = New-Object System.Drawing.Size(120, 44)
$closeButton.Add_Click({ $form.Close() })
$form.Controls.Add($closeButton)

$copyButton = New-Object System.Windows.Forms.Button
$copyButton.Text = 'Build and copy'
$copyButton.Location = New-Object System.Drawing.Point(612, 565)
$copyButton.Size = New-Object System.Drawing.Size(132, 44)
$copyButton.BackColor = [System.Drawing.Color]::FromArgb(37, 99, 235)
$copyButton.ForeColor = [System.Drawing.Color]::White
$copyButton.FlatStyle = 'Flat'
$form.Controls.Add($copyButton)

$copyButton.Add_Click({
    $copyButton.Enabled = $false
    $statusLabel.Text = 'validating_offline'
    $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(75, 85, 99)
    $form.Refresh()

    $passwordValue = $passwordBox.Text
    $result = $null
    $generatedUri = $null
    try {
        $result = New-TyoraPreviewDatabaseUrl `
            -ProductionRef $productionBox.Text `
            -PreviewRef $previewBox.Text `
            -DatabaseUrlTemplate $templateBox.Text `
            -CandidatePassword $passwordValue

        if ($result.Status -ne 'database_url_ready') {
            $statusLabel.Text = $result.Status
            $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
            switch ($result.Field) {
                'production_ref' { $productionBox.Focus() }
                'preview_ref' { $previewBox.Focus() }
                'database_url' { $templateBox.Focus() }
                'password' { $passwordBox.Focus() }
            }
            return
        }

        $generatedUri = $result.RawUri
        [System.Windows.Forms.Clipboard]::SetText($generatedUri)
        $passwordBox.Clear()
        $passwordValue = $null
        $result.RawUri = $null
        $generatedUri = $null
        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()

        $statusLabel.Text = 'copied_to_clipboard'
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
        $productionBox.Clear()
        $previewBox.Clear()
        $templateBox.Clear()
        $productionBox.Focus()
    }
    catch {
        $statusLabel.Text = 'clipboard_failure'
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
    }
    finally {
        $passwordBox.Clear()
        if ($null -ne $result) {
            $result.RawUri = $null
        }
        $passwordValue = $null
        $generatedUri = $null
        $result = $null
        $copyButton.Enabled = $true
        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }
})

$form.Add_FormClosed({
    $productionBox.Clear()
    $previewBox.Clear()
    $templateBox.Clear()
    $passwordBox.Clear()
    $statusLabel.Text = ''
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
})

$form.Add_Shown({ $productionBox.Focus() })
[void]$form.ShowDialog()
