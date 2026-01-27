const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const fabricConfig = require('../config/fabric.config');
const ipfsConfig = require('../config/ipfs.config');
const { EHREncryption } = require('../utils/encryption');
const { verifyToken, requireDoctor } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   GET /api/doctor/patients
 * @desc    Get all patients who granted access to doctor
 * @access  Private (Doctor only)
 */
router.get('/patients', verifyToken, requireDoctor, async (req, res, next) => {
    try {
        const doctorId = req.user.userId;

        // Query all consents for doctor
        const consents = await fabricConfig.queryChaincode(
            doctorId,
            'QueryConsentsByDoctor',
            doctorId
        );

        // Extract unique patient IDs
        const patients = [];
        const patientIds = new Set();

        if (consents && Array.isArray(consents)) {
            consents.forEach((consent) => {
                if (!patientIds.has(consent.patientId)) {
                    patientIds.add(consent.patientId);
                    patients.push({
                        patientId: consent.patientId,
                        consentGranted: consent.timestamp,
                        expiresAt: consent.expiryDate
                    });
                }
            });
        }

        res.json({
            success: true,
            data: patients,
            count: patients.length
        });
    } catch (error) {
        logger.error('Get patients error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/doctor/patient/:patientId/records
 * @desc    Get all accessible records for a patient
 * @access  Private (Doctor with consent)
 */
router.get('/patient/:patientId/records', verifyToken, requireDoctor, async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const doctorId = req.user.userId;

        // Get all patient records
        const allRecords = await fabricConfig.queryChaincode(
            doctorId,
            'QueryEHRsByPatient',
            patientId
        );

        if (!allRecords || allRecords.length === 0) {
            return res.json({
                success: true,
                data: [],
                count: 0
            });
        }

        // Filter records based on consent
        const accessibleRecords = [];

        for (const record of allRecords) {
            // Check if doctor has consent for this specific record or all records
            const hasConsent = await fabricConfig.queryChaincode(
                doctorId,
                'CheckConsent',
                patientId,
                doctorId,
                record.recordId
            );

            if (hasConsent) {
                accessibleRecords.push(record);
            }
        }

        res.json({
            success: true,
            data: accessibleRecords,
            count: accessibleRecords.length
        });
    } catch (error) {
        logger.error('Get patient records error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/doctor/ehr/:recordId
 * @desc    Get EHR metadata (with access check)
 * @access  Private (Doctor with consent)
 */
router.get('/ehr/:recordId', verifyToken, requireDoctor, async (req, res, next) => {
    try {
        const { recordId } = req.params;
        const doctorId = req.user.userId;

        // Get EHR metadata
        const metadata = await fabricConfig.queryChaincode(
            doctorId,
            'QueryEHR',
            recordId
        );

        if (!metadata) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        // Check consent
        const hasConsent = await fabricConfig.queryChaincode(
            doctorId,
            'CheckConsent',
            metadata.patientId,
            doctorId,
            recordId
        );

        if (!hasConsent) {
            return res.status(403).json({
                success: false,
                message: 'No active consent for this record'
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
 * @route   GET /api/doctor/ehr/:recordId/download
 * @desc    Download and decrypt EHR file
 * @access  Private (Doctor with consent)
 */
router.get('/ehr/:recordId/download', verifyToken, requireDoctor, async (req, res, next) => {
    try {
        const { recordId } = req.params;
        const doctorId = req.user.userId;

        // Get EHR metadata
        const metadata = await fabricConfig.queryChaincode(
            doctorId,
            'QueryEHR',
            recordId
        );

        if (!metadata) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        // Check consent
        const hasConsent = await fabricConfig.queryChaincode(
            doctorId,
            'CheckConsent',
            metadata.patientId,
            doctorId,
            recordId
        );

        if (!hasConsent) {
            return res.status(403).json({
                success: false,
                message: 'No active consent for this record'
            });
        }

        // Download encrypted file from IPFS
        logger.info(`Downloading file from IPFS: ${metadata.ipfsHash}`);
        const encryptedFile = await ipfsConfig.getFile(metadata.ipfsHash);

        // For demo: In production, re-encrypt with doctor's public key
        // Here we're just returning the encrypted file
        // The frontend would need the decryption key

        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${recordId}.enc"`,
            'X-Record-Type': metadata.recordType,
            'X-Checksum': metadata.checksum
        });

        res.send(encryptedFile);

        // Log access in audit trail (this happens automatically in chaincode)
    } catch (error) {
        logger.error('Download EHR error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/doctor/audit/my-activities
 * @desc    Get doctor's audit logs
 * @access  Private (Doctor only)
 */
router.get('/audit/my-activities', verifyToken, requireDoctor, async (req, res, next) => {
    try {
        const doctorId = req.user.userId;

        // Query audit logs for doctor
        const logs = await fabricConfig.queryChaincode(
            doctorId,
            'QueryAuditLogsByActor',
            doctorId
        );

        res.json({
            success: true,
            data: logs || [],
            count: logs ? logs.length : 0
        });
    } catch (error) {
        logger.error('Get doctor audit logs error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/doctor/consent/active
 * @desc    Get all active consents for doctor
 * @access  Private (Doctor only)
 */
router.get('/consent/active', verifyToken, requireDoctor, async (req, res, next) => {
    try {
        const doctorId = req.user.userId;

        // Query all consents
        const consents = await fabricConfig.queryChaincode(
            doctorId,
            'QueryConsentsByDoctor',
            doctorId
        );

        res.json({
            success: true,
            data: consents || [],
            count: consents ? consents.length : 0
        });
    } catch (error) {
        logger.error('Get doctor consents error:', error);
        next(error);
    }
});

module.exports = router;
