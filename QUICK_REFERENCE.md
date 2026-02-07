# Quick Reference - Command Cheat Sheet

## Network Management

### Start Network
```powershell
cd fabric-network
.\network.ps1 up
```

### Stop Network
```powershell
.\network.ps1 down
```

### Clean Everything
```powershell
.\network.ps1 clean
```

### Check Network Status
```powershell
docker ps
docker exec cli peer channel list
docker exec cli peer channel getinfo -c ehr-channel
```

## Chaincode Operations

### Query Chaincode
```powershell
# Get caller identity
docker exec cli peer chaincode query -C ehr-channel -n ehr -c '{\"function\":\"GetCallerID\",\"Args\":[]}'

# Query specific EHR record
docker exec cli peer chaincode query -C ehr-channel -n ehr -c '{\"function\":\"QueryEHR\",\"Args\":[\"RECORD-ID\"]}'
```

### Invoke Chaincode
```powershell
# Initialize
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
```

## Container Logs

### View Logs
```powershell
# Orderer logs
docker logs orderer.ehr.com

# Peer logs
docker logs peer0.hospital.ehr.com
docker logs peer0.patient.ehr.com

# Chaincode logs
docker logs ehr-chaincode

# Follow logs
docker logs -f peer0.hospital.ehr.com
```

## Peer Management

### Switch to Different Peer

```powershell
# HospitalMSP - peer1
docker exec -e CORE_PEER_ADDRESS=peer1.hospital.ehr.com:8051 `
  cli peer channel list

# PatientMSP - peer0
docker exec -e CORE_PEER_ADDRESS=peer0.patient.ehr.com:9051 `
  -e CORE_PEER_LOCALMSPID=PatientMSP `
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.ehr.com/tlsca/tlsca.patient.ehr.com-cert.pem `
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/patient.ehr.com/users/Admin@patient.ehr.com/msp `
  cli peer channel list
```

## Debugging

### Enter CLI Container
```powershell
docker exec -it cli bash
```

### Inspect Certificates
```powershell
# Inside CLI container
ls /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/

# View certificate details
openssl x509 -in /path/to/cert.pem -text -noout
```

### Check Chaincode Package
```powershell
docker exec cli peer lifecycle chaincode queryinstalled
docker exec cli peer lifecycle chaincode querycommitted -C ehr-channel
```

## Network Endpoints

| Component | Address | Port | Purpose |
|-----------|---------|------|---------|
| Orderer | orderer.ehr.com | 7050 | Consensus |
| Orderer Admin | orderer.ehr.com | 17050 | Channel management |
| peer0.hospital | peer0.hospital.ehr.com | 7051 | Endorsement |
| peer1.hospital | peer1.hospital.ehr.com | 8051 | Endorsement |
| peer0.patient | peer0.patient.ehr.com | 9051 | Endorsement |
| peer1.patient | peer1.patient.ehr.com | 10051 | Endorsement |
| CouchDB (hospital0) | localhost | 5984 | State DB |
| CouchDB (hospital1) | localhost | 6984 | State DB |
| CouchDB (patient0) | localhost | 7984 | State DB |
| CouchDB (patient1) | localhost | 8984 | State DB |
| Chaincode | ehr-chaincode | 7052 | Smart contract |

## Common Issues

### Port Conflicts
```powershell
# Find process using port
netstat -ano | findstr ":7050"

# Kill process
taskkill /PID <PID> /F
```

### Container Won't Start
```powershell
# Check logs
docker logs <container-name>

# Remove and recreate
docker rm -f <container-name>
.\network.ps1 up
```

### Chaincode Not Responding
```powershell
# Restart chaincode container
docker restart ehr-chaincode

# Check logs
docker logs ehr-chaincode

# Rebuild if needed
cd chaincode\ehr
docker build --no-cache -t ehr-chaincode:1.0 .
docker stop ehr-chaincode
docker rm ehr-chaincode
# Then restart using docker run command from deployment guide
```

## File Locations

### Important Files
```
E:\BlockChainProject\
├── fabric-network\
│   ├── docker-compose.yaml          # Main network configuration
│   ├── crypto-config.yaml           # Certificate structure
│   ├── configtx.yaml                # Channel configuration
│   ├── network.ps1                  # Network management script
│   ├── crypto-config\               # Generated certificates
│   └── channel-artifacts\           # Generated artifacts
├── chaincode\ehr\
│   ├── main.go                      # Chaincode entry point
│   ├── ehr.go                       # EHR functions
│   ├── consent.go                   # Consent management
│   ├── audit.go                     # Audit logging
│   └── Dockerfile                   # Chaincode container
└── DOCKER_DEPLOYMENT.md             # Complete guide
```

## Environment Variables

### For Peer Commands
```powershell
$env:CORE_PEER_ADDRESS = "peer0.hospital.ehr.com:7051"
$env:CORE_PEER_LOCALMSPID = "HospitalMSP"
$env:CORE_PEER_TLS_ENABLED = "true"
$env:CORE_PEER_TLS_ROOTCERT_FILE = "/path/to/tlsca.pem"
$env:CORE_PEER_MSPCONFIGPATH = "/path/to/admin/msp"
```

## Useful Docker Commands

```powershell
# List all containers
docker ps -a

# Remove stopped containers
docker container prune

# View resource usage
docker stats

# Remove all blockchain volumes
docker volume prune

# View networks
docker network ls

# Inspect network
docker network inspect ehr-network
```

## Python Environment

### Activate Environment
```powershell
poetry shell
```

### Install New Package
```powershell
poetry add package-name
```

### Run Python Script
```powershell
poetry run python script.py
```

## Quick Testing Workflow

1. Start network
   ```powershell
   cd fabric-network
   .\network.ps1 up
   ```

2. Deploy chaincode (first time only)
   ```powershell
   # See DOCKER_DEPLOYMENT.md Section 3
   ```

3. Test chaincode
   ```powershell
   docker exec cli peer chaincode query -C ehr-channel -n ehr -c '{\"function\":\"GetCallerID\",\"Args\":[]}'
   ```

4. View logs
   ```powershell
   docker logs -f ehr-chaincode
   ```

5. Stop network
   ```powershell
   .\network.ps1 down
   ```
