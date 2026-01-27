# IPFS Configuration for Off-Chain EHR Storage

This directory contains the IPFS (InterPlanetary File System) setup for storing encrypted EHR files off-chain.

## Overview

IPFS provides decentralized, content-addressed storage for EHR files. Only encrypted file hashes and metadata are stored on the blockchain, while actual file content resides in IPFS.

## Architecture

```
┌─────────────────────────────────────────────┐
│          Blockchain (Hyperledger)           │
│  Stores: Hash, Encrypted Key, Metadata     │
└──────────────────┬──────────────────────────┘
                   │
                   │ Reference
                   ▼
┌─────────────────────────────────────────────┐
│               IPFS Node                      │
│  Stores: Encrypted EHR Files               │
│  Content-Addressed by SHA-256 Hash         │
└─────────────────────────────────────────────┘
```

## Features

- **Content Addressing**: Files identified by cryptographic hash (CID)
- **Deduplication**: Identical files stored once
- **Decentralized**: Distributed across IPFS network
- **Immutable**: Content cannot be changed (new version = new hash)
- **API Access**: HTTP API for upload/download
- **Gateway Access**: HTTP gateway for browser access

## Quick Start

### Start IPFS Node

```bash
# Navigate to ipfs directory
cd e:\BlockChainProject\ipfs

# Start IPFS container
docker-compose -f docker-compose-ipfs.yaml up -d

# Check status
docker logs ipfs-node

# Verify API is accessible
curl http://localhost:5001/api/v0/version
```

### Windows PowerShell

```powershell
cd e:\BlockChainProject\ipfs
docker-compose -f docker-compose-ipfs.yaml up -d
docker logs ipfs-node

# Test API
Invoke-WebRequest -Uri http://localhost:5001/api/v0/version
```

## IPFS Endpoints

| Endpoint | Port | Purpose |
|----------|------|---------|
| API Server | 5001 | HTTP API for adding/retrieving files |
| Gateway | 8080 | HTTP gateway for accessing content |
| Swarm | 4001 | P2P communication with other IPFS nodes |

## Usage Examples

### Upload File (Python)

```python
import ipfshttpclient

# Connect to local IPFS node
client = ipfshttpclient.connect('/ip4/127.0.0.1/tcp/5001')

# Add encrypted file
result = client.add('encrypted_ehr.enc')
print(f"IPFS Hash (CID): {result['Hash']}")

# Output: QmXyZ... (this hash goes on blockchain)
```

### Upload File (curl)

```bash
# Add file
curl -F file=@encrypted_ehr.enc http://localhost:5001/api/v0/add

# Response: {"Hash":"QmXyZ...","Name":"encrypted_ehr.enc"}
```

### Retrieve File (Python)

```python
# Get file by hash
client.get('QmXyZ...')

# Download to specific location
client.get('QmXyZ...', target='./downloads/')
```

### Retrieve File (curl)

```bash
# Download file by hash
curl http://localhost:5001/api/v0/cat?arg=QmXyZ... > downloaded_file.enc

# Or via gateway
curl http://localhost:8080/ipfs/QmXyZ... > downloaded_file.enc
```

## Integration with EHR System

### Workflow

1. **Upload EHR**:
   - Patient uploads file via UI
   - Backend encrypts file with AES-256
   - Backend uploads to IPFS → gets CID
   - Backend stores CID + encrypted AES key on blockchain

2. **Retrieve EHR**:
   - Doctor requests file (with consent)
   - Backend queries blockchain for CID and encrypted key
   - Backend downloads file from IPFS using CID
   - Backend decrypts file with patient's private key
   - Return decrypted file to doctor

### Security Model

```
Original File → AES Encrypt → IPFS (public but encrypted)
                     ↓
               AES Key → RSA Encrypt (patient public key) → Blockchain
```

- Files in IPFS are **encrypted** (useless without key)
- AES keys on blockchain are **RSA-encrypted** (only patient can decrypt)
- When granting access, patient re-encrypts AES key with doctor's public key

## Directory Structure

```
ipfs/
├── docker-compose-ipfs.yaml    # IPFS container configuration
├── README.md                   # This file
├── ipfs-data/                  # IPFS data directory (created on start)
│   ├── blocks/                 # Content blocks
│   ├── datastore/              # Metadata
│   └── config                  # IPFS configuration
└── ipfs-staging/               # Staging area for imports
```

## Configuration

The IPFS node runs with:
- **Profile**: `server` (optimized for server use)
- **Garbage Collection**: Enabled (auto-cleanup)
- **Migration**: Automatic
- **Network**: Connected to `ehr-network` (same as Fabric)

### Customize Configuration

Access the running container:

```bash
docker exec -it ipfs-node sh

# View configuration
ipfs config show

# Enable/disable features
ipfs config --json Swarm.EnableAutoRelay true
```

## Management Commands

### Start/Stop

```bash
# Start
docker-compose -f docker-compose-ipfs.yaml up -d

# Stop
docker-compose -f docker-compose-ipfs.yaml down

# Restart
docker-compose -f docker-compose-ipfs.yaml restart

# View logs
docker logs -f ipfs-node
```

### Monitoring

```bash
# Check peers
docker exec ipfs-node ipfs swarm peers

# Check storage stats
docker exec ipfs-node ipfs repo stat

# List pinned files (permanent storage)
docker exec ipfs-node ipfs pin ls
```

### Pinning (Prevent Garbage Collection)

```bash
# Pin a file (keep forever)
docker exec ipfs-node ipfs pin add QmXyZ...

# Unpin a file (allow cleanup)
docker exec ipfs-node ipfs pin rm QmXyZ...

# Garbage collect unpinned files
docker exec ipfs-node ipfs repo gc
```

## Web UI (Optional)

IPFS provides a web dashboard for visualization:

```bash
# Install IPFS Web UI
docker exec ipfs-node ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:3000", "http://127.0.0.1:5001", "https://webui.ipfs.io"]'
docker exec ipfs-node ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST"]'

# Restart
docker restart ipfs-node
```

Access at: https://webui.ipfs.io (connects to local node)

## Security Considerations

### ✅ What IPFS Provides
- Content addressing (tamper-proof)
- Deduplication
- Distributed storage
- Availability

### ⚠️ What IPFS Does NOT Provide
- Encryption (must encrypt before uploading)
- Access control (anyone with hash can download)
- Guaranteed persistence (files may be garbage collected)
- Privacy (content is public if not encrypted)

### 🔐 Our Implementation
- All files encrypted with AES-256 before IPFS
- IPFS hashes stored on private blockchain
- Access controlled by smart contracts
- Pinning for important files

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 5001
netstat -ano | findstr :5001

# Kill the process or change IPFS port in docker-compose
```

### Cannot Connect to API

```bash
# Check container is running
docker ps | grep ipfs

# Check logs
docker logs ipfs-node

# Verify network
docker network inspect ehr-network
```

### Slow Upload/Download

- Check internet connection (IPFS is P2P)
- Check local disk speed
- Consider increasing resources in Docker Desktop

### File Not Found

- File may have been garbage collected
- Ensure file is pinned: `ipfs pin add <CID>`
- Check if file actually exists: `ipfs cat <CID>`

## Production Considerations

For production deployment:

1. **Clustering**: Use IPFS Cluster for redundancy
2. **Pinning Service**: Use Pinata, Infura, or similar
3. **Private Network**: Consider IPFS private network for sensitive data
4. **Backup**: Regular backups of `ipfs-data` directory
5. **Monitoring**: Set up metrics and alerts
6. **Rate Limiting**: Implement API rate limits

## Alternative: Cloud Storage

If IPFS is not suitable, you can use:
- **AWS S3** with server-side encryption
- **Azure Blob Storage** with encryption
- **Google Cloud Storage** with CMEK

Update backend to use cloud SDK instead of IPFS client.

## Next Steps

1. Start IPFS node: `docker-compose -f docker-compose-ipfs.yaml up -d`
2. Test API connection with Python script
3. Integrate with backend API
4. Implement encryption before upload
5. Create cleanup policies for old files

## Resources

- [IPFS Documentation](https://docs.ipfs.tech/)
- [IPFS HTTP API](https://docs.ipfs.tech/reference/http/api/)
- [Python IPFS Client](https://github.com/ipfs-shipyard/py-ipfs-http-client)
