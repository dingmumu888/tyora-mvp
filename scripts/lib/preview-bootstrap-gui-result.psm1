Set-StrictMode -Version Latest

function New-PreviewGuiResult {
    param(
        [Parameter(Mandatory = $true)][string]$Status,
        [AllowEmptyString()][string]$Field = '',
        [AllowNull()][object[]]$Report = $null
    )

    [pscustomobject]@{
        Status = $Status
        Field = $Field
        Report = $Report
    }
}

function Resolve-PreviewGuiResult {
    [CmdletBinding()]
    param(
        [AllowNull()][object]$InputObject,
        [Parameter(Mandatory = $true)][string]$FallbackStatus,
        [switch]$IncludeField,
        [switch]$IncludeReport
    )

    $items = @($InputObject)
    if ($items.Count -ne 1 -or $null -eq $items[0]) {
        return New-PreviewGuiResult -Status $FallbackStatus
    }

    $candidate = $items[0]
    $statusProperty = $candidate.PSObject.Properties['Status']
    if ($null -eq $statusProperty) {
        return New-PreviewGuiResult -Status $FallbackStatus
    }

    try {
        $status = [string]$statusProperty.Value
    }
    catch {
        return New-PreviewGuiResult -Status $FallbackStatus
    }
    if ($status -cnotmatch '^[a-z][a-z0-9_]{0,63}$') {
        return New-PreviewGuiResult -Status $FallbackStatus
    }

    $field = ''
    if ($IncludeField) {
        $fieldProperty = $candidate.PSObject.Properties['Field']
        if ($null -ne $fieldProperty) {
            try {
                $candidateField = [string]$fieldProperty.Value
                if ($candidateField -in @(
                    '',
                    'production_ref',
                    'preview_ref',
                    'preview_url',
                    'direct_url'
                )) {
                    $field = $candidateField
                }
            }
            catch {
                $field = ''
            }
        }
    }

    $report = $null
    if ($IncludeReport) {
        $reportProperty = $candidate.PSObject.Properties['Report']
        if ($null -ne $reportProperty) {
            try {
                $report = @($reportProperty.Value)
            }
            catch {
                $report = $null
            }
        }
        if ($status -eq 'dry_run_complete' -and @($report).Count -eq 0) {
            return New-PreviewGuiResult -Status $FallbackStatus
        }
    }

    New-PreviewGuiResult -Status $status -Field $field -Report $report
}

Export-ModuleMember -Function Resolve-PreviewGuiResult
