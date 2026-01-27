const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const fabricConfig = require('../config/fabric.config');
const ipfsConfig = require('../config/ipfs.config');
const { EHREncryption, Hash } = require('../utils/encryption');
const { verifyToken, requirePatient } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
    },
    fileFilter: (req, file, cb) => {
        // Accept common medical file types
        const allowedTypes = /pdf|jpg|jpeg|png|dicom|dcm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type. Allowed: PDF, JPG, PNG, DICOM'));
    }
});

/**
 * @route   POST /api/patient/ehr/upload
 * @desc    Upload and encrypt EHR file
 * @access  Private (Patient only)
 */
router.post('/ehr/upload', verifyToken, requirePatient, upload.single('file'), async (req, res, next) => {
    try {
        const { recordType } = req.body;
        const patientId = req.user.userId;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Read uploaded file
        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);

        // For demo: generate patient's RSA key pair (in production, use stored keys)
        const { RSACipher } = require('../utils/encryption');
        const { publicKey } = RSACipher.generateKeyPair();

        // Encrypt file
        logger.info(`Encrypting file for patient ${patientId}`);
        const { encryptedFile, encryptedKey, iv, authTag, checksum } =
            EHREncryption.encryptForStorage(fileBuffer, publicKey);

        // Upload encrypted file to IPFS
        logger.info('Uploading encrypted file to IPFS');
        const ipfsHash = await ipfsConfig.addFile(encryptedFile);

        // Generate unique record ID
        const recordId = `EHR-${uuidv4()}`;

        // Store metadata on blockchain
        logger.info('Storing metadata on blockchain');
        await fabricConfig.invokeTransaction(
            patientId,
            'CreateEHRMetadata',
            recordId,
            patientId,
            ipfsHash,
            encryptedKey,
            recordType || req.file.originalname,
            checksum
        );

        // Delete temporary file
        fs.unlinkSync(filePath);

        res.status(201).json({
            success: true,
            message: 'EHR uploaded successfully',
            data: {
                recordId,
                ipfsHash,
                recordType: recordType || req.file.originalname,
                checksum,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Upload EHR error:', error);
        // Clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        next(error);
    }
});

/**
 * @route   GET /api/patient/ehr/:recordId
 * @desc    Get EHR metadata
 * @access  Private (Patient only -own records)
 */
router.get('/ehr/:recordId', verifyToken, requirePatient, async (req, res, next) => {
    try {
        const { recordId } = req.params;
        const patientId = req.user.userId;

        // Query blockchain for metadata
        const metadata = await fabricConfig.queryChaincode(
            patientId,
            'QueryEHR',
            recordId
        );

        if (!metadata) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        // Verify patient owns this record
        if (metadata.patientId !== patientId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: metadata
        });
    } catch (error) {
        logger.error('Get EHR error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/patient/ehr
 * @desc    Get all patient's EHR records
 * @access  Private (Patient only)
 */
router.get('/ehr', verifyToken, requirePatient, async (req, res, next) => {
    try {
        const patientId = req.user.userId;

        // Query all records for patient
        const records = await fabricConfig.queryChaincode(
            patientId,
            'QueryEHRsByPatient',
            patientId
        );

        res.json({
            success: true,
            data: records || [],
            count: records ? records.length : 0
        });
    } catch (error) {
        logger.error('Get patient EHRs error:', error);
        next(error);
    }
});

/**
 * @route   POST /api/patient/consent/grant
 * @desc    Grant doctor access to records
 * @access  Private (Patient only)
 */
router.post('/consent/grant', verifyToken, requirePatient, validate(schemas.grantConsent), async (req, res, next) => {
    try {
        const { doctorId, recordId, expiryDays } = req.body;
        const patientId = req.user.userId;

        // Generate consent ID
        const consentId = `${patientId}-${doctorId}-${recordId || '*'}`;

        // Grant consent on blockchain
        await fabricConfig.invokeTransaction(
            patientId,
            'GrantConsent',
            consentId,
            patientId,
            doctorId,
            recordId || '*',
            expiryDays.toString()
        );

        res.status(201).json({
            success: true,
            message: 'Consent granted successfully',
            data: {
                consentId,
                patientId,
                doctorId,
                recordId: recordId || 'All records',
                expiryDays
            }
        });
    } catch (error) {
        logger.error('Grant consent error:', error);
        next(error);
    }
});

/**
 * @route   DELETE /api/patient/consent/:consentId
 * @desc    Revoke consent
 * @access  Private (Patient only)
 */
router.delete('/consent/:consentId', verifyToken, requirePatient, async (req, res, next) => {
    try {
        const { consentId } = req.params;
        const patientId = req.user.userId;

        // Revoke consent on blockchain
        await fabricConfig.invokeTransaction(
            patientId,
            'RevokeConsent',
            consentId
        );

        res.json({
            success: true,
            message: 'Consent revoked successfully'
        });
    } catch (error) {
        logger.error('Revoke consent error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/patient/consent
 * @desc    Get all consents granted by patient
 * @access  Private (Patient only)
 */
router.get('/consent', verifyToken, requirePatient, async (req, res, next) => {
    try {
        const patientId = req.user.userId;

        // Query all consents
        const consents = await fabricConfig.queryChaincode(
            patientId,
            'QueryConsentsByPatient',
            patientId
        );

        res.json({
            success: true,
            data: consents || [],
            count: consents ? consents.length : 0
        });
    } catch (error) {
        logger.error('Get patient consents error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/patient/audit/:recordId
 * @desc    Get audit logs for a record
 * @access  Private (Patient only)
 */
router.get('/audit/:recordId', verifyToken, requirePatient, async (req, res, next) => {
    try {
        const { recordId } = req.params;
        const patientId = req.user.userId;

        // Query audit logs
        const logs = await fabricConfig.queryChaincode(
            patientId,
            'QueryAuditLogsByRecord',
            recordId
        );

        res.json({
            success: true,
            data: logs || [],
            count: logs ? logs.length : 0
        });
    } catch (error) {
        logger.error('Get audit logs error:', error);
        next(error);
    }
});

module.exports = router;
