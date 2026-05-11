param(
    [Parameter(Mandatory = $false)]
    [string]$ApiUrl = $env:VITE_API_URL,

    [Parameter(Mandatory = $false)]
    [switch]$OpenStudio
)

if (-not $ApiUrl) {
    Write-Host "VITE_API_URL nincs beállítva, default: http://10.0.2.2:8080 (Android emulátor + helyi backend)" -ForegroundColor Yellow
    $ApiUrl = "http://10.0.2.2:8080"
}

$mobileDir = Split-Path -Parent $PSScriptRoot
$frontendDir = Join-Path (Split-Path -Parent $mobileDir) "frontend"

Write-Host "1) Frontend build, VITE_API_URL=$ApiUrl" -ForegroundColor Cyan
Push-Location $frontendDir
$env:VITE_API_URL = $ApiUrl
npm run build
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Error "Frontend build sikertelen"
    exit 1
}
Pop-Location

Write-Host "2) cap sync android" -ForegroundColor Cyan
Push-Location $mobileDir
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Error "cap sync sikertelen"
    exit 1
}

if ($OpenStudio) {
    Write-Host "3) Android Studio nyitás" -ForegroundColor Cyan
    npx cap open android
}
else {
    Write-Host "Kész. Futtatáshoz: npx cap run android, vagy: ./scripts/build-and-sync.ps1 -OpenStudio" -ForegroundColor Green
}
Pop-Location
