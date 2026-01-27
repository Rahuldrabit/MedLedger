const crypto = require('crypto');
const forge = require('node-forge');
const logger = require('./logger');

/**
 * AES-256-GCM Encryption
 */
class AESCipher {
    /**
     * Generate random AES-256 key
     */
    static generateKey() {
        return crypto.randomBytes(32); // 256 bits
    }

    /**
     * Encrypt data with AES-256-GCM
     * @param {Buffer} data - Data to encrypt
     * @param {Buffer} key - 256-bit key
     * @returns {Object} - {ciphertext, iv, authTag}
     */
    static encrypt(data, key) {
        try {
            const iv = crypto.randomBytes(12); // 96 bits for GCM
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

            let ciphertext = cipher.update(data);
            ciphertext = Buffer.concat([ciphertext, cipher.final()]);

            const authTag = cipher.getAuthTag();

            return {
                ciphertext,
                iv,
                authTag
            };
        } catch (error) {
            logger.error('AES encryption error:', error);
            throw error;
        }
    }

    /**
     * Decrypt data with AES-256-GCM
     * @param {Buffer} ciphertext - Encrypted data
     * @param {Buffer} key - 256-bit key
     * @param {Buffer} iv - Initialization vector
     * @param {Buffer} authTag - Authentication tag
     * @returns {Buffer} - Decrypted data
     */
    static decrypt(ciphertext, key, iv, authTag) {
        try {
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);

            let data = decipher.update(ciphertext);
            data = Buffer.concat([data, decipher.final()]);

            return data;
        } catch (error) {
            logger.error('AES decryption error:', error);
            throw error;
        }
    }

    /**
     * Encrypt file buffer
     */
    static encryptFile(fileBuffer, key) {
        return this.encrypt(fileBuffer, key);
    }

    /**
     * Decrypt file buffer
     */
    static decryptFile(ciphertext, key, iv, authTag) {
        return this.decrypt(ciphertext, key, iv, authTag);
    }
}

/**
 * RSA Encryption for key exchange
 */
class RSACipher {
    /**
     * Generate RSA key pair
     * @param {number} keySize - Key size in bits (default 2048)
     * @returns {Object} - {privateKey, publicKey} in PEM format
     */
    static generateKeyPair(keySize = 2048) {
        try {
            const keypair = forge.pki.rsa.generateKeyPair({ bits: keySize });

            const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
            const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);

            return {
                privateKey: privateKeyPem,
                publicKey: publicKeyPem
            };
        } catch (error) {
            logger.error('RSA key generation error:', error);
            throw error;
        }
    }

    /**
     * Encrypt data with RSA public key
     * @param {Buffer} data - Data to encrypt (max 190 bytes for 2048-bit key)
     * @param {string} publicKeyPem - Public key in PEM format
     * @returns {Buffer} - Encrypted data
     */
    static encrypt(data, publicKeyPem) {
        try {
            const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
            const encrypted = publicKey.encrypt(data.toString('binary'), 'RSA-OAEP', {
                md: forge.md.sha256.create()
            });

            return Buffer.from(encrypted, 'binary');
        } catch (error) {
            logger.error('RSA encryption error:', error);
            throw error;
        }
    }

    /**
     * Decrypt data with RSA private key
     * @param {Buffer} ciphertext - Encrypted data
     * @param {string} privateKeyPem - Private key in PEM format
     * @returns {Buffer} - Decrypted data
     */
    static decrypt(ciphertext, privateKeyPem) {
        try {
            const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
            const decrypted = privateKey.decrypt(ciphertext.toString('binary'), 'RSA-OAEP', {
                md: forge.md.sha256.create()
            });

            return Buffer.from(decrypted, 'binary');
        } catch (error) {
            logger.error('RSA decryption error:', error);
            throw error;
        }
    }
}

/**
 * Hashing utilities
 */
class Hash {
    /**
     * SHA-256 hash
     */
    static sha256(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Calculate file checksum
     */
    static fileChecksum(fileBuffer) {
        return this.sha256(fileBuffer);
    }
}

/**
 * Complete encryption workflow for EHR files
 */
class EHREncryption {
    /**
     * Encrypt EHR file for storage
     * @param {Buffer} fileBuffer - File to encrypt
     * @param {string} patientPublicKey - Patient's RSA public key (PEM)
     * @returns {Object} - Encrypted file data and metadata
     */
    static encryptForStorage(fileBuffer, patientPublicKey) {
        try {
            // Generate random AES key
            const aesKey = AESCipher.generateKey();

            // Encrypt file with AES
            const { ciphertext, iv, authTag } = AESCipher.encryptFile(fileBuffer, aesKey);

            // Encrypt AES key with patient's RSA public key
            const encryptedKey = RSACipher.encrypt(aesKey, patientPublicKey);

            // Calculate checksum of original file
            const checksum = Hash.fileChecksum(fileBuffer);

            return {
                encryptedFile: ciphertext,
                encryptedKey: encryptedKey.toString('base64'),
                iv: iv.toString('base64'),
                authTag: authTag.toString('base64'),
                checksum
            };
        } catch (error) {
            logger.error('EHR encryption error:', error);
            throw error;
        }
    }

    /**
     * Decrypt EHR file
     * @param {Buffer} encryptedFile - Encrypted file
     * @param {string} encryptedKeyBase64 - Encrypted AES key (base64)
     * @param {string} ivBase64 - IV (base64)
     * @param {string} authTagBase64 - Auth tag (base64)
     * @param {string} privateKeyPem - Private key for decryption (PEM)
     * @returns {Buffer} - Decrypted file
     */
    static decryptFile(encryptedFile, encryptedKeyBase64, ivBase64, authTagBase64, privateKeyPem) {
        try {
            // Decrypt AES key with private key
            const encryptedKey = Buffer.from(encryptedKeyBase64, 'base64');
            const aesKey = RSACipher.decrypt(encryptedKey, privateKeyPem);

            // Decrypt file with AES key
            const iv = Buffer.from(ivBase64, 'base64');
            const authTag = Buffer.from(authTagBase64, 'base64');

            const decryptedFile = AESCipher.decryptFile(encryptedFile, aesKey, iv, authTag);

            return decryptedFile;
        } catch (error) {
            logger.error('EHR decryption error:', error);
            throw error;
        }
    }
}

module.exports = {
    AESCipher,
    RSACipher,
    Hash,
    EHREncryption
};
