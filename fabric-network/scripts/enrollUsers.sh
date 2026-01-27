#!/bin/bash

# Fabric CA Enrollment Script
# Enrolls admin and user identities for all organizations

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Fabric CA Enrollment Script ===${NC}"

# Configuration
FABRIC_CA_CLIENT_HOME=${PWD}/ca-client
export PATH=${PWD}/../bin:$PATH

# Create CA client directory
mkdir -p ${FABRIC_CA_CLIENT_HOME}

# Function to enroll admin
enroll_admin() {
    local ORG=$1
    local CA_PORT=$2
    local CA_NAME=$3
    
    echo -e "${YELLOW}Enrolling admin for ${ORG}...${NC}"
    
    export FABRIC_CA_CLIENT_HOME=${PWD}/ca-client/${ORG}
    
    fabric-ca-client enroll \
        -u https://admin:adminpw@localhost:${CA_PORT} \
        --caname ${CA_NAME} \
        --tls.certfiles ${PWD}/crypto-config/peerOrganizations/${ORG,,}.ehr.com/ca/ca.${ORG,,}.ehr.com-cert.pem
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Admin enrolled for ${ORG}${NC}"
    else
        echo -e "${RED}✗ Failed to enroll admin for ${ORG}${NC}"
        return 1
    fi
}

# Function to register and enroll user
register_user() {
    local ORG=$1
    local USER_ID=$2
    local USER_TYPE=$3  # client or peer or orderer
    local CA_PORT=$4
    local CA_NAME=$5
    
    echo -e "${YELLOW}Registering ${USER_ID} for ${ORG}...${NC}"
    
    export FABRIC_CA_CLIENT_HOME=${PWD}/ca-client/${ORG}
    
    # Register user
    fabric-ca-client register \
        --caname ${CA_NAME} \
        --id.name ${USER_ID} \
        --id.secret ${USER_ID}pw \
        --id.type ${USER_TYPE} \
        --tls.certfiles ${PWD}/crypto-config/peerOrganizations/${ORG,,}.ehr.com/ca/ca.${ORG,,}.ehr.com-cert.pem
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to register ${USER_ID}${NC}"
        return 1
    fi
    
    # Enroll user
    fabric-ca-client enroll \
        -u https://${USER_ID}:${USER_ID}pw@localhost:${CA_PORT} \
        --caname ${CA_NAME} \
        -M ${PWD}/ca-client/${ORG}/${USER_ID}/msp \
        --tls.certfiles ${PWD}/crypto-config/peerOrganizations/${ORG,,}.ehr.com/ca/ca.${ORG,,}.ehr.com-cert.pem
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ ${USER_ID} enrolled${NC}"
    else
        echo -e "${RED}✗ Failed to enroll ${USER_ID}${NC}"
        return 1
    fi
    
    # Copy credentials to wallet (for backend)
    mkdir -p ${PWD}/../backend/wallet/${USER_ID}
    cp ${PWD}/ca-client/${ORG}/${USER_ID}/msp/signcerts/*.pem \
       ${PWD}/../backend/wallet/${USER_ID}/cert.pem
    cp ${PWD}/ca-client/${ORG}/${USER_ID}/msp/keystore/* \
       ${PWD}/../backend/wallet/${USER_ID}/key.pem
    
    # Create identity JSON for backend
    cat > ${PWD}/../backend/wallet/${USER_ID}/identity.json <<EOF
{
  "credentials": {
    "certificate": "$(cat ${PWD}/ca-client/${ORG}/${USER_ID}/msp/signcerts/*.pem)",
    "privateKey": "$(cat ${PWD}/ca-client/${ORG}/${USER_ID}/msp/keystore/*)"
  },
  "mspId": "${ORG}MSP",
  "type": "X.509"
}
EOF
    
    echo -e "${GREEN}✓ Credentials copied to backend wallet${NC}"
}

# Main enrollment process
echo ""
echo "=== Enrolling Organization Admins ==="

# Hospital Organization
enroll_admin "Hospital" "7054" "ca-hospital"

# Patient Organization  
enroll_admin "Patient" "8054" "ca-patient"

# Orderer Organization
enroll_admin "Orderer" "9054" "ca-orderer"

echo ""
echo "=== Registering and Enrolling Users ==="

# Register sample patients
register_user "Patient" "patient123" "client" "8054" "ca-patient"
register_user "Patient" "patient456" "client" "8054" "ca-patient"

# Register sample doctors
register_user "Hospital" "doctor123" "client" "7054" "ca-hospital"
register_user "Hospital" "doctor456" "client" "7054" "ca-hospital"

# Register admin user
register_user "Hospital" "admin789" "admin" "7054" "ca-hospital"

echo ""
echo -e "${GREEN}=== Enrollment Complete ===${NC}"
echo ""
echo "Created identities in backend/wallet/:"
ls -la ${PWD}/../backend/wallet/

echo ""
echo -e "${GREEN}✓ All enrollments successful!${NC}"
echo ""
echo "Next steps:"
echo "  1. Identities are ready in backend/wallet/"
echo "  2. Start the backend API: cd backend && npm start"
echo "  3. Login with enrolled user IDs"
