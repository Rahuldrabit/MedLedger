package ehr

import (
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// RequireRole checks if the caller has the required role
func (s *SmartContract) RequireRole(
	ctx contractapi.TransactionContextInterface,
	requiredRole string,
) error {
	role, err := s.GetCallerRole(ctx)
	if err != nil {
		return fmt.Errorf("failed to get caller role: %v", err)
	}

	if role != requiredRole {
		return fmt.Errorf("unauthorized: requires role %s, got %s", requiredRole, role)
	}

	return nil
}

// RequireAnyRole checks if the caller has any of the required roles
func (s *SmartContract) RequireAnyRole(
	ctx contractapi.TransactionContextInterface,
	requiredRoles []string,
) error {
	role, err := s.GetCallerRole(ctx)
	if err != nil {
		return fmt.Errorf("failed to get caller role: %v", err)
	}

	for _, requiredRole := range requiredRoles {
		if role == requiredRole {
			return nil
		}
	}

	return fmt.Errorf("unauthorized: requires one of roles %v, got %s", requiredRoles, role)
}

// IsPatient checks if the caller is a patient
func (s *SmartContract) IsPatient(ctx contractapi.TransactionContextInterface) (bool, error) {
	role, err := s.GetCallerRole(ctx)
	if err != nil {
		return false, err
	}
	return role == RolePatient, nil
}

// IsDoctor checks if the caller is a doctor
func (s *SmartContract) IsDoctor(ctx contractapi.TransactionContextInterface) (bool, error) {
	role, err := s.GetCallerRole(ctx)
	if err != nil {
		return false, err
	}
	return role == RoleDoctor, nil
}

// IsAdmin checks if the caller is an admin
func (s *SmartContract) IsAdmin(ctx contractapi.TransactionContextInterface) (bool, error) {
	role, err := s.GetCallerRole(ctx)
	if err != nil {
		return false, err
	}
	return role == RoleAdmin, nil
}

// RequirePatientOrAdmin ensures caller is either the patient or an admin
func (s *SmartContract) RequirePatientOrAdmin(
	ctx contractapi.TransactionContextInterface,
	patientID string,
) error {
	callerID, err := s.GetCallerID(ctx)
	if err != nil {
		return fmt.Errorf("failed to get caller ID: %v", err)
	}

	role, err := s.GetCallerRole(ctx)
	if err != nil {
		return fmt.Errorf("failed to get caller role: %v", err)
	}

	// Allow if admin
	if role == RoleAdmin {
		return nil
	}

	// Allow if caller is the patient
	if callerID == patientID {
		return nil
	}

	return fmt.Errorf("unauthorized: must be patient or admin")
}

// RequireDoctorWithConsent ensures caller is a doctor with valid consent
func (s *SmartContract) RequireDoctorWithConsent(
	ctx contractapi.TransactionContextInterface,
	patientID string,
	recordID string,
) error {
	// Check if caller is doctor
	isDoctor, err := s.IsDoctor(ctx)
	if err != nil {
		return err
	}

	if !isDoctor {
		return fmt.Errorf("unauthorized: must be a doctor")
	}

	// Get doctor ID
	doctorID, err := s.GetCallerID(ctx)
	if err != nil {
		return fmt.Errorf("failed to get doctor ID: %v", err)
	}

	// Check consent
	hasConsent, err := s.CheckConsent(ctx, patientID, doctorID, recordID)
	if err != nil {
		return fmt.Errorf("failed to check consent: %v", err)
	}

	if !hasConsent {
		return fmt.Errorf("unauthorized: no valid consent for this record")
	}

	return nil
}
