#!/bin/bash
#
# Utility functions for network scripts
#

C_RESET='\033[0m'
C_RED='\033[0;31m'
C_GREEN='\033[0;32m'
C_BLUE='\033[0;34m'
C_YELLOW='\033[1;33m'

# Print messages in color
function infoln() {
  echo -e "${C_GREEN}${1}${C_RESET}"
}

function warnln() {
  echo -e "${C_YELLOW}${1}${C_RESET}"
}

function errorln() {
  echo -e "${C_RED}${1}${C_RESET}"
}

function successln() {
  echo -e "${C_BLUE}✅ ${1}${C_RESET}"
}

# Set global variables for peer commands
function setGlobals() {
  local ORG=$1
  local PEER=$2
  
  if [ "$ORG" == "hospital" ]; then
    export CORE_PEER_LOCALMSPID="HospitalMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/crypto-config/peerOrganizations/hospital.ehr.com/peers/peer${PEER}.hospital.ehr.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-config/peerOrganizations/hospital.ehr.com/users/Admin@hospital.ehr.com/msp
    
    if [ $PEER -eq 0 ]; then
      export CORE_PEER_ADDRESS=localhost:7051
    else
      export CORE_PEER_ADDRESS=localhost:8051
    fi
  elif [ "$ORG" == "patient" ]; then
    export CORE_PEER_LOCALMSPID="PatientMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/crypto-config/peerOrganizations/patient.ehr.com/peers/peer${PEER}.patient.ehr.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/crypto-config/peerOrganizations/patient.ehr.com/users/Admin@patient.ehr.com/msp
    
    if [ $PEER -eq 0 ]; then
      export CORE_PEER_ADDRESS=localhost:9051
    else
      export CORE_PEER_ADDRESS=localhost:10051
    fi
  else
    errorln "Organization $ORG not recognized"
    exit 1
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

# Verify result of command
function verifyResult() {
  if [ $1 -ne 0 ]; then
    errorln "❌ $2"
    exit 1
  fi
}

# Parse container name from peer
function parsePeerConnectionParameters() {
  PEER_CONN_PARMS=()
  PEERS=""
  while [ "$#" -gt 0 ]; do
    ORG=$1
    PEER=$2
    setGlobals $ORG $PEER
    PEER_CONN_PARMS+=("--peerAddresses $CORE_PEER_ADDRESS")
    PEER_CONN_PARMS+=("--tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE")
    PEERS="$PEERS peer${PEER}.${ORG}"
    shift
    shift
  done
}
