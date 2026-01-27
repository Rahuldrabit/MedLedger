# Hyperledger Fabric Network - Configuration Summary

## ✅ Network Components Created

### Docker Compose Files

| File | Purpose | Containers |
|------|---------|------------|
| [`docker-compose.yaml`](file:///e:/BlockChainProject/fabric-network/docker-compose.yaml) | Main network | Orderer, 4 Peers, CLI |
| [`docker-compose-couch.yaml`](file:///e:/BlockChainProject/fabric-network/docker-compose-couch.yaml) | State databases | 4 CouchDB instances |
| [`docker-compose-ca.yaml`](file:///e:/BlockChainProject/fabric-network/docker-compose-ca.yaml) | Certificate Authorities | 3 CA servers |

### Network Topology

```
┌─────────────────────────────────────────────────────────┐
│                     EHR Blockchain Network              │
└─────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  OrdererOrg  │     │ HospitalOrg  │     │  PatientOrg  │
│              │     │              │     │              │
│  orderer     │     │  peer0       │     │  peer0       │
│  :7050       │     │  :7051       │     │  :9051       │
│              │     │              │     │              │
│  CA :9054    │     │  peer1       │     │  peer1       │
└──────────────┘     │  :8051       │     │  :10051      │
                     │              │     │              │
                     │  CA :7054    │     │  CA :8054    │
                     └──────────────┘     └──────────────┘
                            │                     │
                     ┌──────┴──────┐       ┌──────┴──────┐
                     │   CouchDB   │       │   CouchDB   │
                     │ :5984 :6984 │       │ :7984 :8984 │
                     └─────────────┘       └─────────────┘
```

### Network Services

#### Orderer (Consensus Layer)
- **orderer.ehr.com** - Raft consensus ordering service
  - Port 7050: Client connections
  - Port 9443: Operations/metrics

#### Hospital Organization (2 Peers)
- **peer0.hospital.ehr.com**
  - Port 7051: Peer endpoint
  - Port 9444: Operations/metrics
  - State DB: couchdb0.hospital:5984

- **peer1.hospital.ehr.com**
  - Port 8051: Peer endpoint
  - Port 9445: Operations/metrics
  - State DB: couchdb1.hospital:6984

#### Patient Organization (2 Peers)
- **peer0.patient.ehr.com**
  - Port 9051: Peer endpoint
  - Port 9446: Operations/metrics
  - State DB: couchdb0.patient:7984

- **peer1.patient.ehr.com**
  - Port 10051: Peer endpoint
  - Port 9447: Operations/metrics
  - State DB: couchdb1.patient:8984

#### Certificate Authorities
- **ca.hospital.ehr.com** - Port 7054
- **ca.patient.ehr.com** - Port 8054
- **ca.orderer.ehr.com** - Port 9054

## Configuration Files

### [`configtx.yaml`](file:///e:/BlockChainProject/fabric-network/configtx.yaml)
Defines channel configuration and policies:
- **Organizations**: OrdererOrg, HospitalMSP, PatientMSP
- **Endorsement Policy**: MAJORITY (both orgs must endorse)
- **Consensus**: etcdRaft
- **Capabilities**: V2_5 (latest Fabric features)

### [`crypto-config.yaml`](file:///e:/BlockChainProject/fabric-network/crypto-config.yaml)
Certificate generation template:
- 2 peers per organization
- 3 users per peer organization
- Automatic MSP structure generation

## Management Scripts

### Windows PowerShell: [`network.ps1`](file:///e:/BlockChainProject/fabric-network/network.ps1)

```powershell
# Start network
.\network.ps1 up

# Stop network
.\network.ps1 down

# Clean everything
.\network.ps1 clean

# Restart
.\network.ps1 restart
```

### Linux/Mac: [`network.sh`](file:///e:/BlockChainProject/fabric-network/network.sh)

```bash
# Make executable
chmod +x network.sh scripts/*.sh

# Start network
./network.sh up

# Generate certificates
./network.sh generateCerts

# Create channel
./network.sh createChannel

# Deploy chaincode
./network.sh deployCC
```

## Channel Management

### [`scripts/createChannel.sh`](file:///e:/BlockChainProject/fabric-network/scripts/createChannel.sh)
- Creates `ehr-channel`
- Joins all 4 peers
- Updates anchor peers for both organizations

### [`scripts/deployCC.sh`](file:///e:/BlockChainProject/fabric-network/scripts/deployCC.sh)
Chaincode deployment workflow:
1. Package chaincode
2. Install on all peers
3. Approve for both organizations
4. Commit to channel
5. Initialize

## Directory Structure

```
fabric-network/
├── README.md                    # Network overview
├── SETUP_GUIDE.md              # Detailed setup instructions
├── configtx.yaml               # Channel configuration
├── crypto-config.yaml          # Certificate template
├── docker-compose.yaml         # Main network services
├── docker-compose-ca.yaml      # Certificate Authorities
├── docker-compose-couch.yaml   # CouchDB instances
├── network.sh                  # Linux/Mac management script
├── network.ps1                 # Windows PowerShell script
├── channel-artifacts/          # Generated channel files
│   ├── genesis.block           (generated)
│   ├── ehr-channel.tx          (generated)
│   ├── HospitalMSPanchors.tx   (generated)
│   └── PatientMSPanchors.tx    (generated)
├── crypto-config/              # Generated certificates
│   ├── ordererOrganizations/   (generated)
│   └── peerOrganizations/      (generated)
└── scripts/
    ├── utils.sh                # Utility functions
    ├── createChannel.sh        # Channel creation
    └── deployCC.sh             # Chaincode deployment
```

## Network Features

### Security
- ✅ TLS enabled on all connections
- ✅ X.509 certificate-based identity
- ✅ Separate MSPs for each organization
- ✅ Role-based access control (Admin, Client, Peer)

### Scalability
- ✅ 2 peers per organization (high availability)
- ✅ CouchDB for rich queries
- ✅ Raft consensus (crash fault tolerant)
- ✅ Horizontal scaling support

### Monitoring
- ✅ Prometheus metrics endpoints
- ✅ Health check endpoints
- ✅ Docker logging

## Prerequisites (Before Starting Network)

### Required
1. **Docker Desktop** 20.10+ (Windows/Mac) or Docker Engine (Linux)
2. **Docker Compose** 2.0+
3. **8GB+ RAM** available

### For Certificate Generation
4. **Hyperledger Fabric Binaries** (cryptogen, configtxgen, peer)
   - Download: https://github.com/hyperledger/fabric/releases

## Quick Start (Windows)

```powershell
# 1. Navigate to network directory
cd e:\BlockChainProject\fabric-network

# 2. Ensure Docker Desktop is running
docker --version

# 3. Generate certificates (requires Fabric binaries)
# Download from: https://hyperledger-fabric.readthedocs.io/en/release-2.5/install.html
cryptogen generate --config=.\crypto-config.yaml --output="crypto-config"

# 4. Generate channel artifacts
mkdir channel-artifacts
configtxgen -profile EHROrdererGenesis -channelID system-channel -outputBlock .\channel-artifacts\genesis.block
configtxgen -profile EHRChannel -outputCreateChannelTx .\channel-artifacts\ehr-channel.tx -channelID ehr-channel

# 5. Start the network
.\network.ps1 up

# 6. Verify
docker ps
# You should see 10 containers running

# 7. Create channel (inside CLI container)
docker exec -it cli bash
# Then run: cd scripts && ./createChannel.sh
```

## Testing Network

```powershell
# Check orderer logs
docker logs orderer.ehr.com

# Check peer logs
docker logs peer0.hospital.ehr.com

# Access CouchDB UI
# Hospital Peer0: http://localhost:5984/_utils
# Login: admin / adminpw

# Enter CLI container
docker exec -it cli bash

# Inside CLI - check peer version
peer version

# List channels
peer channel list
```

## Next Steps

With the network configured:

1. **Install Fabric Binaries** - Download from Hyperledger
2. **Generate Certificates** - Run cryptogen
3. **Start Network** - Use `network.ps1 up`
4. **Develop Chaincode** - Implement Go smart contracts
5. **Deploy Chaincode** - Use deployment scripts
6. **Build Backend API** - Fabric SDK integration

## Troubleshooting

### Docker not running
- Start Docker Desktop
- Check system tray icon

### Port conflicts
```powershell
# Find process using port
netstat -ano | findstr :7051
# Kill process
taskkill /PID <PID> /F
```

### Container startup failures
```powershell
# View container logs
docker logs <container-name>

# Restart network
.\network.ps1 down
.\network.ps1 up
```

### Clean slate restart
```powershell
.\network.ps1 clean
# Then regenerate certs and restart
```

---

**Status**: ✅ Network configuration complete
**Ready for**: Certificate generation and network startup
**Documentation**: See [`SETUP_GUIDE.md`](file:///e:/BlockChainProject/fabric-network/SETUP_GUIDE.md) for detailed instructions
