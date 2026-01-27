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

### Required Software

1. **Docker Desktop** (20.10+)
   - Download: https://www.docker.com/products/docker-desktop
   - Ensure WSL 2 backend is enabled (Windows)

2. **Node.js** (16.x or 18.x)
   - Download: https://nodejs.org/

3. **Go** (1.19+)
   - Download: https://go.dev/dl/

4. **Python** (3.9+)
   - Download: https://www.python.org/downloads/

5. **Poetry** (Python dependency manager)
   ```powershell
   (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | python -
   ```

6. **Hyperledger Fabric Binaries** (2.5.x)
   ```powershell
   # Download to fabric-network/bin/
   # Visit: https://hyperledger-fabric.readthedocs.io/en/latest/install.html
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

#### 2.1 Generate Certificates

```powershell
cd ..\fabric-network

# Generate crypto material
cryptogen generate --config=crypto-config.yaml --output=crypto-config

# Verify certificates created
ls crypto-config\
```

#### 2.2 Generate Genesis Block and Channel Artifacts

```powershell
# Set environment
$env:FABRIC_CFG_PATH = "$PWD"

# Generate genesis block
configtxgen -profile ThreeOrgsOrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block

# Generate channel transaction
configtxgen -profile ThreeOrgsChannel -outputCreateChannelTx ./channel-artifacts/ehr-channel.tx -channelID ehr-channel

# Generate anchor peer updates
configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/HospitalMSPanchors.tx -channelID ehr-channel -asOrg HospitalMSP

configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/PatientMSPanchors.tx -channelID ehr-channel -asOrg PatientMSP
```

#### 2.3 Start Fabric Network

```powershell
# Start network
.\network.ps1 up

# Verify containers running
docker ps

# Should see: orderer, 4 peers, 4 couchdb, 3 CAs, 1 CLI
```

#### 2.4 Create Channel

```powershell
# In Git Bash or WSL
cd /e/BlockChainProject/fabric-network
./scripts/createChannel.sh ehr-channel

# Verify channel created
docker exec cli peer channel list
```

### Phase 3: Chaincode Deployment

#### 3.1 Build Chaincode

```powershell
cd ..\chaincode\ehr

# Download dependencies
go mod tidy
go mod vendor

# Verify build
go build
```

#### 3.2 Deploy Chaincode

```bash
# In Git Bash or WSL
cd /e/BlockChainProject/fabric-network
./scripts/deployCC.sh ehr-contract 1.0 ehr-channel
```

Expected output:
```
✅ Chaincode packaged
✅ Installed on all peers
✅ Approved by all organizations
✅ Committed to channel
✅ Deployment complete!
```

#### 3.3 Test Chaincode

```powershell
# Invoke test transaction
docker exec cli peer chaincode invoke `
  -C ehr-channel `
  -n ehr-contract `
  -c '{"Args":["CreateEHRMetadata","TEST-001","patient123","QmTest","encKey123","Test Record","abc123"]}'

# Query
docker exec cli peer chaincode query `
  -C ehr-channel `
  -n ehr-contract `
  -c '{"Args":["QueryEHR","TEST-001"]}'
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
