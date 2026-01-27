const logger = require('../utils/logger');

/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';

    // Fabric errors
    if (err.message && err.message.includes('ENDORSEMENT_POLICY_FAILURE')) {
        statusCode = 403;
        message = 'Transaction endorsement failed. Check your permissions.';
    }

    if (err.message && err.message.includes('MVCC_READ_CONFLICT')) {
        statusCode = 409;
        message = 'Concurrency conflict. Please retry.';
    }

    // IPFS errors
    if (err.message && err.message.includes('IPFS')) {
        statusCode = 503;
        message = 'IPFS service unavailable';
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.details || err.message;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    // Multer errors (file upload)
    if (err.name === 'MulterError') {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File too large';
        } else {
            message = err.message;
        }
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
