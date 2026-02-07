# Docker-Based Deployment Guide

This guide provides the complete, tested deployment steps for the Blockchain EHR System using Docker containers. **No Hyperledger Fabric binaries installation required.**

## Overview

This deployment uses:
- **Docker containers** for all Fabric tools (cryptogen, configtxgen, peer, orderer)
- **Chaincode-as-a-Service (CCAAS)** for easier local development
- **PowerShell scripts** for Windows automation
- **Automated network setup** with single command deployment

## Prerequisites

### Required Software

1. **Docker Desktop** 20.10+
   - Download: https://www.docker.com/products/docker-desktop
   - Enable WSL 2 backend (Windows)
   - Allocate at least 8GB RAM to Docker

2. **Node.js** 16+ or 18+
   - Download: https://nodejs.org/

3. **Go** 1.20+
   - Download: https://go.dev/dl/
   - Required for chaincode development only

4. **Python** 3.9+ (tested with 3.14)
   - Download: https://www.python.org/downloads/

5. **Poetry** 1.8+
   ```powershell
   (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
   ```

### System Resources

- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 20GB free space
- **CPU**: 4 cores recommended

## Step-by-Step Deployment

### Step 1: Python Environment Setup

```powershell
cd E:\BlockChainProject

# Install dependencies
poetry install

# Activate virtual environment
poetry shell

# Verify setup
python verify_setup.py
```

Expected output:
```
✅ All core dependencies installed
✅ Encryption libraries available
✅ API framework ready
✅ Setup verification complete!
```

### Step 2: Start Blockchain Network

```powershell
cd fabric-network

# Start network (one command does everything!)
.\network.ps1 up
```

This command automatically:
1. ✅ Generates certificates using Docker
2. ✅ Creates channel genesis block
3. ✅ Starts CouchDB state databases (4 instances)
4. ✅ Starts orderer node (Raft consensus)
5. ✅ Starts peer nodes (2 per organization)
6. ✅ Creates channel "ehr-channel"
7. ✅ Joins all peers to channel

**Verify network:**
```powershell
# Check containers (should see 10 running)
docker ps

# List channels
docker exec cli peer channel list
# Output: ehr-channel

# Get channel info
docker exec cli peer channel getinfo -c ehr-channel
```

### Step 3: Deploy EHR Chaincode

#### 3.1 Build Chaincode Docker Image

```powershell
cd ..\chaincode\ehr

# Prepare Go dependencies
go mod tidy
go mod vendor

# Build chaincode container image
docker build -t ehr-chaincode:1.0 .

# Verify image
docker images | Select-String "ehr-chaincode"
```

#### 3.2 Package Chaincode (CCAAS Format)

```powershell
# Create connection configuration
@'
{
  "address": "ehr-chaincode:7052",
  "dial_timeout": "10s",
  "tls_required": false
}
'@ | Out-File -FilePath connection.json -Encoding ASCII

# Create metadata
'{"path":"","type":"ccaas","label":"ehr_1.0"}' | Out-File -FilePath metadata.json -Encoding ASCII

# Package for deployment
tar czf code.tar.gz connection.json
tar czf ehr-ccaas.tgz code.tar.gz metadata.json

# Copy to CLI container
docker cp ehr-ccaas.tgz cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/
```

#### 3.3 Install on All Peers

```powershell
# Install on peer0.hospital
docker exec cli peer lifecycle chaincode install ehr-ccaas.tgz

# Install on peer1.hospital
docker exec -e CORE_PEER_ADDRESS=peer1.hospital.ehr.com:8051 `
  cli peer lifecycle chaincode install ehr-ccaas.tgz

# Install on peer0.patient
docker exec -e CORE_PEER_ADDRESS=peer0.patient.ehr.com:9051 `
  -e CORE_PEER_LOCALMSPID=PatientMSP `
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.ehr.com/tlsca/tlsca.patient.ehr.com-cert.pem `
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.ehr.com/users/Admin@patient.ehr.com/msp `
  cli peer lifecycle chaincode install ehr-ccaas.tgz

# Install on peer1.patient
docker exec -e CORE_PEER_ADDRESS=peer1.patient.ehr.com:10051 `
  -e CORE_PEER_LOCALMSPID=PatientMSP `
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.ehr.com/tlsca/tlsca.patient.ehr.com-cert.pem `
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.ehr.com/users/Admin@patient.ehr.com/msp `
  cli peer lifecycle chaincode install ehr-ccaas.tgz
```

**Important**: Note the Package ID from the output, e.g.:
```
Chaincode code package identifier: ehr_1.0:500cb1d82e3b90c276638ccc81a03129c2478b8a95a7529956f9a210a8036db6
```

#### 3.4 Start Chaincode Container

```powershell
# Replace with your actual Package ID
$PACKAGE_ID = "ehr_1.0:500cb1d82e3b90c276638ccc81a03129c2478b8a95a7529956f9a210a8036db6"

docker run --rm -d --name ehr-chaincode `
  --hostname ehr-chaincode `
  --network ehr-network `
  -e CHAINCODE_SERVER_ADDRESS=0.0.0.0:7052 `
  -e CHAINCODE_ID=$PACKAGE_ID `
  -e CORE_CHAINCODE_ID_NAME=$PACKAGE_ID `
  ehr-chaincode:1.0

# Verify running
docker ps | Select-String "ehr-chaincode"
```

#### 3.5 Approve Chaincode Definition

```powershell
# Approve for HospitalMSP
docker exec cli peer lifecycle chaincode approveformyorg `
  -o orderer.ehr.com:7050 `
  --channelID ehr-channel `
  --name ehr `
  --version 1.0 `
  --package-id $PACKAGE_ID `
  --sequence 1 `
  --tls `
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ehr.com/orderers/orderer.ehr.com/tls/ca.crt

# Approve for PatientMSP
docker exec -e CORE_PEER_ADDRESS=peer0.patient.ehr.com:9051 `
  -e CORE_PEER_LOCALMSPID=PatientMSP `
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.ehr.com/tlsca/tlsca.patient.ehr.com-cert.pem `
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.ehr.com/users/Admin@patient.ehr.com/msp `
  cli peer lifecycle chaincode approveformyorg `
  -o orderer.ehr.com:7050 `
  --channelID ehr-channel `
  --name ehr `
  --version 1.0 `
  --package-id $PACKAGE_ID `
  --sequence 1 `
  --tls `
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ehr.com/orderers/orderer.ehr.com/tls/ca.crt

# Check readiness
docker exec cli peer lifecycle chaincode checkcommitreadiness `
  --channelID ehr-channel `
  --name ehr `
  --version 1.0 `
  --sequence 1 `
  --tls `
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ehr.com/orderers/orderer.ehr.com/tls/ca.crt `
  --output json
```

Expected output:
```json
{
  "approvals": {
    "HospitalMSP": true,
    "PatientMSP": true
  }
}
```

#### 3.6 Commit Chaincode Definition

```powershell
docker exec cli peer lifecycle chaincode commit `
  -o orderer.ehr.com:7050 `
  --channelID ehr-channel `
  --name ehr `
  --version 1.0 `
  --sequence 1 `
  --tls `
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ehr.com/orderers/orderer.ehr.com/tls/ca.crt `
  --peerAddresses peer0.hospital.ehr.com:7051 `
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/hospital.ehr.com/tlsca/tlsca.hospital.ehr.com-cert.pem `
  --peerAddresses peer0.patient.ehr.com:9051 `
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.ehr.com/tlsca/tlsca.patient.ehr.com-cert.pem

# Verify commitment
docker exec cli peer lifecycle chaincode querycommitted --channelID ehr-channel --name ehr
```

Expected output:
```
Committed chaincode definition for chaincode 'ehr' on channel 'ehr-channel':
Version: 1.0, Sequence: 1, Endorsement Plugin: escc, Validation Plugin: vscc, Approvals: [HospitalMSP: true, PatientMSP: true]
```

### Step 4: Test Chaincode

```powershell
# Initialize ledger
docker exec cli peer chaincode invoke `
  -o orderer.ehr.com:7050 `
  --tls `
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ehr.com/orderers/orderer.ehr.com/tls/ca.crt `
  -C ehr-channel `
  -n ehr `
  --peerAddresses peer0.hospital.ehr.com:7051 `
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/hospital.ehr.com/tlsca/tlsca.hospital.ehr.com-cert.pem `
  --peerAddresses peer0.patient.ehr.com:9051 `
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.ehr.com/tlsca/tlsca.patient.ehr.com-cert.pem `
  -c '{\"function\":\"Init\",\"Args\":[]}'

# Query caller identity
docker exec cli peer chaincode query -C ehr-channel -n ehr -c '{\"function\":\"GetCallerID\",\"Args\":[]}'
```

Expected: Base64-encoded certificate DN

### Step 5: Start Backend API (Optional)

```powershell
cd ..\backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start API server
npm run dev
```

Access API at: http://localhost:3000

### Step 6: Start Frontend (Optional)

```powershell
cd ..\frontend

# Install dependencies
npm install

# Start development server
npm start
```

Access UI at: http://localhost:3001

## Network Management

### View Network Status

```powershell
# List all containers
docker ps

# View logs
docker logs peer0.hospital.ehr.com
docker logs orderer.ehr.com
docker logs ehr-chaincode

# Check channel info
docker exec cli peer channel getinfo -c ehr-channel
```

### Stop Network

```powershell
cd fabric-network
.\network.ps1 down

# Stop chaincode container
docker stop ehr-chaincode
docker rm ehr-chaincode
```

### Clean and Restart

```powershell
# Complete cleanup
.\network.ps1 clean

# Restart from scratch
.\network.ps1 up
```

## Network Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ehr-network (Docker)                  │
│                                                          │
│  ┌──────────────┐         ┌──────────────┐             │
│  │  Orderer     │         │  Chaincode   │             │
│  │ :7050, 17050 │         │  CCAAS:7052  │             │
│  └──────────────┘         └──────────────┘             │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │            HospitalMSP Organization               │  │
│  │  ┌──────────────┐      ┌──────────────┐          │  │
│  │  │ peer0:7051   │      │ peer1:8051   │          │  │
│  │  │ CouchDB:5984 │      │ CouchDB:6984 │          │  │
│  │  └──────────────┘      └──────────────┘          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │             PatientMSP Organization               │  │
│  │  ┌──────────────┐      ┌──────────────┐          │  │
│  │  │ peer0:9051   │      │ peer1:10051  │          │  │
│  │  │ CouchDB:7984 │      │ CouchDB:8984 │          │  │
│  │  └──────────────┘      └──────────────┘          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────┐                                       │
│  │  CLI Tools   │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Issue: Containers not starting

```powershell
# Check Docker daemon
docker info

# Check container logs
docker logs <container-name>

# Restart Docker Desktop
```

### Issue: Port conflicts

```powershell
# Check port usage
netstat -ano | findstr ":7050"
netstat -ano | findstr ":7051"

# Kill process using port
taskkill /PID <PID> /F
```

### Issue: Chaincode installation fails

```powershell
# Rebuild chaincode image
cd chaincode\ehr
docker build --no-cache -t ehr-chaincode:1.0 .

# Restart CLI container
docker restart cli
```

### Issue: TLS errors

The orderer admin endpoint has TLS disabled for local development:
```yaml
ORDERER_ADMIN_TLS_ENABLED=false
```

If you need to re-enable TLS, edit [docker-compose.yaml](fabric-network/docker-compose.yaml).

## Key Configuration Changes

### Docker-Based Tools
All Fabric tools run in Docker containers - no local installation needed:
- `cryptogen` → `docker run hyperledger/fabric-tools:2.5 cryptogen`
- `configtxgen` → `docker run hyperledger/fabric-tools:2.5 configtxgen`
- `peer` → `docker exec cli peer`

### CCAAS Deployment
Using Chaincode-as-a-Service instead of traditional Docker-in-Docker:
- Chaincode runs in its own container
- Better for local development
- Easier debugging and logs

### Orderer Admin API
TLS disabled on admin endpoint (port 17050) for simpler local development:
- Channel creation via `osnadmin` without certificate complexity
- Production deployments should enable TLS

## Next Steps

1. **IPFS Setup**: Start IPFS for encrypted file storage
2. **Backend Integration**: Connect Node.js API to blockchain
3. **Frontend Development**: Build React UI components
4. **Testing**: Write integration tests for chaincode functions

Your blockchain network is ready for development! 🎉
