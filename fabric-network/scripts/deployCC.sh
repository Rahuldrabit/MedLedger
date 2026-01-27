#!/bin/bash
#
# Deploy chaincode to the network
#

CHANNEL_NAME="$1"
CC_NAME="ehr-contract"
CC_SRC_PATH="../chaincode/ehr"
CC_VERSION="1.0"
CC_SEQUENCE=1
CC_INIT_FCN="Init"
CC_END_POLICY="OR('HospitalMSP.peer','PatientMSP.peer')"
CC_COLL_CONFIG=""
DELAY=3
MAX_RETRY=5

: ${CHANNEL_NAME:="ehr-channel"}

FABRIC_CFG_PATH=${PWD}
ORDERER_CA=${PWD}/crypto-config/ordererOrganizations/orderer.ehr.com/orderers/orderer.orderer.ehr.com/msp/tlscacerts/tlsca.orderer.ehr.com-cert.pem

. scripts/utils.sh

# Package chaincode
function packageChaincode() {
  infoln "Packaging chaincode..."
  
  setGlobals hospital 0
  
  peer lifecycle chaincode package ${CC_NAME}.tar.gz \
    --path ${CC_SRC_PATH} \
    --lang golang \
    --label ${CC_NAME}_${CC_VERSION}
  
  verifyResult $? "Chaincode packaging failed"
  successln "Chaincode packaged: ${CC_NAME}.tar.gz"
}

# Install chaincode on peer
function installChaincode() {
  ORG=$1
  PEER=$2
  setGlobals $ORG $PEER
  
  infoln "Installing chaincode on peer${PEER}.${ORG}..."
  
  peer lifecycle chaincode install ${CC_NAME}.tar.gz
  verifyResult $? "Chaincode installation failed on peer${PEER}.${ORG}"
  successln "Chaincode installed on peer${PEER}.${ORG}"
}

# Query installed chaincode to get package ID
function queryInstalled() {
  ORG=$1
  PEER=$2
  setGlobals $ORG $PEER
  
  peer lifecycle chaincode queryinstalled >&log.txt
  PACKAGE_ID=$(sed -n "/${CC_NAME}_${CC_VERSION}/{s/^Package ID: //; s/, Label:.*$//; p;}" log.txt)
  
  infoln "Package ID: ${PACKAGE_ID}"
  echo $PACKAGE_ID
}

# Approve chaincode for organization
function approveForMyOrg() {
  ORG=$1
  PEER=$2
  PACKAGE_ID=$3
  setGlobals $ORG $PEER
  
  infoln "Approving chaincode for ${ORG}..."
  
  peer lifecycle chaincode approveformyorg \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.ehr.com \
    --tls --cafile $ORDERER_CA \
    --channelID $CHANNEL_NAME \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --package-id ${PACKAGE_ID} \
    --sequence ${CC_SEQUENCE} \
    --init-required
  
  verifyResult $? "Chaincode approval failed for ${ORG}"
  successln "Chaincode approved for ${ORG}"
}

# Check commit readiness
function checkCommitReadiness() {
  infoln "Checking commit readiness..."
  setGlobals hospital 0
  
  peer lifecycle chaincode checkcommitreadiness \
    --channelID $CHANNEL_NAME \
    --name ${CC_NAME} \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --init-required \
    --output json
}

# Commit chaincode
function commitChaincodeDefinition() {
  infoln "Committing chaincode definition..."
  
  setGlobals hospital 0
  
  peer lifecycle chaincode commit \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.ehr.com \
    --tls --cafile $ORDERER_CA \
    --channelID $CHANNEL_NAME \
    --name ${CC_NAME} \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles ${PWD}/crypto-config/peerOrganizations/hospital.ehr.com/peers/peer0.hospital.ehr.com/tls/ca.crt \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles ${PWD}/crypto-config/peerOrganizations/patient.ehr.com/peers/peer0.patient.ehr.com/tls/ca.crt \
    --version ${CC_VERSION} \
    --sequence ${CC_SEQUENCE} \
    --init-required
  
  verifyResult $? "Chaincode commit failed"
  successln "Chaincode committed to channel"
}

# Query committed chaincode
function queryCommitted() {
  infoln "Querying committed chaincode..."
  setGlobals hospital 0
  
  peer lifecycle chaincode querycommitted \
    --channelID $CHANNEL_NAME \
    --name ${CC_NAME}
}

# Initialize chaincode
function chaincodeInvokeInit() {
  infoln "Initializing chaincode..."
  setGlobals hospital 0
  
  peer chaincode invoke \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.ehr.com \
    --tls --cafile $ORDERER_CA \
    -C $CHANNEL_NAME \
    -n ${CC_NAME} \
    --peerAddresses localhost:7051 \
    --tlsRootCertFiles ${PWD}/crypto-config/peerOrganizations/hospital.ehr.com/peers/peer0.hospital.ehr.com/tls/ca.crt \
    --peerAddresses localhost:9051 \
    --tlsRootCertFiles ${PWD}/crypto-config/peerOrganizations/patient.ehr.com/peers/peer0.patient.ehr.com/tls/ca.crt \
    --isInit \
    -c '{"function":"Init","Args":[]}'
  
  verifyResult $? "Chaincode initialization failed"
  successln "Chaincode initialized"
}

# Main execution
echo "📦 === Chaincode Deployment ==="
echo "Channel: $CHANNEL_NAME"
echo "Chaincode: $CC_NAME"
echo "Version: $CC_VERSION"
echo ""

# Check if chaincode source exists
if [ ! -d "$CC_SRC_PATH" ]; then
  errorln "Chaincode source not found at $CC_SRC_PATH"
  errorln "Please implement the chaincode first"
  exit 1
fi

packageChaincode

# Install on all peers
installChaincode hospital 0
installChaincode hospital 1
installChaincode patient 0
installChaincode patient 1

# Get package ID
PACKAGE_ID=$(queryInstalled hospital 0)

# Approve for both organizations
approveForMyOrg hospital 0 $PACKAGE_ID
approveForMyOrg patient 0 $PACKAGE_ID

# Check commit readiness
checkCommitReadiness

# Commit chaincode
commitChaincodeDefinition

# Query to verify
queryCommitted

# Initialize chaincode
chaincodeInvokeInit

successln "Chaincode deployment completed successfully!"
