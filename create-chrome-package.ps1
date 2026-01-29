# Create Chrome Web Store package for FastKeys
# Run from project folder: .\create-chrome-package.ps1

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot
$packageName = "FastKeys-chrome-package.zip"
$tempDir = Join-Path $env:TEMP "FastKeys-package-$(Get-Random)"

try {
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
    New-Item -ItemType Directory -Path $tempDir | Out-Null

    # Copy only what Chrome needs for the extension
    $items = @(
        "manifest.json",
        "background",
        "content",
        "icons",
        "lib",
        "options",
        "popup",
        "privacy-policy.html"
    )

    foreach ($item in $items) {
        $src = Join-Path $projectRoot $item
        $dst = Join-Path $tempDir $item
        if (Test-Path $src) {
            if (Test-Path $src -PathType Container) {
                Copy-Item -Path $src -Destination $dst -Recurse -Force
            } else {
                Copy-Item -Path $src -Destination $dst -Force
            }
        }
    }

    # Remove old package if exists
    $zipPath = Join-Path $projectRoot $packageName
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

    # Create zip (Compress-Archive puts contents of tempDir inside zip)
    Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

    Write-Host ""
    Write-Host "Package created: $packageName" -ForegroundColor Green
    Write-Host "Location: $zipPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Go to https://chrome.google.com/webstore/devconsole"
    Write-Host "2. Sign in and click 'New Item' (or update existing)"
    Write-Host "3. Upload $packageName"
    Write-Host "4. Fill in store listing and submit for review"
    Write-Host ""
}
finally {
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue }
}
