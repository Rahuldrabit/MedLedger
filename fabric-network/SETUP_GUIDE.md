# Fabric Network Setup Guide

## Prerequisites Installation

### 1. Install Docker Desktop for Windows

1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Install and restart your computer
3. Verify installation:
   ```powershell
   docker --version
   docker-compose --version
   ```

### 2. Install Go (for chaincode development)

1. Download from: https://go.dev/dl/
2. Install and verify:
   ```powershell
   go version
   ```

**Important**: You do NOT need to install Hyperledger Fabric binaries. All tools (cryptogen, configtxgen, peer, orderer) run inside Docker containers.

## Network Setup Steps

### Step 1: Start Network (Single Command)

From the `fabric-network` directory:

```powershell
# Windows PowerShell
cd e:\BlockChainProject\fabric-network

# Start everything
.\network.ps1 up
```

This command automatically:
1. Generates cryptographic material using Docker
2. Creates channel genesis block
3. Starts CouchDB containers
4. Starts orderer and peer nodes
5. Creates channel "ehr-channel"
6. Joins all peers to the channel

### Step 2: Verify Network Status

```powershell
# Check containers
docker ps

# Should see 10 containers:
# - orderer.ehr.com
# - peer0.hospital.ehr.com, peer1.hospital.ehr.com
# - peer0.patient.ehr.com, peer1.patient.ehr.com
# - couchdb0.hospital, couchdb1.hospital
# - couchdb0.patient, couchdb1.patient
# - cli

# Verify channel
docker exec cli peer channel list
# Output: ehr-channel

# Check channel info
docker exec cli peer channel getinfo -c ehr-channel
```

### Step 4: Verify Network

```powershell
# Check running containers
docker ps

# You should see:
# - orderer.ehr.com
# - peer0.hospital.ehr.com
# - peer1.hospital.ehr.com
# - peer0.patient.ehr.com
# - peer1.patient.ehr.com
# - couchdb0.hospital
# - couchdb1.hospital
# - couchdb0.patient
# - couchdb1.patient
# - cli
```

### Step 5: Create Channel

```powershell
# Enter CLI container
docker exec -it cli bash

# Inside container:
cd /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts
./createChannel.sh ehr-channel
```

Or manually:

```bash
# Set environment for Hospital Org
export CORE_PEER_LOCALMSPID="HospitalMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/hospital.ehr.com/peers/peer0.hospital.ehr.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/hospital.ehr.com/users/Admin@hospital.ehr.com/msp
export CORE_PEER_ADDRESS=peer0.hospital.ehr.com:7051

# Create channel
peer channel create -o orderer.ehr.com:7050 -c ehr-channel -f /opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts/ehr-channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/orderer.ehr.com/orderers/orderer.orderer.ehr.com/msp/tlscacerts/tlsca.orderer.ehr.com-cert.pem
```

### Step 6: Join Peers to Channel

```bash
# Still in CLI container

# Join Hospital peer0
peer channel join -b ehr-channel.block

# Join Hospital peer1 (change CORE_PEER_ADDRESS)
export CORE_PEER_ADDRESS=peer1.hospital.ehr.com:8051
peer channel join -b ehr-channel.block

# Join Patient peer0
export CORE_PEER_LOCALMSPID="PatientMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.ehr.com/peers/peer0.patient.ehr.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.ehr.com/users/Admin@patient.ehr.com/msp
export CORE_PEER_ADDRESS=peer0.patient.ehr.com:9051
peer channel join -b ehr-channel.block

# Join Patient peer1
export CORE_PEER_ADDRESS=peer1.patient.ehr.com:10051
peer channel join -b ehr-channel.block
```

## Troubleshooting

### Issue: Docker daemon not running

**Solution**:
- Start Docker Desktop
- Wait for it to fully initialize
- Check Docker icon in system tray

### Issue: Port already in use

**Solution**:
```powershell
# Find process using the port (e.g., 7051)
netstat -ano | findstr :7051

# Kill the process
taskkill /PID <PID> /F
```

### Issue: Cryptogen or configtxgen not found

**Solution**:
- Download Fabric binaries
- Add bin directory to system PATH
- Or use full path to executables

### Issue: Permission denied on volumes

**Solution**:
- Enable file sharing in Docker Desktop settings
- Add `E:\BlockChainProject` to shared drives

## Network Management

```powershell
# Stop network
.\network.ps1 down

# Restart network
.\network.ps1 restart

# Clean everything
.\network.ps1 clean

# View logs
docker logs -f peer0.hospital.ehr.com
docker logs -f orderer.ehr.com
```

## Accessing CouchDB UI

CouchDB provides a web interface (Fauxton):

- Hospital Peer0: http://localhost:5984/_utils
- Hospital Peer1: http://localhost:6984/_utils
- Patient Peer0: http://localhost:7984/_utils
- Patient Peer1: http://localhost:8984/_utils

Login: admin / adminpw

## Next Steps

Once the network is running:

1. **Develop Chaincode** - Implement Go smart contracts in `../chaincode/ehr/`
2. **Deploy Chaincode** - Use `deployCC.sh` script
3. **Build Backend API** - Create Node.js/Python API to interact with network
4. **Create Frontend** - Build React dashboards

## Useful Commands

```bash
# Check channel list
peer channel list

# Query installed chaincode
peer lifecycle chaincode queryinstalled

# Query committed chaincode
peer lifecycle chaincode querycommitted -C ehr-channel
```
