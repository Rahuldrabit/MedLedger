# Fabric CA Enrollment Script for Windows
# Enrolls admin and user identities for all organizations

param(
    [string]$Action = "all"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Fabric CA Enrollment Script ===" -ForegroundColor Green

# Configuration
$FABRIC_CA_CLIENT_HOME = "$PWD\ca-client"
$env:PATH = "$PWD\..\bin;$env:PATH"

# Create CA client directory
New-Item -ItemType Directory -Force -Path $FABRIC_CA_CLIENT_HOME | Out-Null

# Function to enroll admin
function Enroll-Admin {
    param(
        [string]$Org,
        [string]$CAPort,
        [string]$CAName
    )
    
    Write-Host "Enrolling admin for $Org..." -ForegroundColor Yellow
    
    $env:FABRIC_CA_CLIENT_HOME = "$PWD\ca-client\$Org"
    
    $certPath = "$PWD\crypto-config\peerOrganizations\$($Org.ToLower()).ehr.com\ca\ca.$($Org.ToLower()).ehr.com-cert.pem"
    
    fabric-ca-client enroll `
        -u "https://admin:adminpw@localhost:$CAPort" `
        --caname $CAName `
        --tls.certfiles $certPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Admin enrolled for $Org" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Failed to enroll admin for $Org" -ForegroundColor Red
        throw "Enrollment failed"
    }
}

# Function to register and enroll user
function Register-User {
    param(
        [string]$Org,
        [string]$UserID,
        [string]$UserType,
        [string]$CAPort,
        [string]$CAName
    )
    
    Write-Host "Registering $UserID for $Org..." -ForegroundColor Yellow
    
    $env:FABRIC_CA_CLIENT_HOME = "$PWD\ca-client\$Org"
    $certPath = "$PWD\crypto-config\peerOrganizations\$($Org.ToLower()).ehr.com\ca\ca.$($Org.ToLower()).ehr.com-cert.pem"
    
    # Register user
    fabric-ca-client register `
        --caname $CAName `
        --id.name $UserID `
        --id.secret "${UserID}pw" `
        --id.type $UserType `
        --tls.certfiles $certPath
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to register $UserID" -ForegroundColor Red
        throw "Registration failed"
    }
    
    # Enroll user
    fabric-ca-client enroll `
        -u "https://${UserID}:${UserID}pw@localhost:$CAPort" `
        --caname $CAName `
        -M "$PWD\ca-client\$Org\$UserID\msp" `
        --tls.certfiles $certPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $UserID enrolled" -ForegroundColor Green
    }
    else {
        Write-Host "✗ Failed to enroll $UserID" -ForegroundColor Red
        throw "Enrollment failed"
    }
    
    # Copy credentials to wallet
    $walletPath = "$PWD\..\backend\wallet\$UserID"
    New-Item -ItemType Directory -Force -Path $walletPath | Out-Null
    
    $certFile = Get-ChildItem "$PWD\ca-client\$Org\$UserID\msp\signcerts\*.pem" | Select-Object -First 1
    $keyFile = Get-ChildItem "$PWD\ca-client\$Org\$UserID\msp\keystore\*" | Select-Object -First 1
    
    Copy-Item $certFile.FullName "$walletPath\cert.pem"
    Copy-Item $keyFile.FullName "$walletPath\key.pem"
    
    # Create identity JSON
    $cert = Get-Content $certFile.FullName -Raw
    $key = Get-Content $keyFile.FullName -Raw
    
    $identity = @{
        credentials = @{
            certificate = $cert
            privateKey  = $key
        }
        mspId       = "${Org}MSP"
        type        = "X.509"
    } | ConvertTo-Json -Depth 10
    
    $identity | Out-File -FilePath "$walletPath\identity.json" -Encoding UTF8
    
    Write-Host "✓ Credentials copied to backend wallet" -ForegroundColor Green
}

# Main enrollment process
try {
    Write-Host ""
    Write-Host "=== Enrolling Organization Admins ===" -ForegroundColor Cyan
    
    # Hospital Organization
    Enroll-Admin -Org "Hospital" -CAPort "7054" -CAName "ca-hospital"
    
    # Patient Organization
    Enroll-Admin -Org "Patient" -CAPort "8054" -CAName "ca-patient"
    
    # Orderer Organization
    Enroll-Admin -Org "Orderer" -CAPort "9054" -CAName "ca-orderer"
    
    Write-Host ""
    Write-Host "=== Registering and Enrolling Users ===" -ForegroundColor Cyan
    
    # Register sample patients
    Register-User -Org "Patient" -UserID "patient123" -UserType "client" -CAPort "8054" -CAName "ca-patient"
    Register-User -Org "Patient" -UserID "patient456" -UserType "client" -CAPort "8054" -CAName "ca-patient"
    
    # Register sample doctors
    Register-User -Org "Hospital" -UserID "doctor123" -UserType "client" -CAPort "7054" -CAName "ca-hospital"
    Register-User -Org "Hospital" -UserID "doctor456" -UserType "client" -CAPort "7054" -CAName "ca-hospital"
    
    # Register admin user
    Register-User -Org "Hospital" -UserID "admin789" -UserType "admin" -CAPort "7054" -CAName "ca-hospital"
    
    Write-Host ""
    Write-Host "=== Enrollment Complete ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Created identities in backend\wallet:" -ForegroundColor Cyan
    Get-ChildItem "$PWD\..\backend\wallet" -Directory | ForEach-Object { Write-Host "  - $($_.Name)" }
    
    Write-Host ""
    Write-Host "✓ All enrollments successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Identities are ready in backend\wallet\"
    Write-Host "  2. Start the backend API: cd backend && npm start"
    Write-Host "  3. Login with enrolled user IDs"
    
}
catch {
    Write-Host ""
    Write-Host "✗ Enrollment failed: $_" -ForegroundColor Red
    exit 1
}
