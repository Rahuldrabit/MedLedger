# EHR Chaincode

Smart contracts for the blockchain-based Electronic Health Record system.

## Overview

This chaincode implements a secure, patient-centric EHR system with:
- **Role-Based Access Control** (Patient, Doctor, Admin)
- **Consent Management** (Grant/Revoke permissions)
- **Audit Logging** (Immutable trail of all actions)
- **EHR Metadata Storage** (IPFS hash, encrypted keys)

## Architecture

### Data Flow

```
1. Patient uploads EHR
   ├─> Frontend encrypts file (AES-256)
   ├─> Upload to IPFS → get hash
   └─> Store metadata on blockchain (CreateEHRMetadata)

2. Patient grants consent
   └─> GrantConsent(patientID, doctorID, recordID)

3. Doctor accesses EHR
   ├─> CheckConsent(patientID, doctorID, recordID)
   ├─> If approved: QueryEHR(recordID)
   ├─> Download from IPFS using hash
   └─> Decrypt with key from blockchain
```

## Chaincode Functions

### EHR Management

#### `CreateEHRMetadata`
Creates metadata for an encrypted EHR file.

**Parameters:**
- `recordID` - Unique record identifier
- `patientID` - Patient identifier
- `ipfsHash` - IPFS content hash
- `encryptedKey` - AES key encrypted with RSA
- `recordType` - Type of medical record
- `checksum` - SHA-256 checksum for integrity

**Returns:** Success/Error

**Access:** Patient, Admin

#### `QueryEHR`
Retrieves EHR metadata by record ID.

**Parameters:**
- `recordID` - Record to query

**Returns:** `EHRMetadata` object

**Access:** Patient (own records), Doctor (with consent), Admin

#### `QueryEHRsByPatient`
Retrieves all EHR records for a patient.

**Parameters:**
- `patientID` - Patient identifier

**Returns:** Array of `EHRMetadata`

**Access:** Patient (own records), Doctor (with consent), Admin

### Consent Management

#### `GrantConsent`
Patient grants doctor access to records.

**Parameters:**
- `consentID` - Unique consent identifier (format: `patientID-doctorID-recordID`)
- `patientID` - Patient granting access
- `doctorID` - Doctor receiving access
- `recordID` - Specific record (or `*` for all)
- `expiryDays` - Days until consent expires

**Returns:** Success/Error

**Access:** Patient, Admin

#### `RevokeConsent`
Patient revokes doctor's access.

**Parameters:**
- `consentID` - Consent to revoke

**Returns:** Success/Error

**Access:** Patient, Admin

#### `CheckConsent`
Verifies if doctor has access to a record.

**Parameters:**
- `patientID` - Patient identifier
- `doctorID` - Doctor identifier
- `recordID` - Record identifier

**Returns:** `true` if valid consent exists, `false` otherwise

**Access:** Any authenticated user

#### `QueryConsentsByPatient`
Retrieves all consents granted by a patient.

**Parameters:**
- `patientID` - Patient identifier

**Returns:** Array of `ConsentRecord`

**Access:** Patient, Admin

#### `QueryConsentsByDoctor`
Retrieves all patients who granted access to a doctor.

**Parameters:**
- `doctorID` - Doctor identifier

**Returns:** Array of `ConsentRecord`

**Access:** Doctor, Admin

### Audit Logging

All operations automatically create audit logs. Queries available:

#### `QueryAuditLogsByActor`
Get logs for specific user.

#### `QueryAuditLogsByAction`
Get logs for specific action (CREATE_EHR, GRANT_CONSENT, etc.).

#### `QueryAuditLogsByRecord`
Get all access logs for a record.

#### `QueryAuditLogsByTimeRange`
Get logs within a time range.

#### `GetAllAuditLogs`
Get all logs (Admin only).

### Utility Functions

#### `GetCallerID`
Returns the caller's X.509 identity.

#### `GetCallerRole`
Returns the caller's role (patient/doctor/admin).

## Data Structures

### EHRMetadata
```go
type EHRMetadata struct {
    RecordID      string    // Unique record ID
    PatientID     string    // Owner patient ID
    IPFSHash      string    // IPFS content hash (CID)
    EncryptedKey  string    // RSA-encrypted AES key
    Timestamp     time.Time // Creation time
    RecordType    string    // e.g., "Lab Report", "X-Ray"
    Checksum      string    // SHA-256 for integrity
    CreatedBy     string    // Creator's ID
}
```

### ConsentRecord
```go
type ConsentRecord struct {
    ConsentID   string    // Unique consent ID
    PatientID   string    // Patient granting access
    DoctorID    string    // Doctor receiving access
    RecordID    string    // Specific record (or "*")
    Granted     bool      // Currently granted?
    Timestamp   time.Time // Last modification
    ExpiryDate  time.Time // When it expires
    GrantedBy   string    // Who granted it
}
```

### AuditLog
```go
type AuditLog struct {
    LogID      string    // Unique log ID
    Action     string    // Action performed
    ActorID    string    // Who performed it
    ActorRole  string    // Their role
    TargetID   string    // Target of action
    RecordID   string    // Related record
    Timestamp  time.Time // When it happened
    IPAddress  string    // Client IP (if available)
    Success    bool      // Did it succeed?
    Message    string    // Details
}
```

## Security Features

### 1. Role-Based Access Control
- **Patient**: Can create EHR, grant/revoke consent, view own records
- **Doctor**: Can view records with valid consent
- **Admin**: Can view all records and logs (for compliance)

### 2. Consent Expiration
- All consents have expiry dates
- Automatic expiration check during access
- Patient can revoke anytime

### 3. Immutable Audit Trail
- Every action logged with timestamp
- Who, what, when, and outcome
- Cannot be modified or deleted
- CouchDB queries for analytics

### 4. Data Encryption
- Files encrypted before blockchain (AES-256)
- Encryption keys stored encrypted (RSA)
- Only metadata on blockchain, not actual data

## Building

### Prerequisites
- Go 1.20+
- Hyperledger Fabric binaries

### Build Commands

```bash
cd chaincode/ehr

# Download dependencies
go mod download

# Vendor Dependencies (optional)
go mod vendor

# Build
go build

# Run tests
go test ./...
```

## Testing

```bash
# Run all tests
go test -v ./...

# Run specific test
go test -v -run TestCreateEHRMetadata

# With coverage
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## Deployment

### Package Chaincode

```bash
cd fabric-network
peer lifecycle chaincode package ehr-contract.tar.gz \
  --path ../chaincode/ehr \
  --lang golang \
  --label ehr-contract_1.0
```

### Install on Peers

```bash
# Install on peer0.hospital
export CORE_PEER_ADDRESS=peer0.hospital.ehr.com:7051
export CORE_PEER_LOCALMSPID=HospitalMSP
# ... set other peer environment variables

peer lifecycle chaincode install ehr-contract.tar.gz

# Repeat for all peers
```

### Approve and Commit

```bash
# Get package ID
peer lifecycle chaincode queryinstalled

# Approve for Hospital Org
peer lifecycle chaincode approveformyorg \
  --channelID ehr-channel \
  --name ehr-contract \
  --version 1.0 \
  --package-id <PACKAGE_ID> \
  --sequence 1 \
  --tls --cafile $ORDERER_CA

# Approve for Patient Org (similar command)

# Commit
peer lifecycle chaincode commit \
  --channelID ehr-channel \
  --name ehr-contract \
  --version 1.0 \
  --sequence 1 \
  --tls --cafile $ORDERER_CA \
  --peerAddresses peer0.hospital.ehr.com:7051 \
  --peerAddresses peer0.patient.ehr.com:9051
```

## Invoking Chaincode

### Create EHR Metadata

```bash
peer chaincode invoke \
  -C ehr-channel \
  -n ehr-contract \
  --peerAddresses peer0.hospital.ehr.com:7051 \
  --tls --cafile $ORDERER_CA \
  -c '{"function":"CreateEHRMetadata","Args":["rec001","patient123","QmXyZ...","encryptedAESKey","Lab Report","sha256checksum"]}'
```

### Grant Consent

```bash
peer chaincode invoke \
  -C ehr-channel \
  -n ehr-contract \
  --peerAddresses peer0.hospital.ehr.com:7051 \
  --tls --cafile $ORDERER_CA \
  -c '{"function":"GrantConsent","Args":["patient123-doctor456-rec001","patient123","doctor456","rec001","30"]}'
```

### Query EHR

```bash
peer chaincode query \
  -C ehr-channel \
  -n ehr-contract \
  -c '{"function":"QueryEHR","Args":["rec001"]}'
```

## Next Steps

1. Implement chaincode tests
2. Add indexes for CouchDB queries
3. Implement advanced access patterns
4. Add chaincode events for notifications
5. Integrate with backend API

## License

MIT
