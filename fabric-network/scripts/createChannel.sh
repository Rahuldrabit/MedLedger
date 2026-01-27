#!/bin/bash
#
# Create and join channel
#

CHANNEL_NAME="$1"
DELAY="$2"
MAX_RETRY="$3"
VERBOSE="$4"

: ${CHANNEL_NAME:="ehr-channel"}
: ${DELAY:="3"}
: ${MAX_RETRY:="5"}
: ${VERBOSE:="false"}

FABRIC_CFG_PATH=${PWD}
ORDERER_CA=${PWD}/crypto-config/ordererOrganizations/orderer.ehr.com/orderers/orderer.orderer.ehr.com/msp/tlscacerts/tlsca.orderer.ehr.com-cert.pem

. scripts/utils.sh

# Create channel
function createChannel() {
  setGlobals hospital 0
  
  infoln "Creating channel ${CHANNEL_NAME}..."
  
  peer channel create \
    -o localhost:7050 \
    -c $CHANNEL_NAME \
    -f ./channel-artifacts/${CHANNEL_NAME}.tx \
    --outputBlock ./channel-artifacts/${CHANNEL_NAME}.block \
    --tls --cafile $ORDERER_CA
  
  verifyResult $? "Channel creation failed"
  successln "Channel '$CHANNEL_NAME' created"
}

# Join peer to channel
function joinChannel() {
  ORG=$1
  PEER=$2
  setGlobals $ORG $PEER
  
  local rc=1
  local COUNTER=1
  
  while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
    sleep $DELAY
    infoln "Attempting to join peer${PEER}.${ORG} to channel..."
    peer channel join -b ./channel-artifacts/${CHANNEL_NAME}.block
    rc=$?
    COUNTER=$(expr $COUNTER + 1)
  done
  
  verifyResult $rc "peer${PEER}.${ORG} failed to join channel"
  successln "peer${PEER}.${ORG} joined channel '$CHANNEL_NAME'"
}

# Update anchor peers
function updateAnchorPeers() {
  ORG=$1
  PEER=$2
  setGlobals $ORG $PEER
  
  if [ "$ORG" == "hospital" ]; then
    ANCHOR_FILE=./channel-artifacts/HospitalMSPanchors.tx
  else
    ANCHOR_FILE=./channel-artifacts/PatientMSPanchors.tx
  fi
  
  infoln "Updating anchor peers for ${ORG}..."
  peer channel update \
    -o localhost:7050 \
    -c $CHANNEL_NAME \
    -f ${ANCHOR_FILE} \
    --tls --cafile $ORDERER_CA
  
  verifyResult $? "Anchor peer update failed"
  successln "Anchor peers updated for ${ORG}"
}

# Main execution
echo "📺 === Channel Setup ==="
echo "Channel name: $CHANNEL_NAME"

createChannel

# Join all peers to channel
joinChannel hospital 0
joinChannel hospital 1
joinChannel patient 0
joinChannel patient 1

# Update anchor peers
updateAnchorPeers hospital 0
updateAnchorPeers patient 0

successln "Channel setup completed successfully!"
