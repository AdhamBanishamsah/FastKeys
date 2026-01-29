# Push FastKeys changes to GitHub
# Run this script from the project folder (right-click → Run with PowerShell, or in terminal: .\push-to-git.ps1)

Set-Location $PSScriptRoot

git status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Git is not available. Make sure Git is installed and in your PATH." -ForegroundColor Red
    exit 1
}

git add -A
git status

$message = "Add theme option, popup improvements, template/sync fixes, dark mode"
git commit -m $message
if ($LASTEXITCODE -ne 0) {
    Write-Host "Nothing to commit, or commit failed. Trying push anyway..." -ForegroundColor Yellow
}

git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "Push to GitHub completed." -ForegroundColor Green
} else {
    Write-Host "Push failed. You may need to run: git push -u origin main" -ForegroundColor Yellow
}
