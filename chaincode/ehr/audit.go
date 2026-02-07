package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/google/uuid"
)

// CreateAuditLog creates an audit trail entry
func (s *SmartContract) CreateAuditLog(
	ctx contractapi.TransactionContextInterface,
	action string,
	actorID string,
	targetID string,
	recordID string,
	success bool,
	message string,
) error {
	// Get actor role
	role, err := s.GetCallerRole(ctx)
	if err != nil {
		role = "unknown"
	}

	// Generate unique log ID
	logID := uuid.New().String()

	auditLog := AuditLog{
		LogID:     logID,
		Action:    action,
		ActorID:   actorID,
		ActorRole: role,
		TargetID:  targetID,
		RecordID:  recordID,
		Timestamp: time.Now(),
		IPAddress: "", // Can be populated from client context
		Success:   success,
		Message:   message,
	}

	logJSON, err := json.Marshal(auditLog)
	if err != nil {
		return fmt.Errorf("failed to marshal audit log: %v", err)
	}

	// Save to ledger with composite key
	compositeKey, err := ctx.GetStub().CreateCompositeKey("audit", []string{action, actorID, logID})
	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}

	err = ctx.GetStub().PutState(compositeKey, logJSON)
	if err != nil {
		return fmt.Errorf("failed to put audit log: %v", err)
	}

	return nil
}

// QueryAuditLogsByActor retrieves all audit logs for a specific actor
func (s *SmartContract) QueryAuditLogsByActor(
	ctx contractapi.TransactionContextInterface,
	actorID string,
) ([]*AuditLog, error) {
	queryString := fmt.Sprintf(`{"selector":{"actorId":"%s"}}`, actorID)
	
	return s.getAuditQueryResult(ctx, queryString)
}

// QueryAuditLogsByAction retrieves all audit logs for a specific action
func (s *SmartContract) QueryAuditLogsByAction(
	ctx contractapi.TransactionContextInterface,
	action string,
) ([]*AuditLog, error) {
	queryString := fmt.Sprintf(`{"selector":{"action":"%s"}}`, action)
	
	return s.getAuditQueryResult(ctx, queryString)
}

// QueryAuditLogsByRecord retrieves all audit logs for a specific record
func (s *SmartContract) QueryAuditLogsByRecord(
	ctx contractapi.TransactionContextInterface,
	recordID string,
) ([]*AuditLog, error) {
	queryString := fmt.Sprintf(`{"selector":{"recordId":"%s"}}`, recordID)
	
	return s.getAuditQueryResult(ctx, queryString)
}

// QueryAuditLogsByTimeRange retrieves audit logs within a time range
func (s *SmartContract) QueryAuditLogsByTimeRange(
	ctx contractapi.TransactionContextInterface,
	startTime string,
	endTime string,
) ([]*AuditLog, error) {
	queryString := fmt.Sprintf(
		`{"selector":{"timestamp":{"$gte":"%s","$lte":"%s"}}}`,
		startTime,
		endTime,
	)
	
	return s.getAuditQueryResult(ctx, queryString)
}

// getAuditQueryResult executes a CouchDB query for audit logs
func (s *SmartContract) getAuditQueryResult(
	ctx contractapi.TransactionContextInterface,
	queryString string,
) ([]*AuditLog, error) {
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %v", err)
	}
	defer resultsIterator.Close()

	var results []*AuditLog
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var log AuditLog
		err = json.Unmarshal(queryResponse.Value, &log)
		if err != nil {
			return nil, err
		}
		results = append(results, &log)
	}

	return results, nil
}

// GetAllAuditLogs retrieves all audit logs (admin function)
func (s *SmartContract) GetAllAuditLogs(
	ctx contractapi.TransactionContextInterface,
) ([]*AuditLog, error) {
	// Check if caller is admin
	role, err := s.GetCallerRole(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get caller role: %v", err)
	}

	if role != RoleAdmin {
		return nil, fmt.Errorf("unauthorized: only admin can retrieve all audit logs")
	}

	// Query all audit logs
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("audit", []string{})
	if err != nil {
		return nil, fmt.Errorf("failed to get audit logs: %v", err)
	}
	defer resultsIterator.Close()

	var results []*AuditLog
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var log AuditLog
		err = json.Unmarshal(queryResponse.Value, &log)
		if err != nil {
			return nil, err
		}
		results = append(results, &log)
	}

	return results, nil
}
