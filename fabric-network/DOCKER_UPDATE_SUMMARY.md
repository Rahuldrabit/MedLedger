# Updated Fabric Network Scripts - Docker-Based

## Changes Made

### 1. network.ps1 (PowerShell Script)

**New Docker-based functions added:**

- `Generate-Certificates-Docker`: Uses `hyperledger/fabric-tools:2.5` Docker image to run:
  - `cryptogen generate` - Generate crypto material
  - `configtxgen` - Generate genesis block and channel artifacts
  
- `Create-Channel-Docker`: Uses CLI container to create channels

- `Deploy-Chaincode-Docker`: Uses CLI container for chaincode deployment

**Updated commands:**
- `.\network.ps1 generateCerts` - Now uses Docker (no local binaries needed)
- `.\network.ps1 createChannel` - Uses Docker CLI container
- `.\network.ps1 deployCC` - Uses Docker CLI container

### 2. network.sh (Bash Script)

**Updated functions:**

- `generateCerts()`: Now uses Docker command:
  ```bash
  docker run --rm -v "${PWD}:/work" -w /work hyperledger/fabric-tools:2.5 \
    cryptogen generate --config=./crypto-config.yaml --output=./crypto-config
  ```

- `generateChannelArtifacts()`: Uses Docker for `configtxgen` commands

## Usage (No Binaries Required)

### PowerShell (Windows)
```powershell
cd E:\BlockChainProject\fabric-network

# Generate certificates and channel artifacts
.\network.ps1 generateCerts

# Start the network
.\network.ps1 up

# Create channel
.\network.ps1 createChannel

# Deploy chaincode
.\network.ps1 deployCC
```

### Bash (Linux/WSL)
```bash
cd /e/BlockChainProject/fabric-network

# Generate certificates
./network.sh generateCerts

# Start network
./network.sh up

# Create channel
./network.sh createChannel
```

## Prerequisites

Only Docker is required now:
- Docker Desktop (Windows) or Docker (Linux)
- No need to install Hyperledger Fabric binaries
- No need to add tools to PATH

## Docker Images Used

- `hyperledger/fabric-tools:2.5` - Contains cryptogen, configtxgen, peer CLI
- Your existing network containers defined in docker-compose files

## Benefits

1. **No binary installation** - Works out of the box with just Docker
2. **Consistent environment** - Same tools version across all systems
3. **Easy setup** - No PATH configuration needed
4. **Version control** - Docker image tag controls tool versions