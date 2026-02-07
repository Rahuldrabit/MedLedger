package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing EHR records
type SmartContract struct {
	contractapi.Contract
}

// EHRMetadata represents metadata for an electronic health record
type EHRMetadata struct {
	RecordID      string    `json:"recordId"`
	PatientID     string    `json:"patientId"`
	IPFSHash      string    `json:"ipfsHash"`
	EncryptedKey  string    `json:"encryptedKey"`
	Timestamp     time.Time `json:"timestamp"`
	RecordType    string    `json:"recordType"`
	Checksum      string    `json:"checksum"`
	CreatedBy     string    `json:"createdBy"`
}

// ConsentRecord represents consent given by patient to doctor
type ConsentRecord struct {
	ConsentID   string    `json:"consentId"`
	PatientID   string    `json:"patientId"`
	DoctorID    string    `json:"doctorId"`
	RecordID    string    `json:"recordId"` // Empty string means all records
	Granted     bool      `json:"granted"`
	Timestamp   time.Time `json:"timestamp"`
	ExpiryDate  time.Time `json:"expiryDate"`
	GrantedBy   string    `json:"grantedBy"`
}

// AuditLog represents an audit trail entry
type AuditLog struct {
	LogID      string    `json:"logId"`
	Action     string    `json:"action"`
	ActorID    string    `json:"actorId"`
	ActorRole  string    `json:"actorRole"`
	TargetID   string    `json:"targetId"`
	RecordID   string    `json:"recordId"`
	Timestamp  time.Time `json:"timestamp"`
	IPAddress  string    `json:"ipAddress"`
	Success    bool      `json:"success"`
	Message    string    `json:"message"`
}

// User roles
const (
	RolePatient = "patient"
	RoleDoctor  = "doctor"
	RoleAdmin   = "admin"
)

// Audit actions
const (
	ActionCreateEHR    = "CREATE_EHR"
	ActionViewEHR      = "VIEW_EHR"
	ActionGrantConsent = "GRANT_CONSENT"
	ActionRevokeConsent = "REVOKE_CONSENT"
	ActionCheckConsent = "CHECK_CONSENT"
)

// Init initializes the chaincode
func (s *SmartContract) Init(ctx contractapi.TransactionContextInterface) error {
	return nil
}

// CreateEHRMetadata creates a new EHR metadata record
func (s *SmartContract) CreateEHRMetadata(
	ctx contractapi.TransactionContextInterface,
	recordID string,
	patientID string,
	ipfsHash string,
	encryptedKey string,
	recordType string,
	checksum string,
) error {
	// Get caller identity
	callerID, err := s.GetCallerID(ctx)
	if err != nil {
		return fmt.Errorf("failed to get caller ID: %v", err)
	}

	// Check if record already exists
	existing, err := ctx.GetStub().GetState(recordID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("record %s already exists", recordID)
	}

	// Create metadata
	metadata := EHRMetadata{
		RecordID:     recordID,
		PatientID:    patientID,
		IPFSHash:     ipfsHash,
		EncryptedKey: encryptedKey,
		Timestamp:    time.Now(),
		RecordType:   recordType,
		Checksum:     checksum,
		CreatedBy:    callerID,
	}

	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %v", err)
	}

	// Save to ledger
	err = ctx.GetStub().PutState(recordID, metadataJSON)
	if err != nil {
		return fmt.Errorf("failed to put to world state: %v", err)
	}

	// Create audit log
	s.CreateAuditLog(ctx, ActionCreateEHR, callerID, patientID, recordID, true, "EHR metadata created")

	return nil
}

// QueryEHR retrieves an EHR metadata record
func (s *SmartContract) QueryEHR(
	ctx contractapi.TransactionContextInterface,
	recordID string,
) (*EHRMetadata, error) {
	metadataJSON, err := ctx.GetStub().GetState(recordID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if metadataJSON == nil {
		return nil, fmt.Errorf("record %s does not exist", recordID)
	}

	var metadata EHRMetadata
	err = json.Unmarshal(metadataJSON, &metadata)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal metadata: %v", err)
	}

	return &metadata, nil
}

// QueryEHRsByPatient retrieves all EHR records for a patient
func (s *SmartContract) QueryEHRsByPatient(
	ctx contractapi.TransactionContextInterface,
	patientID string,
) ([]*EHRMetadata, error) {
	queryString := fmt.Sprintf(`{"selector":{"patientId":"%s"}}`, patientID)
	
	return s.getQueryResultForQueryString(ctx, queryString)
}

// getQueryResultForQueryString executes a CouchDB query
func (s *SmartContract) getQueryResultForQueryString(
	ctx contractapi.TransactionContextInterface,
	queryString string,
) ([]*EHRMetadata, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %v", err)
	}
	defer resultsIterator.Close()

	var results []*EHRMetadata
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var metadata EHRMetadata
		err = json.Unmarshal(queryResponse.Value, &metadata)
		if err != nil {
			return nil, err
		}
		results = append(results, &metadata)
	}

	return results, nil
}

// GetCallerID extracts the caller's identity from the transaction context
func (s *SmartContract) GetCallerID(ctx contractapi.TransactionContextInterface) (string, error) {
	// Get the client identity
	b64ID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return "", fmt.Errorf("failed to get client ID: %v", err)
	}

	return b64ID, nil
}

// GetCallerRole extracts the caller's role from certificate attributes
func (s *SmartContract) GetCallerRole(ctx contractapi.TransactionContextInterface) (string, error) {
	// Try to get role attribute from certificate
	role, found, err := ctx.GetClientIdentity().GetAttributeValue("role")
	if err != nil {
		return "", fmt.Errorf("failed to get role attribute: %v", err)
	}
	if !found {
		// Default to patient role if not specified
		return RolePatient, nil
	}

	return role, nil
}
