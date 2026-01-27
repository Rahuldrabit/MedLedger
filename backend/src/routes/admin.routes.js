const express = require('express');
const router = express.Router();

const fabricConfig = require('../config/fabric.config');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   GET /api/admin/audit/all
 * @desc    Get all audit logs
 * @access  Private (Admin only)
 */
router.get('/audit/all', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const adminId = req.user.userId;

        // Query all audit logs
        const logs = await fabricConfig.queryChaincode(
            adminId,
            'GetAllAuditLogs'
        );

        res.json({
            success: true,
            data: logs || [],
            count: logs ? logs.length : 0
        });
    } catch (error) {
        logger.error('Get all audit logs error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/admin/audit/action/:action
 * @desc    Get audit logs by action type
 * @access  Private (Admin only)
 */
router.get('/audit/action/:action', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const { action } = req.params;
        const adminId = req.user.userId;

        // Query logs by action
        const logs = await fabricConfig.queryChaincode(
            adminId,
            'QueryAuditLogsByAction',
            action
        );

        res.json({
            success: true,
            data: logs || [],
            count: logs ? logs.length : 0,
            action
        });
    } catch (error) {
        logger.error('Get audit logs by action error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/admin/audit/user/:userId
 * @desc    Get audit logs for specific user
 * @access  Private (Admin only)
 */
router.get('/audit/user/:userId', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const adminId = req.user.userId;

        // Query logs by actor
        const logs = await fabricConfig.queryChaincode(
            adminId,
            'QueryAuditLogsByActor',
            userId
        );

        res.json({
            success: true,
            data: logs || [],
            count: logs ? logs.length : 0,
            userId
        });
    } catch (error) {
        logger.error('Get user audit logs error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/admin/audit/record/:recordId
 * @desc    Get all access logs for a record
 * @access  Private (Admin only)
 */
router.get('/audit/record/:recordId', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const { recordId } = req.params;
        const adminId = req.user.userId;

        // Query logs by record
        const logs = await fabricConfig.queryChaincode(
            adminId,
            'QueryAuditLogsByRecord',
            recordId
        );

        res.json({
            success: true,
            data: logs || [],
            count: logs ? logs.length : 0,
            recordId
        });
    } catch (error) {
        logger.error('Get record audit logs error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics
 * @access  Private (Admin only)
 */
router.get('/stats', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const adminId = req.user.userId;

        // Get all audit logs to calculate stats
        const logs = await fabricConfig.queryChaincode(
            adminId,
            'GetAllAuditLogs'
        );

        // Calculate statistics
        const stats = {
            totalActions: logs ? logs.length : 0,
            actionBreakdown: {},
            roleBreakdown: {},
            successRate: 0
        };

        if (logs && logs.length > 0) {
            let successCount = 0;

            logs.forEach((log) => {
                // Count actions
                stats.actionBreakdown[log.action] = (stats.actionBreakdown[log.action] || 0) + 1;

                // Count roles
                stats.roleBreakdown[log.actorRole] = (stats.roleBreakdown[log.actorRole] || 0) + 1;

                // Count successes
                if (log.success) successCount++;
            });

            stats.successRate = ((successCount / logs.length) * 100).toFixed(2);
        }

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Get stats error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/admin/consents/all
 * @desc    Get all consent records (for compliance)
 * @access  Private (Admin only)
 */
router.get('/consents/all', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        const adminId = req.user.userId;

        // Note: This would require a new chaincode function to get all consents
        // For now, return message
        res.json({
            success: true,
            message: 'This endpoint requires additional chaincode implementation',
            data: []
        });
    } catch (error) {
        logger.error('Get all consents error:', error);
        next(error);
    }
});

/**
 * @route   GET /api/admin/patients/count
 * @desc    Get total patient count
 * @access  Private (Admin only)
 */
router.get('/patients/count', verifyToken, requireAdmin, async (req, res, next) => {
    try {
        // This would require wallet or separate user management system
        res.json({
            success: true,
            message: 'User management to be implemented',
            count: 0
        });
    } catch (error) {
        logger.error('Get patient count error:', error);
        next(error);
    }
});

module.exports = router;
