package ehr

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// GrantConsent allows a patient to grant access to a doctor
func (s *SmartContract) GrantConsent(
	ctx contractapi.TransactionContextInterface,
	consentID string,
	patientID string,
	doctorID string,
	recordID string,
	expiryDays int,
) error {
	// Get caller identity
	callerID, err := s.GetCallerID(ctx)
	if err != nil {
		return fmt.Errorf("failed to get caller ID: %v", err)
	}

	// Verify caller is the patient (or admin)
	// In production, add proper authorization checks

	// Check if consent already exists
	existing, err := ctx.GetStub().GetState(consentID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}

	// Calculate expiry date
	expiryDate := time.Now().AddDate(0, 0, expiryDays)

	consent := ConsentRecord{
		ConsentID:  consentID,
		PatientID:  patientID,
		DoctorID:   doctorID,
		RecordID:   recordID,
		Granted:    true,
		Timestamp:  time.Now(),
		ExpiryDate: expiryDate,
		GrantedBy:  callerID,
	}

	consentJSON, err := json.Marshal(consent)
	if err != nil {
		return fmt.Errorf("failed to marshal consent: %v", err)
	}

	// Save to ledger
	err = ctx.GetStub().PutState(consentID, consentJSON)
	if err != nil {
		return fmt.Errorf("failed to put to world state: %v", err)
	}

	// Create audit log
	if existing == nil {
		s.CreateAuditLog(ctx, ActionGrantConsent, callerID, doctorID, recordID, true, 
			fmt.Sprintf("Consent granted by patient %s to doctor %s", patientID, doctorID))
	} else {
		s.CreateAuditLog(ctx, ActionGrantConsent, callerID, doctorID, recordID, true, 
			fmt.Sprintf("Consent updated by patient %s for doctor %s", patientID, doctorID))
	}

	return nil
}

// RevokeConsent allows a patient to revoke access from a doctor
func (s *SmartContract) RevokeConsent(
	ctx contractapi.TransactionContextInterface,
	consentID string,
) error {
	// Get caller identity
	callerID, err := s.GetCallerID(ctx)
	if err != nil {
		return fmt.Errorf("failed to get caller ID: %v", err)
	}

	// Get existing consent
	consentJSON, err := ctx.GetStub().GetState(consentID)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if consentJSON == nil {
		return fmt.Errorf("consent %s does not exist", consentID)
	}

	var consent ConsentRecord
	err = json.Unmarshal(consentJSON, &consent)
	if err != nil {
		return fmt.Errorf("failed to unmarshal consent: %v", err)
	}

	// Verify caller is the patient who granted consent
	// In production, add proper authorization checks

	// Update consent to revoked
	consent.Granted = false
	consent.Timestamp = time.Now()

	consentJSON, err = json.Marshal(consent)
	if err != nil {
		return fmt.Errorf("failed to marshal consent: %v", err)
	}

	// Save to ledger
	err = ctx.GetStub().PutState(consentID, consentJSON)
	if err != nil {
		return fmt.Errorf("failed to put to world state: %v", err)
	}

	// Create audit log
	s.CreateAuditLog(ctx, ActionRevokeConsent, callerID, consent.DoctorID, consent.RecordID, true, 
		fmt.Sprintf("Consent revoked by patient %s from doctor %s", consent.PatientID, consent.DoctorID))

	return nil
}

// CheckConsent verifies if a doctor has access to a patient's record
func (s *SmartContract) CheckConsent(
	ctx contractapi.TransactionContextInterface,
	patientID string,
	doctorID string,
	recordID string,
) (bool, error) {
	// Query for consent record
	// Try specific record consent first
	consentID := fmt.Sprintf("%s-%s-%s", patientID, doctorID, recordID)
	
	consentJSON, err := ctx.GetStub().GetState(consentID)
	if err != nil {
		return false, fmt.Errorf("failed to read consent: %v", err)
	}

	// If no specific consent, check for general access (empty recordID)
	if consentJSON == nil {
		consentID = fmt.Sprintf("%s-%s-*", patientID, doctorID)
		consentJSON, err = ctx.GetStub().GetState(consentID)
		if err != nil {
			return false, fmt.Errorf("failed to read general consent: %v", err)
		}
	}

	if consentJSON == nil {
		return false, nil
	}

	var consent ConsentRecord
	err = json.Unmarshal(consentJSON, &consent)
	if err != nil {
		return false, fmt.Errorf("failed to unmarshal consent: %v", err)
	}

	// Check if consent is granted and not expired
	if !consent.Granted {
		return false, nil
	}

	if time.Now().After(consent.ExpiryDate) {
		return false, nil
	}

	return true, nil
}

// QueryConsentsByPatient retrieves all consent records for a patient
func (s *SmartContract) QueryConsentsByPatient(
	ctx contractapi.TransactionContextInterface,
	patientID string,
) ([]*ConsentRecord, error) {
	queryString := fmt.Sprintf(`{"selector":{"patientId":"%s"}}`, patientID)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %v", err)
	}
	defer resultsIterator.Close()

	var results []*ConsentRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var consent ConsentRecord
		err = json.Unmarshal(queryResponse.Value, &consent)
		if err != nil {
			return nil, err
		}
		results = append(results, &consent)
	}

	return results, nil
}

// QueryConsentsByDoctor retrieves all patients who granted consent to a doctor
func (s *SmartContract) QueryConsentsByDoctor(
	ctx contractapi.TransactionContextInterface,
	doctorID string,
) ([]*ConsentRecord, error) {
	queryString := fmt.Sprintf(`{"selector":{"doctorId":"%s","granted":true}}`, doctorID)
	
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %v", err)
	}
	defer resultsIterator.Close()

	var results []*ConsentRecord
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var consent ConsentRecord
		err = json.Unmarshal(queryResponse.Value, &consent)
		if err != nil {
			return nil, err
		}

		// Filter out expired consents
		if time.Now().Before(consent.ExpiryDate) {
			results = append(results, &consent)
		}
	}

	return results, nil
}
