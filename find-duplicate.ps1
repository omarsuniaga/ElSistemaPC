$lines = Get-Content "src/modulos/Attendance/store/attendance.ts"
Write-Host "Total lines: $($lines.Count)"

$duplicateLines = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "fetchObservationsForClass") {
        $duplicateLines += "$($i + 1): $($lines[$i])"
    }
}

Write-Host "Lines containing 'fetchObservationsForClass':"
$duplicateLines | ForEach-Object { Write-Host $_ }

# Check around line 1398 specifically
if ($lines.Count -gt 1397) {
    Write-Host "`nLines around 1398:"
    for ($i = 1395; $i -le 1400; $i++) {
        if ($i -lt $lines.Count) {
            Write-Host "$($i + 1): $($lines[$i])"
        }
    }
}
