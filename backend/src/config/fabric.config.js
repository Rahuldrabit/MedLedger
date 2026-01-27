const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class FabricConfig {
    constructor() {
        this.channelName = process.env.CHANNEL_NAME || 'ehr-channel';
        this.chaincodeName = process.env.CHAINCODE_NAME || 'ehr-contract';
        this.walletPath = path.join(__dirname, '..', '..', process.env.WALLET_PATH || 'wallet');
        this.orgMSPID = process.env.ORG_MSP_ID || 'HospitalMSP';
    }

    /**
     * Load connection profile
     */
    loadConnectionProfile() {
        try {
            const ccpPath = path.resolve(
                __dirname,
                '..',
                '..',
                '..',
                'fabric-network',
                'connection-profile.json'
            );

            if (!fs.existsSync(ccpPath)) {
                throw new Error(`Connection profile not found at ${ccpPath}`);
            }

            const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
            return JSON.parse(ccpJSON);
        } catch (error) {
            logger.error('Error loading connection profile:', error);
            throw error;
        }
    }

    /**
     * Get or create wallet
     */
    async getWallet() {
        try {
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);
            logger.info(`Wallet path: ${this.walletPath}`);
            return wallet;
        } catch (error) {
            logger.error('Error creating wallet:', error);
            throw error;
        }
    }

    /**
     * Connect to Fabric network
     * @param {string} userId - User identity
     * @returns {Object} - Contract instance
     */
    async connectToNetwork(userId) {
        try {
            // Load connection profile
            const ccp = this.loadConnectionProfile();

            // Create gateway
            const gateway = new Gateway();

            // Get wallet
            const wallet = await this.getWallet();

            // Check if user identity exists
            const identity = await wallet.get(userId);
            if (!identity) {
                throw new Error(`Identity ${userId} does not exist in wallet`);
            }

            // Connect to gateway
            await gateway.connect(ccp, {
                wallet,
                identity: userId,
                discovery: { enabled: true, asLocalhost: true }
            });

            logger.info(`Connected to Fabric gateway as ${userId}`);

            // Get network and contract
            const network = await gateway.getNetwork(this.channelName);
            const contract = network.getContract(this.chaincodeName);

            return { gateway, network, contract };
        } catch (error) {
            logger.error('Error connecting to network:', error);
            throw error;
        }
    }

    /**
     * Disconnect from network
     * @param {Gateway} gateway - Gateway instance
     */
    async disconnect(gateway) {
        try {
            if (gateway) {
                await gateway.disconnect();
                logger.info('Disconnected from Fabric gateway');
            }
        } catch (error) {
            logger.error('Error disconnecting from network:', error);
        }
    }

    /**
     * Invoke chaincode transaction
     * @param {string} userId - User identity
     * @param {string} functionName - Chaincode function
     * @param {Array} args - Function arguments
     * @returns {Object} - Transaction result
     */
    async invokeTransaction(userId, functionName, ...args) {
        let gateway;
        try {
            const { gateway: gw, contract } = await this.connectToNetwork(userId);
            gateway = gw;

            logger.info(`Invoking ${functionName} with args:`, args);

            const result = await contract.submitTransaction(functionName, ...args);
            const response = result.toString();

            logger.info(`Transaction ${functionName} successful`);

            return response ? JSON.parse(response) : null;
        } catch (error) {
            logger.error(`Error invoking ${functionName}:`, error);
            throw error;
        } finally {
            if (gateway) {
                await this.disconnect(gateway);
            }
        }
    }

    /**
     * Query chaincode (read-only)
     * @param {string} userId - User identity
     * @param {string} functionName - Chaincode function
     * @param {Array} args - Function arguments
     * @returns {Object} - Query result
     */
    async queryChaincode(userId, functionName, ...args) {
        let gateway;
        try {
            const { gateway: gw, contract } = await this.connectToNetwork(userId);
            gateway = gw;

            logger.info(`Querying ${functionName} with args:`, args);

            const result = await contract.evaluateTransaction(functionName, ...args);
            const response = result.toString();

            logger.info(`Query ${functionName} successful`);

            return response ? JSON.parse(response) : null;
        } catch (error) {
            logger.error(`Error querying ${functionName}:`, error);
            throw error;
        } finally {
            if (gateway) {
                await this.disconnect(gateway);
            }
        }
    }
}

module.exports = new FabricConfig();
