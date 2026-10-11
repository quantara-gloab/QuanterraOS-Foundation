$src = "C:\Users\enseg\OneDrive\Desktop\quanterraos-foundation\quanterraos-foundation\extracted_kit\assets"
$destPublic = "C:\Users\enseg\OneDrive\Desktop\quanterraos-foundation\quanterraos-foundation\public\assets"
$destAssets = "C:\Users\enseg\OneDrive\Desktop\quanterraos-foundation\quanterraos-foundation\assets"

New-Item -ItemType Directory -Path "$destPublic\art-44" -Force | Out-Null
New-Item -ItemType Directory -Path "$destPublic\apparel" -Force | Out-Null
New-Item -ItemType Directory -Path "$destAssets\art-44" -Force | Out-Null
New-Item -ItemType Directory -Path "$destAssets\apparel" -Force | Out-Null

$files = Get-ChildItem -Path $src -File
Write-Host "Copying $($files.Count) assets from $src..."

foreach ($f in $files) {
    # Copy directly into public/assets/ and assets/
    Copy-Item -Path $f.FullName -Destination "$destPublic\$($f.Name)" -Force
    Copy-Item -Path $f.FullName -Destination "$destAssets\$($f.Name)" -Force
    
    # If artwork (q44-*.png), copy into art-44/ as well
    if ($f.Name -like "q44-*.png") {
        Copy-Item -Path $f.FullName -Destination "$destPublic\art-44\$($f.Name)" -Force
        Copy-Item -Path $f.FullName -Destination "$destAssets\art-44\$($f.Name)" -Force
    }
    
    # If apparel, copy into apparel/ as well
    if ($f.Name -like "apparel-*.png" -or $f.Name -like "royal-*.png") {
        Copy-Item -Path $f.FullName -Destination "$destPublic\apparel\$($f.Name)" -Force
        Copy-Item -Path $f.FullName -Destination "$destAssets\apparel\$($f.Name)" -Force
    }
}

# Alias apparel names for backwards compatibility
$apparelMap = @{
    "apparel-draco.png" = "draco-apparel-board.png";
    "apparel-falcon.png" = "falcon-apparel-board.png";
    "apparel-kraken.png" = "kraken-apparel-board.png";
    "apparel-lion.png" = "lion-apparel-board.png";
    "apparel-michael-quanterra.png" = "michael-apparel-board.png";
    "apparel-phoenix.png" = "phoenix-apparel-board.png";
    "apparel-quanta.png" = "quanta-leader-apparel-board.png";
    "apparel-quantana.png" = "quantana-apparel-board.png";
    "apparel-quantum-fox.png" = "quantum-fox-apparel-board.png";
    "apparel-sentinel.png" = "sentinel-apparel-board.png";
    "apparel-wolf.png" = "wolf-apparel-board.png";
    "royal-king.png" = "king-royal-galactic-board.png";
    "royal-queen.png" = "queen-royal-galactic-board.png";
}

foreach ($key in $apparelMap.Keys) {
    $alias = $apparelMap[$key]
    $sourceFile = "$src\$key"
    if (Test-Path $sourceFile) {
        Copy-Item -Path $sourceFile -Destination "$destPublic\apparel\$alias" -Force
        Copy-Item -Path $sourceFile -Destination "$destAssets\apparel\$alias" -Force
        Copy-Item -Path $sourceFile -Destination "$destPublic\$alias" -Force
        Copy-Item -Path $sourceFile -Destination "$destAssets\$alias" -Force
    }
}

Write-Host "All assets successfully copied and aliased!"
