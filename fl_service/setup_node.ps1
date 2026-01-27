# Setup script for a Hospital Node (FL Client) - PowerShell
# Usage: .\setup_node.ps1 -ClientId "hospital1"

param (
    [string]$ClientId = "hospital1"
)

Write-Host "Setting up FL Node: $ClientId"

# 1. Check Python
$pythonVersion = python --version
if ($LASTEXITCODE -ne 0) {
    Write-Error "Python is not installed. Please install Python 3.9+"
    exit 1
}
Write-Host "Found $pythonVersion"

# 2. Create Virtual Environment
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
}

# 3. Install Dependencies
# Note: User must activate venv manually in PS usually, or we call pip via the venv python
Write-Host "Installing ML dependencies..."
.\venv\Scripts\python -m pip install -r ..\requirements-ml.txt

Write-Host "Setup complete for $ClientId"
Write-Host "To start training, run:"
Write-Host ".\venv\Scripts\python client.py --client_id $ClientId"
