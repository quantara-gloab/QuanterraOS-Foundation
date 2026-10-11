Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = "C:\Users\enseg\OneDrive\Desktop\QuanterraOS_Elite_Eleven_Full_Kit.zip"
$destDir = "C:\Users\enseg\OneDrive\Desktop\quanterraos-foundation\quanterraos-foundation\extracted_kit"

if (-not (Test-Path $zipPath)) {
    Write-Error "Zip file not found: $zipPath"
    exit 1
}

Write-Host "Extracting $zipPath to $destDir..."
if (Test-Path $destDir) {
    Remove-Item -Recurse -Force $destDir
}
New-Item -ItemType Directory -Path $destDir -Force | Out-Null

[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $destDir)
Write-Host "Extraction complete!"

$files = Get-ChildItem -Path $destDir -Recurse -File
Write-Host "Total extracted files: $($files.Count)"
$files | Where-Object { $_.Extension -eq '.png' } | Select-Object -First 60 FullName, Length | Format-Table -AutoSize
