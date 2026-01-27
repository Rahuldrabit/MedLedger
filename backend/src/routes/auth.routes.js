const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { validate, schemas } = require('../middleware/validator');
const logger = require('../utils/logger');

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', validate(schemas.login), async (req, res, next) => {
    try {
        const { userId, password } = req.body;

        // TODO: Implement proper user authentication
        // For demo, accept any userId/password combination
        // In production, verify against Fabric CA or separate user database

        // Mock role assignment based on userId prefix
        let role = 'patient';
        if (userId.startsWith('doctor')) role = 'doctor';
        if (userId.startsWith('admin')) role = 'admin';

        // Generate JWT token
        const token = jwt.sign(
            {
                userId,
                role,
                orgMSP: process.env.ORG_MSP_ID || 'HospitalMSP'
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRATION || '24h'
            }
        );

        logger.info(`User logged in: ${userId} (${role})`);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    userId,
                    role
                }
            }
        });
    } catch (error) {
        logger.error('Login error:', error);
        next(error);
    }
});

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (creates identity in wallet)
 * @access  Public
 */
router.post('/register', validate(schemas.register), async (req, res, next) => {
    try {
        const { userId, password, role, name, email } = req.body;

        // TODO: Implement user registration
        // 1. Hash password
        // 2. Store user info in database
        // 3. Enroll user with Fabric CA
        // 4. Add identity to wallet

        // For demo purposes
        logger.info(`User registration request: ${userId} (${role})`);

        res.status(201).json({
            success: true,
            message: 'User registration successful. Please contact admin for identity enrollment.',
            data: {
                userId,
                role,
                name,
                email
            }
        });
    } catch (error) {
        logger.error('Registration error:', error);
        next(error);
    }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify old token
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            ignoreExpiration: true // Allow expired tokens for refresh
        });

        // Generate new token
        const newToken = jwt.sign(
            {
                userId: decoded.userId,
                role: decoded.role,
                orgMSP: decoded.orgMSP
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRATION || '24h'
            }
        );

        res.json({
            success: true,
            message: 'Token refreshed',
            data: {
                token: newToken
            }
        });
    } catch (error) {
        logger.error('Token refresh error:', error);
        next(error);
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Public
 */
router.post('/logout', (req, res) => {
    // Since JWT is stateless, logout is handled client-side
    // For enhanced security, could implement token blacklist

    res.json({
        success: true,
        message: 'Logout successful'
    });
});

module.exports = router;
