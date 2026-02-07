# Blockchain EHR System - Complete Setup Guide

This guide walks you through deploying the entire blockchain-based Electronic Health Record system from scratch.

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Frontend (React)                         │
│              http://localhost:3001                            │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API
┌────────────────────────┴─────────────────────────────────────┐
│                   Backend API (Node.js)                       │
│              http://localhost:3000                            │
└─────────┬──────────────────────────────┬─────────────────────┘
          │                              │
┌─────────▼────────────┐    ┌────────────▼──────────────┐
│  Fabric Network      │    │     IPFS Storage          │
│  (Blockchain)        │    │  http://localhost:5001    │
│  - 3 Organizations   │    │  - Encrypted Files        │
│  - 4 Peer Nodes      │    │  - Content Addressing     │
│  - CouchDB           │    └───────────────────────────┘
└──────────────────────┘
```

## Prerequisites

## Prerequisites

### Required Software

1. **Docker Desktop** (20.10+)
   - Download: https://www.docker.com/products/docker-desktop
   - Ensure WSL 2 backend is enabled (Windows)
   - **Important**: No Hyperledger Fabric binaries needed - all tools run in Docker

2. **Node.js** (16.x or 18.x)
   - Download: https://nodejs.org/

3. **Go** (1.20+)
   - Download: https://go.dev/dl/
   - Required for chaincode development

4. **Python** (3.9+, tested with 3.14)
   - Download: https://www.python.org/downloads/

5. **Poetry** (Python dependency manager)
   ```powershell
   (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
   ```

### System Requirements

- **RAM**: 8GB minimum, 16GB recommended
- **Disk Space**: 20GB free space
- **OS**: Windows 10/11, macOS, or Linux

## Step-by-Step Deployment

### Phase 1: Infrastructure Setup

#### 1.1 Clone and Setup Project

```powershell
cd e:\BlockChainProject

# Verify structure
tree /F
```

#### 1.2 Install Python Dependencies

```powershell
# Install Poetry dependencies
poetry install

# Activate virtual environment
poetry shell

# Verify installation
python -c "import ehr_system; print('OK')"
```

#### 1.3 Start IPFS Node

```powershell
cd ipfs

# Start IPFS
.\ipfs.ps1 start

# Verify
.\ipfs.ps1 status

# Should show: Running on http://127.0.0.1:5001
```

### Phase 2: Blockchain Network

### Phase 2: Blockchain Network Setup

#### 2.1 Start Network and Generate Certificates

```powershell
cd ..\fabric-network

# Windows PowerShell - Start network (auto-generates certificates)
.\network.ps1 up

# This will:
# 1. Generate certificates using Docker (cryptogen in container)
# 2. Create channel genesis block
# 3. Start CouchDB containers
# 4. Start orderer and peer nodes
# 5. Start CLI container

# Verify containers running
docker ps

# Should see 10 containers:
# - orderer.ehr.com
# - peer0/peer1.hospital.ehr.com
# - peer0/peer1.patient.ehr.com
# - couchdb0/couchdb1.hospital
# - couchdb0/couchdb1.patient
# - cli
```

#### 2.2 Create Channel and Join Peers

```powershell
# Channel is auto-created during network startup
# Verify channel status
docker exec cli peer channel list

# Should show: ehr-channel

# Check all peers joined
docker exec cli peer channel getinfo -c ehr-channel
```

### Phase 3: Chaincode Deployment (CCAAS Method)

**Note**: We use Chaincode-as-a-Service (CCAAS) approach for better local development experience.

#### 3.1 Build Chaincode Docker Image

```powershell
cd ..\chaincode\ehr

# Verify Go dependencies
go mod tidy
go mod vendor

# Build Docker image
docker build -t ehr-chaincode:1.0 .

# Verify image created
docker images | Select-String "ehr-chaincode"
```

#### 3.2 Package Chaincode for CCAAS

```powershell
# Create connection.json
@'
{
  "address": "ehr-chaincode:7052",
  "dial_timeout": "10s",
  "tls_required": false
}
'@ | Out-File -FilePath connection.json -Encoding ASCII

# Create metadata.json
'{"path":"","type":"ccaas","label":"ehr_1.0"}' | Out-File -FilePath metadata.json -Encoding ASCII

# Package
tar czf code.tar.gz connection.json
tar czf ehr-ccaas.tgz code.tar.gz metadata.json

# Copy to CLI container
docker cp ehr-ccaas.tgz cli:/opt/gopath/src/github.com/hyperledger/fabric/peer/
```

#### 3.3 Install Chaincode on All Peers

```powershell
cd ..\..\fabric-network

# Install on peer0.hospital
docker exec cli peer lifecycle chaincode install ehr-ccaas.tgz

# Install on peer1.hospital
docker exec -e CORE_PEER_ADDRESS=peer1.hospital.ehr.com:8051 cli peer lifecycle chaincode install ehr-ccaas.tgz

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

# Note the Package ID from output (e.g., ehr_1.0:500cb1d82e3b90c276638ccc81a03129c2478b8a95a7529956f9a210a8036db6)
```

#### 3.4 Start Chaincode Container

```powershell
# Replace PACKAGE_ID with actual ID from previous step
$PACKAGE_ID = "ehr_1.0:500cb1d82e3b90c276638ccc81a03129c2478b8a95a7529956f9a210a8036db6"

docker run --rm -d --name ehr-chaincode `
  --hostname ehr-chaincode `
  --network ehr-network `
  -e CHAINCODE_SERVER_ADDRESS=0.0.0.0:7052 `
  -e CHAINCODE_ID=$PACKAGE_ID `
  -e CORE_CHAINCODE_ID_NAME=$PACKAGE_ID `
  ehr-chaincode:1.0
```

#### 3.5 Approve and Commit Chaincode

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

# Check commit readiness
docker exec cli peer lifecycle chaincode checkcommitreadiness `
  --channelID ehr-channel `
  --name ehr `
  --version 1.0 `
  --sequence 1 `
  --tls `
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/ehr.com/orderers/orderer.ehr.com/tls/ca.crt `
  --output json

# Commit chaincode definition
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
```

#### 3.6 Test Chaincode

```powershell
# Initialize chaincode
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

# Query caller ID
docker exec cli peer chaincode query -C ehr-channel -n ehr -c '{\"function\":\"GetCallerID\",\"Args\":[]}'

# Expected: Base64 encoded certificate DN
```

### Phase 4: Backend API

#### 4.1 Install Dependencies

```powershell
cd ..\..\backend

# Install Node packages
npm install
```

#### 4.2 Configure Environment

```powershell
# Copy environment template
cp .env.example .env

# Edit .env
notepad .env
```

Update these values:
```env
JWT_SECRET=your-super-secret-production-key-here
WALLET_PATH=./wallet
```

#### 4.3 Create Admin Identity

```powershell
# Create wallet directory
mkdir wallet

# TODO: Enroll admin user with Fabric CA
# For demo, you can skip this and use mock auth
```

#### 4.4 Start Backend

```powershell
# Development mode
npm run dev

# Production mode
npm start
```

Backend should start on: http://localhost:3000

Test health check:
```powershell
curl http://localhost:3000/health
```

### Phase 5: Frontend

#### 5.1 Install Dependencies

```powershell
cd ..\frontend

npm install
```

#### 5.2 Configure Environment

```powershell
# .env is already configured
cat .env
```

Should show:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

#### 5.3 Start Frontend

```powershell
npm start
```

Browser should open: http://localhost:3001

## Testing the System

### 1. Login as Patient

1. Navigate to http://localhost:3001
2. Click "Login"
3. Use credentials:
   - User ID: `patient123`
   - Password: `password`
4. You should see patient dashboard

### 2. Upload EHR

1. Click "Upload EHR" in sidebar
2. Drag and drop a PDF/image file
3. Enter record type: "Lab Report"
4. Click "Upload & Encrypt"
5. File is encrypted and stored on IPFS
6. Metadata stored on blockchain

### 3. Grant Consent

1. Click "Consents" in sidebar
2. Click "Grant Access"
3. Enter doctor ID: `doctor456`
4. Select expiry: 30 days
5. Click "Grant Consent"

### 4. Login as Doctor

1. Logout from patient account
2. Login with:
   - User ID: `doctor456`
   - Password: `password`
3. You should see doctor dashboard

### 5. Access Patient Record

1. Click "Patients" in sidebar
2. Find patient: `patient123`
3. Click "View Records"
4. See shared records
5. Click "Download" to get encrypted file

### 6. Login as Admin

1. Logout from doctor account
2. Login with:
   - User ID: `admin789`
   - Password: `password`
3. View system statistics
4. Browse audit logs
5. See all blockchain transactions

## Troubleshooting

### Docker Issues

**Problem**: Containers won't start
```powershell
# Check Docker is running
docker version

# Remove all containers and restart
.\network.ps1 clean
.\network.ps1 up
```

### Fabric Network Issues

**Problem**: Peer won't join channel
```bash
# Check peer logs
docker logs peer0.hospital.ehr.com

# Recreate channel
docker exec cli peer channel create -o orderer.ehr.com:7050 -c ehr-channel -f ./channel-artifacts/ehr-channel.tx
```

### Chaincode Issues

**Problem**: Chaincode not found
```bash
# Check installed chaincode
docker exec cli peer lifecycle chaincode queryinstalled

# Reinstall
./scripts/deployCC.sh ehr-contract 1.1 ehr-channel
```

### Backend API Issues

**Problem**: Cannot connect to Fabric
- Ensure `connection-profile.json` paths are correct
- Check peer endpoints in `.env`
- Verify containers are running: `docker ps`

**Problem**: IPFS connection failed
```powershell
cd ipfs
.\ipfs.ps1 restart
```

### Frontend Issues

**Problem**: API calls fail with CORS error
- Ensure backend is running on port 3000
- Check `CORS_ORIGIN` in backend `.env`

**Problem**: Proxy errors
- Check `proxy` in frontend `package.json`
- Restart both frontend and backend

## Production Deployment

### Security Checklist

- [ ] Change all default passwords and secrets
- [ ] Use proper Fabric CA for certificate management
- [ ] Enable TLS for all Fabric components
- [ ] Set up HTTPS for backend API (use reverse proxy)
- [ ] Implement rate limiting
- [ ] Set up firewall rules
- [ ] Regular security audits
- [ ] Encrypt database backups
- [ ] Use environment-specific configs

### Scaling Considerations

1. **Add More Peers**
   - Update `docker-compose.yaml`
   - Generate new certificates
   - Join peers to channel

2. **Load Balancing**
   - Use nginx for backend API
   - Multiple backend instances

3. **Database Optimization**
   - CouchDB clustering
   - Regular compaction

4. **Monitoring**
   - Prometheus metrics
   - Grafana dashboards
   - ELK stack for logs

## Backup and Recovery

### Backup Fabric Network

```powershell
# Backup ledger data
docker exec peer0.hospital.ehr.com tar czf /tmp/ledger-backup.tar.gz /var/hyperledger/production

# Copy to host
docker cp peer0.hospital.ehr.com:/tmp/ledger-backup.tar.gz ./backups/

# Backup CouchDB
docker exec couchdb0 curl -X POST http://admin:adminpw@localhost:5984/_replicate -d '{"source":"ehr-channel_ehr-contract","target":"backup_db","create_target":true}'
```

### Backup IPFS

```powershell
cd ipfs
.\ipfs.ps1 backup
```

## Maintenance

### Update Chaincode

```bash
# Increment version
./scripts/deployCC.sh ehr-contract 2.0 ehr-channel
```

### Monitor System Health

```powershell
# Check all containers
docker ps -a

# View logs
docker-compose -f docker-compose.yaml logs -f

# System stats
docker stats
```

### Clean Up

```powershell
# Stop all services
cd fabric-network
.\network.ps1 down

cd ..\ipfs
.\ipfs.ps1 stop

# Remove volumes (WARNING: Deletes all data)
cd ..\fabric-network
.\network.ps1 clean
```

## Next Steps

1. **Phase 2**: Implement Federated Learning
2. **Advanced Features**:
   - Multi-signature approvals
   - Smart contract upgrades
   - Advanced analytics
3. **Compliance**:
   - HIPAA audit reports
   - GDPR compliance tools

## Support

For issues or questions:
1. Check logs: `docker logs <container_name>`
2. Review Fabric documentation
3. Check GitHub issues

## License

MIT License - See LICENSE file for details
