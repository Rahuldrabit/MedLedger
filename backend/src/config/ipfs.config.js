const logger = require('../utils/logger');

class IPFSConfig {
    constructor() {
        this.client = null;
        this.fs = null;
        this.host = process.env.IPFS_HOST || '127.0.0.1';
        this.port = process.env.IPFS_PORT || 5001;
        this.protocol = process.env.IPFS_PROTOCOL || 'http';
        this.apiUrl = `${this.protocol}://${this.host}:${this.port}/api/v0`;
    }

    /**
     * Get IPFS client instance
     */
    async getClient() {
        if (!this.client) {
            // For HTTP client, we'll use fetch-based approach
            logger.info(`IPFS client configured for ${this.protocol}://${this.host}:${this.port}`);
            this.client = true; // Mark as initialized
        }
        return this.client;
    }

    /**
     * Add file to IPFS
     * @param {Buffer} fileBuffer - File content
     * @param {Object} options - IPFS add options
     * @returns {string} - IPFS hash (CID)
     */
    async addFile(fileBuffer, options = {}) {
        try {
            await this.getClient();
            
            const FormData = require('form-data');
            const form = new FormData();
            form.append('file', fileBuffer);

            const response = await fetch(`${this.apiUrl}/add?pin=true`, {
                method: 'POST',
                body: form
            });

            const result = await response.json();
            logger.info(`File added to IPFS: ${result.Hash}`);
            return result.Hash; // CID
        } catch (error) {
            logger.error('Error adding file to IPFS:', error);
            throw error;
        }
    }

    /**
     * Get file from IPFS
     * @param {string} cid - IPFS hash
     * @returns {Buffer} - File content
     */
    async getFile(cid) {
        try {
            await this.getClient();

            const response = await fetch(`${this.apiUrl}/cat?arg=${cid}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`Failed to retrieve file: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const fileBuffer = Buffer.from(arrayBuffer);
            logger.info(`File retrieved from IPFS: ${cid}`);
            return fileBuffer;
        } catch (error) {
            logger.error(`Error getting file from IPFS (${cid}):`, error);
            throw error;
        }
    }

    /**
     * Pin file to prevent garbage collection
     * @param {string} cid - IPFS hash
     */
    async pinFile(cid) {
        try {
            await this.getClient();
            
            const response = await fetch(`${this.apiUrl}/pin/add?arg=${cid}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`Failed to pin file: ${response.statusText}`);
            }

            logger.info(`File pinned: ${cid}`);
        } catch (error) {
            logger.error(`Error pinning file (${cid}):`, error);
            throw error;
        }
    }

    /**
     * Unpin file
     * @param {string} cid - IPFS hash
     */
    async unpinFile(cid) {
        try {
            await this.getClient();
            
            const response = await fetch(`${this.apiUrl}/pin/rm?arg=${cid}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`Failed to unpin file: ${response.statusText}`);
            }

            logger.info(`File unpinned: ${cid}`);
        } catch (error) {
            logger.error(`Error unpinning file (${cid}):`, error);
            throw error;
        }
    }

    /**
     * Check IPFS connection
     */
    async checkConnection() {
        try {
            const client = this.getClient();
            const version = await client.version();
            logger.info(`IPFS version: ${version.version}`);
            return true;
        } catch (error) {
            logger.error('IPFS connection failed:', error);
            return false;
        }
    }
}

module.exports = new IPFSConfig();
