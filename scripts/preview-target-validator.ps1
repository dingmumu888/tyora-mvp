Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Import-Module (Join-Path $PSScriptRoot 'lib\preview-target-validator.psm1') -Force

$form = New-Object System.Windows.Forms.Form
$form.Text = 'TYORA Preview Target Validation - OFFLINE ONLY'
$form.Size = New-Object System.Drawing.Size(780, 700)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.TopMost = $true
$form.BackColor = [System.Drawing.Color]::White
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = 'Preview target validation'
$title.Location = New-Object System.Drawing.Point(30, 24)
$title.Size = New-Object System.Drawing.Size(700, 38)
$title.Font = New-Object System.Drawing.Font(
    'Segoe UI',
    20,
    [System.Drawing.FontStyle]::Bold
)
$form.Controls.Add($title)

$intro = New-Object System.Windows.Forms.Label
$intro.Text = 'OFFLINE ONLY. No password, network request, authentication, database connection, or file output is used.'
$intro.Location = New-Object System.Drawing.Point(34, 70)
$intro.Size = New-Object System.Drawing.Size(690, 45)
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
    $fieldLabel.Size = New-Object System.Drawing.Size(690, 25)
    $fieldLabel.Font = New-Object System.Drawing.Font(
        'Segoe UI',
        10,
        [System.Drawing.FontStyle]::Bold
    )
    $form.Controls.Add($fieldLabel)

    $box = New-Object System.Windows.Forms.TextBox
    $box.Location = New-Object System.Drawing.Point(34, ($Y + 29))
    $box.Size = New-Object System.Drawing.Size(690, 31)
    $box.UseSystemPasswordChar = $true
    $form.Controls.Add($box)
    $box
}

$productionBox = Add-MaskedField '1. Production project ref' 125
$previewBox = Add-MaskedField '2. Preview project ref' 205
$previewUrlBox = Add-MaskedField '3. Preview Supabase URL' 285
$directBox = Add-MaskedField '4. Raw URI or quoted DIRECT_URL= assignment using literal [YOUR-PASSWORD]' 365

$note = New-Object System.Windows.Forms.Label
$note.Text = 'Validation is local and in-memory. A failed check keeps this form open and focuses only the field that needs correction.'
$note.Location = New-Object System.Drawing.Point(34, 455)
$note.Size = New-Object System.Drawing.Size(690, 45)
$note.ForeColor = [System.Drawing.Color]::FromArgb(107, 114, 128)
$form.Controls.Add($note)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = 'not_validated'
$statusLabel.Location = New-Object System.Drawing.Point(34, 515)
$statusLabel.Size = New-Object System.Drawing.Size(690, 34)
$statusLabel.Font = New-Object System.Drawing.Font(
    'Consolas',
    11,
    [System.Drawing.FontStyle]::Bold
)
$statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(75, 85, 99)
$form.Controls.Add($statusLabel)

$closeButton = New-Object System.Windows.Forms.Button
$closeButton.Text = 'Close'
$closeButton.Location = New-Object System.Drawing.Point(470, 575)
$closeButton.Size = New-Object System.Drawing.Size(110, 42)
$closeButton.Add_Click({ $form.Close() })
$form.Controls.Add($closeButton)

$validateButton = New-Object System.Windows.Forms.Button
$validateButton.Text = 'Validate target'
$validateButton.Location = New-Object System.Drawing.Point(592, 575)
$validateButton.Size = New-Object System.Drawing.Size(132, 42)
$validateButton.BackColor = [System.Drawing.Color]::FromArgb(37, 99, 235)
$validateButton.ForeColor = [System.Drawing.Color]::White
$validateButton.FlatStyle = 'Flat'
$form.Controls.Add($validateButton)

$validateButton.Add_Click({
    $result = Test-TyoraPreviewTarget `
        -ProductionRef $productionBox.Text `
        -PreviewRef $previewBox.Text `
        -PreviewSupabaseUrl $previewUrlBox.Text `
        -DirectUrlTemplate $directBox.Text

    $statusLabel.Text = $result.Status
    if ($result.Status -eq 'target_validation_pass') {
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(5, 150, 105)
    }
    else {
        $statusLabel.ForeColor = [System.Drawing.Color]::FromArgb(220, 38, 38)
        switch ($result.Field) {
            'production_ref' { $productionBox.Focus() }
            'preview_ref' { $previewBox.Focus() }
            'preview_url' { $previewUrlBox.Focus() }
            'direct_url' { $directBox.Focus() }
        }
    }

    $result = $null
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
})

$form.Add_FormClosed({
    $productionBox.Clear()
    $previewBox.Clear()
    $previewUrlBox.Clear()
    $directBox.Clear()
    $statusLabel.Text = ''
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
})

$form.Add_Shown({ $productionBox.Focus() })
[void]$form.ShowDialog()
