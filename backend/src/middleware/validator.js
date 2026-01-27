const Joi = require('joi');

/**
 * Validation middleware factory
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const details = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                details
            });
        }

        req.body = value;
        next();
    };
};

/**
 * Validation schemas
 */
const schemas = {
    // Authentication
    login: Joi.object({
        userId: Joi.string().required(),
        password: Joi.string().min(8).required()
    }),

    register: Joi.object({
        userId: Joi.string().alphanum().min(3).max(30).required(),
        password: Joi.string().min(8).required(),
        role: Joi.string().valid('patient', 'doctor', 'admin').required(),
        name: Joi.string().required(),
        email: Joi.string().email().required()
    }),

    // EHR creation
    createEHR: Joi.object({
        recordType: Joi.string().required(),
        patientId: Joi.string().required()
    }),

    // Consent management
    grantConsent: Joi.object({
        doctorId: Joi.string().required(),
        recordId: Joi.string().optional().allow(''),
        expiryDays: Joi.number().integer().min(1).max(365).default(30)
    }),

    revokeConsent: Joi.object({
        consentId: Joi.string().required()
    }),

    // Query params
    queryEHR: Joi.object({
        recordId: Joi.string().required()
    }),

    queryConsents: Joi.object({
        patientId: Joi.string().optional(),
        doctorId: Joi.string().optional()
    })
};

module.exports = { validate, schemas };
