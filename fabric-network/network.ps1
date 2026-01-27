# Hyperledger Fabric Network - Windows PowerShell Version
# Network Management Script for EHR Blockchain

param(
    [Parameter(Position=0)]
    [string]$Mode = "",
    
    [string]$ChannelName = "ehr-channel",
    [string]$Database = "couchdb",
    [switch]$Verbose,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Print-Help {
    Write-Host @"
Usage: 
  .\network.ps1 <Mode> [Flags]
    Modes:
      up - Bring up the network
      down - Tear down the network
      restart - Restart the network
      generateCerts - Generate certificates (requires Fabric binaries)
      createChannel - Create application channel
      deployCC - Deploy chaincode
      clean - Remove all artifacts and containers
      
    Flags:
    -ChannelName <name> - Channel name (default: ehr-channel)
    -Database <type> - State database: goleveldb or couchdb (default: couchdb)
    -Verbose - Enable verbose logging
    -Help - Print this message
    
Examples:
  .\network.ps1 up
  .\network.ps1 down
  .\network.ps1 clean
"@
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Network-Up {
    Write-Info "Starting EHR Blockchain Network..."
    
    # Check if crypto-config exists
    if (-not (Test-Path "crypto-config")) {
        Write-Warning-Custom "Crypto material not found."
        Write-Info "Please install Hyperledger Fabric binaries and run: cryptogen generate --config=crypto-config.yaml"
        Write-Info "Or use the test-network from Fabric samples to generate certificates."
        Write-Warning-Custom "For now, starting network without certificates (will fail)..."
    }
    
    # Start CouchDB if needed
    if ($Database -eq "couchdb") {
        Write-Info "Starting CouchDB containers..."
        docker-compose -f docker-compose-couch.yaml up -d
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Failed to start CouchDB"
            exit 1
        }
        Start-Sleep -Seconds 5
    }
    
    # Start the network
    Write-Info "Starting network containers..."
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to start network"
        exit 1
    }
    
    Write-Host ""
    Write-Success "Network started successfully!"
    Write-Host ""
    docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
}

function Network-Down {
    Write-Info "Stopping network..."
    docker-compose down --volumes --remove-orphans
    docker-compose -f docker-compose-couch.yaml down --volumes --remove-orphans
    
    # Remove chaincode containers
    docker ps -a | Select-String "dev-peer" | ForEach-Object {
        $containerId = ($_ -split '\s+')[0]
        docker rm -f $containerId
    }
    
    docker images | Select-String "dev-peer" | ForEach-Object {
        $imageId = ($_ -split '\s+')[2]
        docker rmi -f $imageId
    }
    
    Write-Success "Network stopped"
}

function Clean-All {
    Network-Down
    Write-Info "Removing artifacts..."
    Remove-Item -Recurse -Force crypto-config -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force channel-artifacts -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force wallet -ErrorAction SilentlyContinue
    Write-Success "Cleanup complete"
}

# Main execution
if ($Help) {
    Print-Help
    exit 0
}

switch ($Mode.ToLower()) {
    "up" {
        Network-Up
    }
    "down" {
        Network-Down
    }
    "restart" {
        Network-Down
        Network-Up
    }
    "clean" {
        Clean-All
    }
    "generatecerts" {
        Write-Warning-Custom "Certificate generation requires Hyperledger Fabric binaries."
        Write-Info "Please download Fabric binaries from:"
        Write-Info "https://hyperledger-fabric.readthedocs.io/en/release-2.5/install.html"
        Write-Info ""
        Write-Info "Then run:"
        Write-Info "  cryptogen generate --config=crypto-config.yaml --output=crypto-config"
        Write-Info "  configtxgen -profile EHROrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block"
        Write-Info "  configtxgen -profile EHRChannel -outputCreateChannelTx ./channel-artifacts/$ChannelName.tx -channelID $ChannelName"
    }
    "createchannel" {
        Write-Warning-Custom "Channel creation requires peer CLI tool from Fabric binaries."
        Write-Info "Please use the CLI container or install peer binary."
    }
    "deploycc" {
        Write-Warning-Custom "Chaincode deployment requires peer CLI tool."
        Write-Info "Use: docker exec -it cli bash"
        Write-Info "Then run the deployment commands inside the container."
    }
    default {
        if ($Mode -eq "") {
            Write-Error-Custom "Please specify a mode"
        } else {
            Write-Error-Custom "Unknown mode: $Mode"
        }
        Print-Help
        exit 1
    }
}
