#!/usr/bin/env pwsh
# RailMind AI — Development Environment Setup (Windows)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "`n=== RailMind AI — Development Setup ===" -ForegroundColor Cyan
Write-Host "AI-Assisted Railway Operations Intelligence Platform`n" -ForegroundColor DarkGray

# Check prerequisites
function Test-Prerequisite($cmd, $label) {
    try {
        Get-Command $cmd -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        Write-Host "[MISSING] $label is required but not found." -ForegroundColor Red
        return $false
    }
}

$allGood = $true
if (-not (Test-Prerequisite "node" "Node.js")) { $allGood = $false }
if (-not (Test-Prerequisite "python" "Python")) { $allGood = $false }

if (-not $allGood) {
    Write-Host "`nInstall missing prerequisites and re-run this script." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Node.js $(node --version)" -ForegroundColor Green
Write-Host "[OK] Python  $(python --version)" -ForegroundColor Green

# Check for PostgreSQL
try {
    Get-Command "psql" -ErrorAction Stop | Out-Null
    Write-Host "[OK] PostgreSQL $(psql --version)" -ForegroundColor Green
}
catch {
    Write-Host "[WARN] PostgreSQL CLI not found. Use Docker: docker compose -f docker-compose.dev.yml up -d" -ForegroundColor Yellow
}

# Backend setup
Write-Host "`n--- Backend Setup ---" -ForegroundColor Yellow
Push-Location backend

if (-not (Test-Path ".venv")) {
    Write-Host "Creating Python virtual environment..."
    python -m venv .venv
}

Write-Host "Activating virtual environment..."
& .venv\Scripts\Activate.ps1

Write-Host "Installing dependencies..."
pip install -q -r requirements-dev.txt

if (-not (Test-Path ".env")) {
    Write-Host "Copying .env.example to .env..."
    Copy-Item .env.example .env
}

Pop-Location

# Frontend setup
Write-Host "`n--- Frontend Setup ---" -ForegroundColor Yellow
Push-Location frontend

Write-Host "Installing npm dependencies..."
npm ci --silent

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "Copying .env.example to .env..."
        Copy-Item .env.example .env
    }
}

Pop-Location

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start PostgreSQL:"
Write-Host "     docker compose -f docker-compose.dev.yml up -d" -ForegroundColor White
Write-Host "  2. Start backend:"
Write-Host "     cd backend && .venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload" -ForegroundColor White
Write-Host "  3. Start frontend:"
Write-Host "     cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
