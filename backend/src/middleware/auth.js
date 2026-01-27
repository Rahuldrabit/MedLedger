const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Verify JWT token
 */
const verifyToken = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add user info to request
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            orgMSP: decoded.orgMSP
        };

        next();
    } catch (error) {
        logger.error('Token verification error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

/**
 * Check if user has required role
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires one of: ${roles.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Patient-only access
 */
const requirePatient = requireRole('patient');

/**
 * Doctor-only access
 */
const requireDoctor = requireRole('doctor');

/**
 * Admin-only access
 */
const requireAdmin = requireRole('admin');

/**
 * Patient or Admin access
 */
const requirePatientOrAdmin = requireRole('patient', 'admin');

/**
 * Doctor or Admin access
 */
const requireDoctorOrAdmin = requireRole('doctor', 'admin');

module.exports = {
    verifyToken,
    requireRole,
    requirePatient,
    requireDoctor,
    requireAdmin,
    requirePatientOrAdmin,
    requireDoctorOrAdmin
};
