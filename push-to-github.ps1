# Clean Git Push Script for Petflix
Write-Host "=== Initializing Git Repository ===" -ForegroundColor Cyan
git init

Write-Host "`n=== Staging All Files ===" -ForegroundColor Cyan
git add -A

Write-Host "`n=== Creating Commit ===" -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Update: Clean commit - $timestamp"

Write-Host "`n=== Setting Branch to Main ===" -ForegroundColor Cyan
git branch -M main

Write-Host "`n=== Configuring Remote ===" -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin https://github.com/jackrobertspb/Petflix.git
git remote -v

Write-Host "`n=== Checking Status ===" -ForegroundColor Cyan
git status

Write-Host "`n=== Last Commit ===" -ForegroundColor Cyan
git log --oneline -1

Write-Host "`n=== Pushing to GitHub ===" -ForegroundColor Yellow
Write-Host "Note: You may be prompted for GitHub credentials" -ForegroundColor Yellow
git push -u origin main --force

Write-Host "`n=== Done! ===" -ForegroundColor Green

