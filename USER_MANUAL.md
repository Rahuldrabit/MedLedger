# EHR Blockchain System - User Manual

## Welcome to the EHR Blockchain System

This Electronic Health Record (EHR) system uses blockchain technology to provide secure, transparent, and patient-controlled health data management.

### What is this system?

The EHR Blockchain System is a **decentralized health record platform** that:
- 🔐 **Encrypts** all medical records before storage
- 🔗 **Stores** data on IPFS (distributed file system) and Hyperledger Fabric (blockchain)
- 🔑 **Puts you in control** - patients decide who can access their records
- 📝 **Logs everything** - complete audit trail of all access

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [For Patients](#for-patients)
3. [For Doctors](#for-doctors)
4. [For Administrators](#for-administrators)
5. [Security & Privacy](#security--privacy)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

---

## Getting Started

### Accessing the System

1. Open your web browser
2. Navigate to: **http://localhost:3001**  
   (Or the URL provided by your system administrator)
3. You'll see the login page

### First Time Login

**Demo Accounts** (for testing):

| Role | User ID | Password |
|------|---------|----------|
| Patient | patient123 | password |
| Doctor | doctor456 | password |
| Admin | admin789 | password |

**Production**: Contact your system administrator to create your account.

### Dashboard Overview

After logging in, you'll see your **personalized dashboard**:
- **Left sidebar**: Main navigation menu
- **Top bar**: Your profile and logout button
- **Main area**: Dashboard with statistics and quick actions

---

## For Patients

As a patient, you control your medical records and who can access them.

### 1. Uploading Medical Records

#### Step-by-Step:

1. Click **"Upload EHR"** in the left sidebar
2. **Drag and drop** your file, or click to browse
   - Supported formats: PDF, JPG, PNG
   - Maximum size: 10 MB
3. Enter a **description** (e.g., "Lab Report - January 2024")
4. Click **"Upload & Encrypt"**

#### What Happens:
- ✅ Your file is encrypted with military-grade AES-256 encryption
- ✅ Encrypted file is uploaded to IPFS (decentralized storage)
- ✅ Metadata (hash, checksum) is stored on blockchain
- ✅ Only you can decrypt and view the original file

**Important**: Upload process takes 5-15 seconds depending on file size.

---

### 2. Viewing Your Records

1. Click **"My Records"** in sidebar
2. See all your uploaded health records
3. For each record, you can see:
   - **Type**: Description you entered
   - **Upload Date**: When you uploaded it
   - **IPFS Hash**: Unique identifier for the file
   - **Checksum**: Verification code ensuring file integrity

#### Record Details:

Each record card shows:
```
Lab Report
Record ID: EHR-abc123
Upload Date: Jan 27, 2024, 10:30 AM
IPFS Hash: QmX... (truncated)
Checksum: abc123... (truncated)
Status: 🔒 Encrypted
```

**Tip**: Click the **timeline icon** 📊 to see who accessed this record and when.

---

### 3. Granting Access to Doctors

#### Why grant access?
Doctors can only view your records if you explicitly grant them permission.

#### How to grant access:

1. Click **"Consents"** in sidebar
2. Click **"Grant Access"** button
3. Fill in the form:
   - **Doctor ID**: Enter the doctor's user ID (e.g., `doctor456`)
   - **Specific Record** (Optional): Leave empty to grant access to all records
   - **Expiry Duration**: Choose how long access lasts
     - 7 days
     - 30 days (recommended)
     - 90 days
     - 180 days
     - 1 year

4. Click **"Grant Consent"**

#### Visual Confirmation:
You'll see a confirmation message: ✅ "Consent granted successfully!"

---

### 4. Managing Consents

#### View Active Consents:

In the **"Consents"** page, you'll see all granted permissions:

```
┌─────────────────────────────────┐
│ doctor456                    ✅ │
│ All Records                     │
│                                 │
│ Granted: Jan 20, 2024          │
│ Expires: Feb 19, 2024          │
│                                 │
│ [Revoke Access]                │
└─────────────────────────────────┘
```

**Status Indicators**:
- ✅ **Active**: Doctor can currently access
- ⏱️ **Expired**: Access has expired
- ❌ **Revoked**: You manually revoked access

#### Revoking Access:

1. Find the consent you want to revoke
2. Click **"Revoke Access"** button
3. Confirm your choice
4. ✅ Access is immediately revoked

**Important**: Revoked access cannot be undone. You must grant new consent if needed.

---

### 5. Viewing Audit Logs

See everyone who accessed your records:

1. Go to **"My Records"**
2. Find the record you want to check
3. Click the **timeline icon** 📊
4. You'll see a list of all access attempts:

```
✅ doctor456 - VIEW_RECORD
   Jan 27, 2024, 10:45 AM

✅ patient123 (you) - UPLOAD_RECORD
   Jan 20, 2024, 9:30 AM
```

**What you can see**:
- Who accessed the record
- What action they performed
- When it happened
- Whether it succeeded or failed

---

## For Doctors

As a doctor, you can access patient records **only with their consent**.

### 1. Viewing Your Patients

1. Click **"Patients"** in sidebar
2. See all patients who granted you access
3. Each card shows:
   - Patient ID
   - When consent was granted
   - When consent expires
   - Status (Active/Expired)

```
┌─────────────────────────────────┐
│ patient123               ✅     │
│ Access Granted: Jan 20, 2024    │
│ Expires: Feb 19, 2024           │
│                                  │
│ [View Records]                  │
└─────────────────────────────────┘
```

---

### 2. Accessing Patient Records

#### Step-by-Step:

1. Go to **"Patients"**
2. Find the patient
3. Click **"View Records"**
4. You'll see only the records they shared with you

**Consent Verification**:
- 🔒 If no consent: "No accessible records"
- ⏱️ If expired: Records are hidden
- ✅ If active: All shared records visible

---

### 3. Downloading Medical Files

1. Go to patient's records
2. Find the record you need
3. Click **"Download Encrypted File"**
4. File downloads as: `EHR-abc123.enc`

**Important**: 
- Downloaded files are **encrypted**
- You need the decryption key (handled automatically in production)
- In demo: Files remain encrypted for security

**Best Practice**: Download only when necessary to respect patient privacy.

---

### 4. Your Activity Log

View your own access history:

1. Click **"Dashboard"** (home icon)
2. Scroll to **"Recent Activities"**
3. See your last 5 actions

This helps you:
- Track which patients you viewed
- Verify successful access
- Maintain your own audit trail

---

## For Administrators

System administrators can monitor and audit the entire platform.

### 1. System Statistics

**Dashboard** shows:

```
┌──────────────┬──────────────┬──────────────┐
│ Total Actions│ Success Rate │ Action Types │
│     1,247    │    99.8%     │      8       │
└──────────────┴──────────────┴──────────────┘
```

**Charts**:
- **Actions by Type**: Bar chart of all blockchain transactions
- **Actions by Role**: Who is using the system most

---

### 2. Audit Log Viewer

View **ALL system activity**:

1. Click **"Audit Logs"** in sidebar
2. Use the filter dropdown:
   - All Actions
   - CREATE_EHR
   - QUERY_EHR
   - GRANT_CONSENT
   - REVOKE_CONSENT
   - CHECK_CONSENT

3. Table shows:
   - **Timestamp**: When it happened
   - **Action**: What was done
   - **Actor**: Who did it
   - **Role**: Their role (patient/doctor/admin)
   - **Record ID**: Which record was affected
   - **Status**: Success or Failed

**Export**: (Future feature) Download logs as CSV

---

### 3. Monitoring User Activity

Track specific users:

1. Go to **"Audit Logs"**
2. Note: Current version shows all logs
3. Future: Filter by specific user ID

**Compliance**: All logs are immutable (stored on blockchain).

---

## Security & Privacy

### How Your Data is Protected

#### 1. **Encryption**

```
Your File (PDF)
    ↓
AES-256 Encryption (Military-grade)
    ↓
Encrypted Blob (Unreadable)
    ↓
Stored on IPFS
```

**Key Points**:
- Encryption happens **before** upload
- Only you have the decryption key
- Even system administrators **cannot** read your files

---

#### 2. **Blockchain Security**

- All permissions logged on **Hyperledger Fabric**
- **Immutable**: Cannot be changed or deleted
- **Transparent**: Complete audit trail
- **Distributed**: No single point of failure

---

#### 3. **Access Control**

**Three-Layer Security**:

1. **Authentication**: Login with user ID & password
2. **Role-Based Access**: Patients/Doctors/Admins have different permissions
3. **Consent Management**: Patients explicitly control access

**Result**: Zero-trust architecture - trust is not assumed, must be verified.

---

### Privacy Features

✅ **Patient-Controlled**: You decide who sees what  
✅ **Time-Limited**: All consents have expiration dates  
✅ **Revocable**: Withdraw permission anytime  
✅ **Auditable**: See every access attempt  
✅ **Encrypted**: Military-grade encryption  

---

## Troubleshooting

### Common Issues

#### 1. "Cannot login"

**Solutions**:
- ✅ Check your user ID and password
- ✅ Ensure CAPS LOCK is off
- ✅ Contact admin if account is locked
- ✅ Try refreshing the page (F5)

---

#### 2. "File upload failed"

**Check**:
- File size < 10 MB?
- File type: PDF, JPG, or PNG?
- Internet connection stable?
- Browser: Chrome, Firefox, Edge (Safari not fully tested)

**If still failing**:
1. Try a smaller file
2. Clear browser cache
3. Try different browser
4. Contact system administrator

---

#### 3. "Consent not working"

**Verify**:
- Doctor ID is correct (case-sensitive)
- Consent hasn't expired
- You're logged in as patient (not doctor)

**To fix**:
1. Revoke old consent
2. Grant new consent with correct ID

---

#### 4. "Page is blank/white screen"

**Solutions**:
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache
3. Disable browser extensions
4. Try incognito/private mode
5. Check if backend is running (contact admin)

---

#### 5. "Download not working"

**Possible causes**:
- No active consent
- Consent expired
- File not found on IPFS

**Fix**:
1. Ask patient to grant new consent
2. Check consent expiry date
3. Contact administrator if persistent

---

## FAQ

### General Questions

**Q: Is my data safe?**  
A: Yes. All files are encrypted with AES-256 before storage. Even if someone hacks the database, they cannot read your files without the encryption key.

**Q: Can the system administrator see my medical records?**  
A: No. Administrators can see metadata (who uploaded what, when) but cannot decrypt or view your actual medical files.

**Q: What happens if I lose my password?**  
A: Contact your system administrator for password reset. Your encrypted files remain safe.

**Q: Can I delete a record?**  
A: Currently, no. Records are immutable for compliance (HIPAA). Future versions may add "hide" functionality.

**Q: Is this HIPAA compliant?**  
A: The system is designed with HIPAA requirements in mind (encryption, audit logs, access control). Full compliance requires proper deployment and organizational policies.

---

### Technical Questions

**Q: What is IPFS?**  
A: InterPlanetary File System - a distributed file storage system. Your files are stored across multiple nodes, not on a single server.

**Q: What is Hyperledger Fabric?**  
A: An enterprise blockchain platform. It stores the "ledger" of who accessed what and when - this cannot be changed or deleted.

**Q: Why can't I access records immediately after consent?**  
A: Blockchain transactions take a few seconds to process. Wait 5-10 seconds and refresh.

**Q: Can I use mobile?**  
A: Yes, the interface is responsive. Works on phones and tablets through the web browser.

**Q: Do I need to install anything?**  
A: No. It's a web application - just use your browser.

---

### Medical Questions

**Q: What types of medical records should I upload?**  
A: Any medical documents:
- Lab reports
- X-rays, MRI scans
- Prescriptions
- Doctor's notes
- Vaccine records
- Surgical reports

**Q: How long are records stored?**  
A: Indefinitely. IPFS provides long-term storage.

**Q: Can I share with multiple doctors?**  
A: Yes. Grant separate consent to each doctor.

**Q: What if I want different doctors to see different records?**  
A: When granting consent, specify the **Record ID** instead of leaving it blank (which grants access to all records).

---

## Getting Help

### Support Contact

- **Technical Issues**: Contact your system administrator
- **Account Issues**: Email: support@your-hospital.com
- **Emergency**: Do not use this system for emergencies - call 911

###Resources

- **Deployment Guide**: `/DEPLOYMENT_GUIDE.md`
- **API Documentation**: `/backend/README.md`
- **System Architecture**: `/fabric-network/README.md`

---

## Glossary

**AES-256**: Advanced Encryption Standard with 256-bit keys. Military-grade encryption.

**Blockchain**: Distributed ledger technology. Immutable record of transactions.

**Chaincode**: Smart contracts on Hyperledger Fabric. Business logic for the blockchain.

**Consent**: Permission granted by patient to doctor to access specific records.

**CouchDB**: Database used to store blockchain state.

**Encryption**: Process of converting data into unreadable format.

**HIPAA**: Health Insurance Portability and Accountability Act. US healthcare privacy law.

**IPFS**: InterPlanetary File System. Distributed file storage.

**Metadata**: Data about data (e.g., file size, upload time) - NOT the actual medical content.

**MSP**: Membership Service Provider. Manages identities in Fabric.

**Peer**: Node in the blockchain network that validates transactions.

**RSA**: Asymmetric encryption algorithm used for key exchange.

**SHA-256**: Secure hashing algorithm. Creates unique "fingerprint" of files.

---

## Appendix: Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Refresh page | Ctrl + R | Cmd + R |
| Hard refresh | Ctrl + Shift + R | Cmd + Shift + R |
| Open dev tools | F12 | Cmd + Option + I |
| Zoom in | Ctrl + Plus | Cmd + Plus |
| Zoom out | Ctrl + Minus | Cmd + Minus |
| Reset zoom | Ctrl + 0 | Cmd + 0 |

---

## Version Information

- **User Manual Version**: 1.0
- **System Version**: 1.0.0
- **Last Updated**: January 27, 2024

---

**Thank you for using the EHR Blockchain System!**  
Your health, your data, your control. 🔐
