# Hyperledger Fabric Network - Windows PowerShell Version
# Network Management Script for EHR Blockchain

param(
    [Parameter(Position=0)]
    [string]$Mode = "",
    
    [string]$ChannelName = "ehr-channel",
    [string]$Database = "couchdb",
    [switch]$VerboseLogging,
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
      generateCerts - Generate certificates using Docker
      createChannel - Create application channel
      deployCC - Deploy chaincode
      clean - Remove all artifacts and containers
      
    Flags:
    -ChannelName <name> - Channel name (default: ehr-channel)
    -Database <type> - State database: goleveldb or couchdb (default: couchdb)
    -VerboseLogging - Enable verbose logging
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

function Generate-Certificates-Docker {
    Write-Info "Generating crypto material using Docker..."
    
    # Generate crypto material and create directories
    docker run --rm -v "${PWD}:/work" -w /work hyperledger/fabric-tools:2.5 `
        sh -c "rm -rf crypto-config channel-artifacts && mkdir -p channel-artifacts && cryptogen generate --config=./crypto-config.yaml --output=./crypto-config"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to generate crypto material"
        exit 1
    }
    
    # Generate genesis block
    docker run --rm -v "${PWD}:/work" -w /work -e FABRIC_CFG_PATH=/work hyperledger/fabric-tools:2.5 `
        configtxgen -profile EHROrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to generate genesis block"
        exit 1
    }
    
    # Generate channel transaction
    docker run --rm -v "${PWD}:/work" -w /work -e FABRIC_CFG_PATH=/work hyperledger/fabric-tools:2.5 `
        configtxgen -profile EHRChannel -outputCreateChannelTx ./channel-artifacts/$ChannelName.tx -channelID $ChannelName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to generate channel transaction"
        exit 1
    }
    
    # Generate anchor peer updates
    docker run --rm -v "${PWD}:/work" -w /work -e FABRIC_CFG_PATH=/work hyperledger/fabric-tools:2.5 `
        configtxgen -profile EHRChannel -outputAnchorPeersUpdate ./channel-artifacts/HospitalMSPanchors.tx -channelID $ChannelName -asOrg HospitalMSP
    
    docker run --rm -v "${PWD}:/work" -w /work -e FABRIC_CFG_PATH=/work hyperledger/fabric-tools:2.5 `
        configtxgen -profile EHRChannel -outputAnchorPeersUpdate ./channel-artifacts/PatientMSPanchors.tx -channelID $ChannelName -asOrg PatientMSP
    
    Write-Success "Crypto material and channel artifacts generated successfully!"
}

function Create-Channel-Docker {
    Write-Info "Creating channel '$ChannelName' using Docker..."
    
    # Wait for network to be ready
    Write-Info "Waiting for network to be ready..."
    Start-Sleep -Seconds 10
    
    # Join orderer to channel using Channel Participation API (osnadmin)
    docker exec cli osnadmin channel join --channelID $ChannelName --config-block /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/$ChannelName.block -o orderer.ehr.com:17050 --ca-file /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ehr.com/orderers/orderer.ehr.com/msp/tlscacerts/tlsca.ehr.com-cert.pem --client-cert /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ehr.com/orderers/orderer.ehr.com/tls/server.crt --client-key /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ehr.com/orderers/orderer.ehr.com/tls/server.key
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to join orderer to channel"
        exit 1
    }
    
    Write-Success "Channel '$ChannelName' created successfully!"
}

function Deploy-Chaincode-Docker {
    param([string]$ChaincodeName = "ehr", [string]$ChaincodePath = "../chaincode/ehr")
    
    Write-Info "Deploying chaincode '$ChaincodeName' using Docker..."
    
    # Package chaincode
    docker exec cli peer lifecycle chaincode package $ChaincodeName.tar.gz `
        --path /opt/gopath/src/github.com/hyperledger/fabric/peer/$ChaincodePath `
        --lang golang --label ${ChaincodeName}_1.0
    
    # Install on Hospital peers
    docker exec -e CORE_PEER_ADDRESS=peer0.hospital.ehr.com:7051 `
        -e CORE_PEER_LOCALMSPID=HospitalMSP cli `
        peer lifecycle chaincode install $ChaincodeName.tar.gz
    
    docker exec -e CORE_PEER_ADDRESS=peer1.hospital.ehr.com:8051 `
        -e CORE_PEER_LOCALMSPID=HospitalMSP cli `
        peer lifecycle chaincode install $ChaincodeName.tar.gz
    
    # Install on Patient peers
    docker exec -e CORE_PEER_ADDRESS=peer0.patient.ehr.com:9051 `
        -e CORE_PEER_LOCALMSPID=PatientMSP cli `
        peer lifecycle chaincode install $ChaincodeName.tar.gz
    
    docker exec -e CORE_PEER_ADDRESS=peer1.patient.ehr.com:10051 `
        -e CORE_PEER_LOCALMSPID=PatientMSP cli `
        peer lifecycle chaincode install $ChaincodeName.tar.gz
    
    Write-Success "Chaincode '$ChaincodeName' deployed successfully!"
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Network-Up {
    Write-Info "Starting EHR Blockchain Network..."
    
    # Check if crypto-config exists
    if (-not (Test-Path "crypto-config")) {
        Write-Warning-Custom "Crypto material not found."
        Write-Info "Generating certificates using Docker..."
        Generate-Certificates-Docker
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
        Generate-Certificates-Docker
    }
    "createchannel" {
        Create-Channel-Docker
    }
    "deploycc" {
        Deploy-Chaincode-Docker
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
