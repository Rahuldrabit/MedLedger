# Backend API - EHR Blockchain System

Node.js Express backend for the blockchain-based Electronic Health Record system.

## Features

- 🔐 JWT Authentication
- 🏥 Patient EHR Management
- 👨‍⚕️ Doctor Access Control
- 🔑 Consent Management
- 📝 Audit Logging
- 🔗 Hyperledger Fabric Integration
- 📦 IPFS File Storage
- 🔒 AES-256 + RSA Encryption

## Architecture

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────┐     ┌──────────────┐
│   Express   │────▶│    Fabric    │
│   Backend   │     │   Network    │
└──────┬──────┘     └──────────────┘
       │
       │            ┌──────────────┐
       └───────────▶│     IPFS     │
                    │    Storage   │
                    └──────────────┘
```

## Tech Stack

- **Framework**: Express.js 4.18
- **Blockchain**: Hyperledger Fabric SDK 2.2
- **Storage**: IPFS HTTP Client
- **Auth**: JWT (jsonwebtoken 9.0)
- **Encryption**: node-forge, crypto-js
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Jest, Supertest

## Installation

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

## Configuration

Edit `.env` file:

```env
# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=24h

# Fabric
CHANNEL_NAME=ehr-channel
CHAINCODE_NAME=ehr-contract

# IPFS
IPFS_HOST=127.0.0.1
IPFS_PORT=5001
```

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Testing
```bash
npm test
```

## API Endpoints

### Authentication

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "userId": "patient123",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "patient123",
      "role": "patient"
    }
  }
}
```

---

### Patient Endpoints

All patient endpoints require `Authorization: Bearer <token>` header.

#### Upload EHR
```http
POST /api/patient/ehr/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>
recordType: "Lab Report"
```

#### Get All Records
```http
GET /api/patient/ehr
Authorization: Bearer <token>
```

#### Get Specific Record
```http
GET /api/patient/ehr/:recordId
Authorization: Bearer <token>
```

#### Grant Consent
```http
POST /api/patient/consent/grant
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorId": "doctor456",
  "recordId": "EHR-123",
  "expiryDays": 30
}
```

#### Revoke Consent
```http
DELETE /api/patient/consent/:consentId
Authorization: Bearer <token>
```

#### View Consents
```http
GET /api/patient/consent
Authorization: Bearer <token>
```

#### View Audit Logs
```http
GET /api/patient/audit/:recordId
Authorization: Bearer <token>
```

---

### Doctor Endpoints

#### Get Accessible Patients
```http
GET /api/doctor/patients
Authorization: Bearer <token>
```

#### Get Patient Records
```http
GET /api/doctor/patient/:patientId/records
Authorization: Bearer <token>
```

#### Get EHR Metadata
```http
GET /api/doctor/ehr/:recordId
Authorization: Bearer <token>
```

#### Download EHR File
```http
GET /api/doctor/ehr/:recordId/download
Authorization: Bearer <token>
```

#### View Active Consents
```http
GET /api/doctor/consent/active
Authorization: Bearer <token>
```

#### View My Activities
```http
GET /api/doctor/audit/my-activities
Authorization: Bearer <token>
```

---

### Admin Endpoints

#### Get All Audit Logs
```http
GET /api/admin/audit/all
Authorization: Bearer <token>
```

#### Get Logs by Action
```http
GET /api/admin/audit/action/CREATE_EHR
Authorization: Bearer <token>
```

#### Get User Logs
```http
GET /api/admin/audit/user/:userId
Authorization: Bearer <token>
```

#### Get Record Logs
```http
GET /api/admin/audit/record/:recordId
Authorization: Bearer <token>
```

#### Get System Statistics
```http
GET /api/admin/stats
Authorization: Bearer <token>
```

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── fabric.config.js      # Fabric SDK configuration
│   │   └── ipfs.config.js        # IPFS client
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   ├── errorHandler.js       # Error handling
│   │   └── validator.js          # Request validation
│   ├── routes/
│   │   ├── auth.routes.js        # Auth endpoints
│   │   ├── patient.routes.js     # Patient endpoints
│   │   ├── doctor.routes.js      # Doctor endpoints
│   │   └── admin.routes.js       # Admin endpoints
│   ├── utils/
│   │   ├── encryption.js         # AES/RSA encryption
│   │   └── logger.js             # Winston logger
│   └── server.js                 # Express app
├── .env.example                  # Environment template
├── package.json
└── README.md
```

## Security Features

### 1. JWT Authentication
- Token-based authentication
- Role-based access control (Patient/Doctor/Admin)
- Token expiration (default 24h)

### 2. File Encryption
- AES-256-GCM for file content
- RSA-2048 for key exchange
- SHA-256 checksums

### 3. Access Control
- Consent-based access
- Automatic consent expiration
- Audit logging

### 4. Input Validation
- Joi schema validation
- File type restrictions
- File size limits

## Error Handling

All errors return consistent format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Internal Server Error

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## Logging

Logs are stored in `./logs/`:
- `combined.log` - All logs
- `error.log` - Error logs only

Console logging enabled in development mode.

## Deployment

### Prerequisites
1. Fabric network running
2. IPFS node running
3. Chaincode deployed

### Steps
```bash
# 1. Install dependencies
npm install --production

# 2. Set environment variables
export NODE_ENV=production
export JWT_SECRET=<strong-secret>

# 3. Start server
npm start
```

### Production Checklist
- [ ] Change JWT_SECRET
- [ ] Use HTTPS
- [ ] Enable rate limiting
- [ ] Set up reverse proxy (nginx)
- [ ] Configure proper CORS
- [ ] Set up monitoring
- [ ] Regular backups

## Development

### Adding New Endpoint

1. Create route handler in `src/routes/`
2. Add validation schema in `middleware/validator.js`
3. Update this README
4. Write tests

### Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Troubleshooting

### Cannot connect to Fabric
- Ensure Fabric network is running
- Check connection profile path
- Verify peer endpoints in `.env`

### Cannot connect to IPFS
- Start IPFS: `docker-compose -f ../ipfs/docker-compose-ipfs.yaml up
- Verify IPFS_PORT in `.env`

### JWT errors
- Check JWT_SECRET is set
- Verify token format: `Bearer <token>`
- Token may have expired

## License

MIT
