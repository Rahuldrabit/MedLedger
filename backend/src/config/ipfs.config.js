const { create } = require('ipfs-http-client');
const logger = require('../utils/logger');

class IPFSConfig {
    constructor() {
        this.client = null;
        this.host = process.env.IPFS_HOST || '127.0.0.1';
        this.port = process.env.IPFS_PORT || 5001;
        this.protocol = process.env.IPFS_PROTOCOL || 'http';
    }

    /**
     * Get IPFS client instance
     */
    getClient() {
        if (!this.client) {
            this.client = create({
                host: this.host,
                port: this.port,
                protocol: this.protocol
            });
            logger.info(`IPFS client connected to ${this.protocol}://${this.host}:${this.port}`);
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
            const client = this.getClient();
            const result = await client.add(fileBuffer, {
                pin: true,
                ...options
            });

            logger.info(`File added to IPFS: ${result.path}`);
            return result.path; // CID
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
            const client = this.getClient();
            const chunks = [];

            for await (const chunk of client.cat(cid)) {
                chunks.push(chunk);
            }

            const fileBuffer = Buffer.concat(chunks);
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
            const client = this.getClient();
            await client.pin.add(cid);
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
            const client = this.getClient();
            await client.pin.rm(cid);
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
