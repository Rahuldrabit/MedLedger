# Hyperledger Fabric Network Configuration

This directory contains all configuration files and scripts needed to run the Hyperledger Fabric network for the EHR system.

## Network Topology

### Organizations

1. **HospitalOrg**
   - 2 Peer nodes (peer0, peer1)
   - CouchDB instances for state database
   - Certificate Authority (CA)

2. **PatientOrg**
   - 2 Peer nodes (peer0, peer1)
   - CouchDB instances for state database
   - Certificate Authority (CA)

3. **OrdererOrg**
   - 1 Orderer node (Raft consensus)
   - Certificate Authority (CA)

### Channel Configuration

- **Channel Name**: `ehr-channel`
- **Endorsement Policy**: Majority (2 out of 2 organizations must endorse)
- **Lifecycle**: Endorsement policy for chaincode deployment

## Directory Structure

```
fabric-network/
├── docker-compose.yaml       # Main orchestration file
├── docker-compose-ca.yaml    # Certificate Authorities
├── docker-compose-couch.yaml # CouchDB containers
├── configtx.yaml             # Channel configuration
├── crypto-config.yaml        # Certificate generation config
├── scripts/
│   ├── network.sh            # Network management script
│   ├── createChannel.sh      # Channel creation
│   ├── deployCC.sh           # Chaincode deployment
│   └── setenv.sh             # Environment variables
├── crypto-config/            # Generated certificates (git-ignored)
├── channel-artifacts/        # Generated channel artifacts
└── organizations/            # Organization MSP definitions
```

## Quick Start

### 1. Start Network (Auto-generates certificates and creates channel)

```powershell
# Windows PowerShell
cd fabric-network
.\network.ps1 up
```

This single command will:
- Generate certificates using Docker (cryptogen in container)
- Create channel genesis block
- Start all network containers
- Create and join channel

### 2. Verify Network

```powershell
# Check running containers
docker ps

# Should see 10 containers running:
# - orderer.ehr.com
# - peer0/peer1.hospital.ehr.com  
# - peer0/peer1.patient.ehr.com
# - couchdb0/couchdb1.hospital
# - couchdb0/couchdb1.patient
# - cli

# Verify channel
docker exec cli peer channel list
```

### 3. Deploy Chaincode (CCAAS Method)

See DEPLOYMENT_GUIDE.md for detailed chaincode deployment using Chaincode-as-a-Service approach.

### 4. Stop Network

```powershell
.\network.ps1 down
```

## Network Components

### Peer Nodes

- **peer0.hospital.ehr.com**: Hospital Organization peer 0
- **peer1.hospital.ehr.com**: Hospital Organization peer 1
- **peer0.patient.ehr.com**: Patient Organization peer 0
- **peer1.patient.ehr.com**: Patient Organization peer 1

### Orderer

- **orderer.ehr.com**: Ordering service node

### Certificate Authorities

- **ca.hospital.ehr.com**: Hospital CA (port 7054)
- **ca.patient.ehr.com**: Patient CA (port 8054)
- **ca.orderer.ehr.com**: Orderer CA (port 9054)

### CouchDB Instances

- **couchdb0.hospital**: Hospital peer0 state DB
- **couchdb1.hospital**: Hospital peer1 state DB
- **couchdb0.patient**: Patient peer0 state DB
- **couchdb1.patient**: Patient peer1 state DB

## Ports

| Service | Port |
|---------|------|
| peer0.hospital | 7051, 9444 |
| peer1.hospital | 8051, 9445 |
| peer0.patient | 9051, 9446 |
| peer1.patient | 10051, 9447 |
| orderer | 7050, 9443 |
| ca.hospital | 7054 |
| ca.patient | 8054 |
| ca.orderer | 9054 |
| couchdb0.hospital | 5984 |
| couchdb1.hospital | 6984 |
| couchdb0.patient | 7984 |
| couchdb1.patient | 8984 |

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 8GB+ RAM available

## Troubleshooting

### Clean Everything

```bash
./scripts/network.sh clean
```

### View Logs

```bash
docker logs -f peer0.hospital.ehr.com
docker logs -f orderer.ehr.com
```

### Check Running Containers

```bash
docker ps
```
