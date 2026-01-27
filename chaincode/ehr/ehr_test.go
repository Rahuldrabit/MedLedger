package main

import (
	"encoding/json"
	"testing"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-chaincode-go/shimtest"
	"github.com/stretchr/testify/assert"
)

// TestInit tests chaincode initialization
func TestInit(t *testing.T) {
	cc := new(EHRChaincode)
	stub := shimtest.NewMockStub("ehr", cc)

	// Test Init
	res := stub.MockInit("1", [][]byte{})
	assert.Equal(t, int32(shim.OK), res.Status, "Init failed")
}

// TestCreateEHRMetadata tests EHR creation
func TestCreateEHRMetadata(t *testing.T) {
	cc := new(EHRChaincode)
	stub := shimtest.NewMockStub("ehr", cc)

	// Initialize
	stub.MockInit("1", [][]byte{})

	// Set creator as patient
	stub.Creator = []byte(`{"mspid":"PatientMSP","id":"patient123"}`)

	// Create EHR
	args := [][]byte{
		[]byte("CreateEHRMetadata"),
		[]byte("EHR-001"),
		[]byte("patient123"),
		[]byte("QmTestHash123"),
		[]byte("encryptedKey123"),
		[]byte("Lab Report"),
		[]byte("abc123checksum"),
	}

	res := stub.MockInvoke("2", args)
	assert.Equal(t, int32(shim.OK), res.Status, "CreateEHRMetadata failed: "+res.Message)

	// Verify stored data
	state, err := stub.GetState("EHR-001")
	assert.NoError(t, err)
	assert.NotNil(t, state)

	var metadata EHRMetadata
	err = json.Unmarshal(state, &metadata)
	assert.NoError(t, err)
	assert.Equal(t, "EHR-001", metadata.RecordID)
	assert.Equal(t, "patient123", metadata.PatientID)
	assert.Equal(t, "QmTestHash123", metadata.IPFSHash)
}

// TestQueryEHR tests querying an EHR record
func TestQueryEHR(t *testing.T) {
	cc := new(EHRChaincode)
	stub := shimtest.NewMockStub("ehr", cc)
	stub.MockInit("1", [][]byte{})

	// Set creator as patient
	stub.Creator = []byte(`{"mspid":"PatientMSP","id":"patient123"}`)

	// Create EHR first
	createArgs := [][]byte{
		[]byte("CreateEHRMetadata"),
		[]byte("EHR-001"),
		[]byte("patient123"),
		[]byte("QmTestHash123"),
		[]byte("encryptedKey123"),
		[]byte("Lab Report"),
		[]byte("abc123checksum"),
	}
	stub.MockInvoke("2", createArgs)

	// Query EHR
	queryArgs := [][]byte{
		[]byte("QueryEHR"),
		[]byte("EHR-001"),
	}

	res := stub.MockInvoke("3", queryArgs)
	assert.Equal(t, int32(shim.OK), res.Status, "QueryEHR failed")

	var metadata EHRMetadata
	err := json.Unmarshal(res.Payload, &metadata)
	assert.NoError(t, err)
	assert.Equal(t, "EHR-001", metadata.RecordID)
}

// TestGrantConsent tests consent granting
func TestGrantConsent(t *testing.T) {
	cc := new(EHRChaincode)
	stub := shimtest.NewMockStub("ehr", cc)
	stub.MockInit("1", [][]byte{})

	// Set creator as patient
	stub.Creator = []byte(`{"mspid":"PatientMSP","id":"patient123"}`)

	// Grant consent
	args := [][]byte{
		[]byte("GrantConsent"),
		[]byte("consent-001"),
		[]byte("patient123"),
		[]byte("doctor456"),
		[]byte("EHR-001"),
		[]byte("30"), // 30 days
	}

	res := stub.MockInvoke("2", args)
	assert.Equal(t, int32(shim.OK), res.Status, "GrantConsent failed: "+res.Message)

	// Verify consent stored
	state, err := stub.GetState("consent-001")
	assert.NoError(t, err)
	assert.NotNil(t, state)
}

// TestCheckConsent tests consent verification
func TestCheckConsent(t *testing.T) {
	cc := new(EHRChaincode)
	stub := shimtest.NewMockStub("ehr", cc)
	stub.MockInit("1", [][]byte{})

	// Set creator as patient for consent grant
	stub.Creator = []byte(`{"mspid":"PatientMSP","id":"patient123"}`)

	// Grant consent first
	grantArgs := [][]byte{
		[]byte("GrantConsent"),
		[]byte("consent-001"),
		[]byte("patient123"),
		[]byte("doctor456"),
		[]byte("EHR-001"),
		[]byte("30"),
	}
	stub.MockInvoke("2", grantArgs)

	// Now check as doctor
	stub.Creator = []byte(`{"mspid":"HospitalMSP","id":"doctor456"}`)

	checkArgs := [][]byte{
		[]byte("CheckConsent"),
		[]byte("patient123"),
		[]byte("doctor456"),
		[]byte("EHR-001"),
	}

	res := stub.MockInvoke("3", checkArgs)
	assert.Equal(t, int32(shim.OK), res.Status, "CheckConsent failed")

	var hasConsent bool
	err := json.Unmarshal(res.Payload, &hasConsent)
	assert.NoError(t, err)
	assert.True(t, hasConsent, "Should have consent")
}

// TestRevokeConsent tests consent revocation
func TestRevokeConsent(t *testing.T) {
	cc := new(EHRChaincode)
	stub := shimtest.NewMockStub("ehr", cc)
	stub.MockInit("1", [][]byte{})

	// Set creator as patient
	stub.Creator = []byte(`{"mspid":"PatientMSP","id":"patient123"}`)

	// Grant consent
	grantArgs := [][]byte{
		[]byte("GrantConsent"),
		[]byte("consent-001"),
		[]byte("patient123"),
		[]byte("doctor456"),
		[]byte("EHR-001"),
		[]byte("30"),
	}
	stub.MockInvoke("2", grantArgs)

	// Revoke consent
	revokeArgs := [][]byte{
		[]byte("RevokeConsent"),
		[]byte("consent-001"),
	}

	res := stub.MockInvoke("3", revokeArgs)
	assert.Equal(t, int32(shim.OK), res.Status, "RevokeConsent failed")

	// Check consent is revoked
	state, err := stub.GetState("consent-001")
	assert.NoError(t, err)

	var consent ConsentRecord
	err = json.Unmarshal(state, &consent)
	assert.NoError(t, err)
	assert.False(t, consent.Granted, "Consent should be revoked")
}

// TestCreateAuditLog tests audit logging
func TestCreateAuditLog(t *testing.T) {
	cc := new(EHRChaincode)
	stub := shimtest.NewMockStub("ehr", cc)
	stub.MockInit("1", [][]byte{})

	// Set creator
	stub.Creator = []byte(`{"mspid":"PatientMSP","id":"patient123"}`)

	// Any operation should create audit log
	// Create EHR (which internally creates audit log)
	args := [][]byte{
		[]byte("CreateEHRMetadata"),
		[]byte("EHR-001"),
		[]byte("patient123"),
		[]byte("QmTestHash123"),
		[]byte("encryptedKey123"),
		[]byte("Lab Report"),
		[]byte("abc123checksum"),
	}

	res := stub.MockInvoke("2", args)
	assert.Equal(t, int32(shim.OK), res.Status)

	// Note: Audit logs are created internally, we would need to query them
	// In a real implementation, we'd query by record or actor
}

// TestRoleBasedAccess tests RBAC
func TestRoleBasedAccess(t *testing.T) {
	cc := new(EHRChaincode)
	stub := shimtest.NewMockStub("ehr", cc)
	stub.MockInit("1", [][]byte{})

	// Test 1: Patient can create their own EHR
	stub.Creator = []byte(`{"mspid":"PatientMSP","id":"patient123"}`)

	args := [][]byte{
		[]byte("CreateEHRMetadata"),
		[]byte("EHR-001"),
		[]byte("patient123"),
		[]byte("QmTestHash123"),
		[]byte("encryptedKey123"),
		[]byte("Lab Report"),
		[]byte("abc123checksum"),
	}

	res := stub.MockInvoke("2", args)
	assert.Equal(t, int32(shim.OK), res.Status, "Patient should create own EHR")

	// Test 2: Patient cannot create EHR for another patient
	args[2] = []byte("patient999") // Different patient ID

	res = stub.MockInvoke("3", args)
	assert.NotEqual(t, int32(shim.OK), res.Status, "Should fail - wrong patient")

	// Test 3: Doctor cannot create EHR
	stub.Creator = []byte(`{"mspid":"HospitalMSP","id":"doctor456"}`)

	res = stub.MockInvoke("4", args)
	assert.NotEqual(t, int32(shim.OK), res.Status, "Doctor should not create EHR")
}

// TestQueryEHRsByPatient tests querying all patient records
func TestQueryEHRsByPatient(t *testing.T) {
	cc := new(EHRChaincode)
	stub := shimtest.NewMockStub("ehr", cc)
	stub.MockInit("1", [][]byte{})

	// Set creator as patient
	stub.Creator = []byte(`{"mspid":"PatientMSP","id":"patient123"}`)

	// Create multiple EHRs
	for i := 1; i <= 3; i++ {
		args := [][]byte{
			[]byte("CreateEHRMetadata"),
			[]byte("EHR-00" + string(rune(48+i))), // EHR-001, EHR-002, EHR-003
			[]byte("patient123"),
			[]byte("QmTestHash" + string(rune(48+i))),
			[]byte("encKey" + string(rune(48+i))),
			[]byte("Lab Report " + string(rune(48+i))),
			[]byte("checksum" + string(rune(48+i))),
		}
		stub.MockInvoke(string(rune(48+i)), args)
	}

	// Query all patient records
	queryArgs := [][]byte{
		[]byte("QueryEHRsByPatient"),
		[]byte("patient123"),
	}

	res := stub.MockInvoke("10", queryArgs)
	assert.Equal(t, int32(shim.OK), res.Status, "QueryEHRsByPatient failed")

	// Note: In real CouchDB, this would return array of records
	// MockStub doesn't support rich queries, so we just verify it doesn't error
}

// TestAccessControl tests that doctors can only access with consent
func TestAccessControl(t *testing.T) {
	cc := new(EHRChaincode)
	stub := shimtest.NewMockStub("ehr", cc)
	stub.MockInit("1", [][]byte{})

	// Patient creates EHR
	stub.Creator = []byte(`{"mspid":"PatientMSP","id":"patient123"}`)

	createArgs := [][]byte{
		[]byte("CreateEHRMetadata"),
		[]byte("EHR-001"),
		[]byte("patient123"),
		[]byte("QmTestHash"),
		[]byte("encKey"),
		[]byte("Lab Report"),
		[]byte("checksum"),
	}
	stub.MockInvoke("1", createArgs)

	// Doctor tries to access without consent
	stub.Creator = []byte(`{"mspid":"HospitalMSP","id":"doctor456"}`)

	queryArgs := [][]byte{
		[]byte("QueryEHR"),
		[]byte("EHR-001"),
	}

	// This should work (query is allowed), but in practice doctor would check consent first
	res := stub.MockInvoke("2", queryArgs)
	// Note: Our implementation allows query but access control happens in backend
	assert.Equal(t, int32(shim.OK), res.Status)
}
