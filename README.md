# Blockchain EHR System

A patient-centric secure Electronic Health Record (EHR) sharing system using Hyperledger Fabric permissioned blockchain with optional federated learning capabilities.

> **🚀 Quick Start**: See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for complete Docker-based deployment guide - no Fabric binaries installation required!

## Features

- **Patient Control**: Patients own and control access to their medical records
- **Consent Management**: Smart contract-based permission system (grant/revoke access)
- **Immutable Audit Trail**: All access attempts logged on blockchain
- **Privacy-Preserving**: End-to-end encryption (AES-256) with off-chain storage
- **Role-Based Access**: Patient, Doctor, and Admin roles with appropriate permissions
- **Federated Learning** (Phase 2): Privacy-preserving ML on distributed medical data

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Patient   │     │   Doctor    │     │    Admin    │
│  Dashboard  │     │  Dashboard  │     │  Dashboard  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                    ┌──────▼──────┐
                    │  REST API   │
                    │  (Node.js)  │
                    └──────┬──────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
    ┌──────▼──────┐              ┌────────▼────────┐
    │  Hyperledger│              │  IPFS / Cloud   │
    │   Fabric    │              │    Storage      │
    │  (Chaincode)│              │  (Encrypted)    │
    └─────────────┘              └─────────────────┘
```

## Tech Stack

### Phase 1 (MVP)
- **Blockchain**: Hyperledger Fabric 2.5
- **Smart Contracts**: Go 1.20+
- **Backend API**: Node.js 16+ / Python 3.9+ (FastAPI)
- **Frontend**: React 18+ with Material-UI
- **Storage**: IPFS or AWS S3
- **Database**: CouchDB (world state), PostgreSQL (optional metadata)
- **Encryption**: AES-256-GCM, RSA-2048, X.509 certificates

### Phase 2 (Federated Learning)
- **ML Frameworks**: PyTorch 2.1+ / TensorFlow 2.15+
- **FL Algorithm**: FedAvg (Federated Averaging)
- **Aggregation**: Python-based coordination service

## Prerequisites

- **Docker Desktop** 20.10+ (with Docker Compose)
- **Node.js** 16+ and npm 8+
- **Go** 1.20+ (for chaincode development)
- **Python** 3.9+ (tested with Python 3.14)
- **Poetry** 1.8+ (Python dependency management)
- At least **8GB RAM** for Fabric network

**Note**: Hyperledger Fabric binaries are NOT required - all operations use Docker containers.

## Quick Start

### 1. Install Python Dependencies

```bash
# Install Poetry (if not already installed)
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install

# Activate virtual environment
poetry shell
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Hyperledger Fabric Network

```powershell
cd fabric-network

# Windows PowerShell
.\network.ps1 up

# This will:
# - Generate certificates using Docker
# - Start CouchDB containers (4 instances)
# - Start orderer and peer nodes
# - Create channel and join all peers
```

### 4. Deploy Chaincode

```powershell
# Build chaincode Docker image
cd ..\chaincode\ehr
docker build -t ehr-chaincode:1.0 .

# Package and deploy (see DEPLOYMENT_GUIDE.md for detailed steps)
cd ..\..\fabric-network
# Follow chaincode deployment section in documentation
```

### 5. Start Backend API

```bash
cd backend
npm install
npm run dev
```

### 6. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Access the application at `http://localhost:3000`

## Project Structure

```
BlockChainProject/
├── fabric-network/           # Hyperledger Fabric network configuration
│   ├── docker-compose.yaml
│   ├── configtx.yaml
│   └── crypto-config.yaml
├── chaincode/                # Go smart contracts
│   └── ehr/
│       ├── main.go
│       ├── ehr.go
│       ├── consent.go
│       └── audit.go
├── backend/                  # Node.js/Python REST API
│   ├── src/
│   ├── config/
│   └── tests/
├── frontend/                 # React application
│   ├── src/
│   └── public/
├── ehr_system/              # Python utilities and FL
│   ├── crypto/
│   ├── ipfs/
│   └── federated_learning/
├── scripts/                 # Deployment and management scripts
├── docs/                    # Documentation
├── pyproject.toml          # Python dependencies
└── README.md
```

## Usage

### Patient Operations

1. **Upload Medical Record**
   - Login to patient dashboard
   - Upload file (automatically encrypted)
   - Metadata stored on blockchain, file on IPFS

2. **Grant Access to Doctor**
   - Navigate to "Consent Management"
   - Enter doctor ID and select records
   - Set expiration date (optional)

3. **Revoke Access**
   - View active consents
   - Click "Revoke" on specific consent
   - Access immediately revoked on blockchain

### Doctor Operations

1. **View Accessible Records**
   - Login to doctor dashboard
   - See list of all permitted patient records
   - Click to download and view

2. **Request Access**
   - Search for patient by ID
   - Send access request
   - Wait for patient approval

### Audit Trail

All actions are logged immutably:
- Record uploads
- Consent grants/revokes
- Access attempts (successful and failed)
- User authentication events

## Development

### Documentation

- **[DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md)** - Complete Docker-based deployment guide (Recommended)
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Detailed deployment instructions
- **[SETUP_SUMMARY.md](SETUP_SUMMARY.md)** - Python environment setup summary
- **[fabric-network/README.md](fabric-network/README.md)** - Network configuration details
- **[USER_MANUAL.md](USER_MANUAL.md)** - End-user documentation

### Running Tests

```bash
# Chaincode tests
cd chaincode/ehr
go test -v ./...

# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Python tests
poetry run pytest
```

### Code Quality

```bash
# Python formatting and linting
poetry run black .
poetry run isort .
poetry run flake8
poetry run mypy .

# JavaScript/TypeScript
npm run lint
npm run format
```

## Security Considerations

⚠️ **Important**: This is a demonstration/learning project. For production deployment:

- Implement proper **HSM (Hardware Security Module)** for key management
- Conduct **HIPAA compliance** audit
- Perform **professional security review**
- Implement **network segmentation** and firewalls
- Set up **regular security updates** and monitoring
- Use production-grade **certificate authority**
- Implement **rate limiting** and DDoS protection

## Phase 2: Federated Learning

Coming soon - privacy-preserving machine learning across hospitals:

- Local model training on encrypted data
- Blockchain-verified model updates
- Secure aggregation (FedAvg)
- Incentive mechanism for participation
- Governance and audit trail for ML models

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## References

- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Federated Learning: Google Research](https://research.google/pubs/pub45648/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)

## Support

For questions and support, please open an issue in the repository.
