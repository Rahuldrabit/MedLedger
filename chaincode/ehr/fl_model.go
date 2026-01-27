package ehr

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// GlobalModel represents the aggregated global model for a specific round
type GlobalModel struct {
	RoundID     string    `json:"roundId"`
	Version     int       `json:"version"`
	WeightsHash string    `json:"weightsHash"` // Hash or IPFS link
	Metrics     string    `json:"metrics"`     // e.g., "{\"accuracy\": 0.85}"
	Timestamp   time.Time `json:"timestamp"`
	Status      string    `json:"status"`      // TRAINING, AGGREGATED
}

// ModelUpdate represents a local update submitted by a hospital node
type ModelUpdate struct {
	UpdateID    string    `json:"updateId"`
	RoundID     string    `json:"roundId"`
	ClientID    string    `json:"clientId"`
	WeightsHash string    `json:"weightsHash"`
	NumSamples  int       `json:"numSamples"`
	Timestamp   time.Time `json:"timestamp"`
}

const (
	ActionRegisterModel = "REGISTER_GLOBAL_MODEL"
	ActionSubmitUpdate  = "SUBMIT_MODEL_UPDATE"
)

// RegisterGlobalModel creates or updates a Global Model entry
// Usually called by the Aggregator service after FedAvg
func (s *SmartContract) RegisterGlobalModel(
	ctx contractapi.TransactionContextInterface,
	roundID string,
	version int,
	weightsHash string,
	metrics string,
) error {
	callerID, err := s.GetCallerID(ctx)
	if err != nil {
		return fmt.Errorf("failed to get caller ID: %v", err)
	}

	// Verify permissions (future: check if caller is authorized Aggregator)

	model := GlobalModel{
		RoundID:     roundID,
		Version:     version,
		WeightsHash: weightsHash,
		Metrics:     metrics,
		Timestamp:   time.Now(),
		Status:      "AGGREGATED",
	}

	modelJSON, err := json.Marshal(model)
	if err != nil {
		return fmt.Errorf("failed to marshal global model: %v", err)
	}

	// Store with RoundID as key
	key := "GM_" + roundID
	err = ctx.GetStub().PutState(key, modelJSON)
	if err != nil {
		return fmt.Errorf("failed to put state: %v", err)
	}

	// Audit Log
	s.CreateAuditLog(ctx, ActionRegisterModel, callerID, "AGGREGATOR", roundID, true, fmt.Sprintf("Registered Global Model v%d", version))

	return nil
}

// SubmitModelUpdate records a client's local training result
func (s *SmartContract) SubmitModelUpdate(
	ctx contractapi.TransactionContextInterface,
	updateID string,
	roundID string,
	weightsHash string,
	numSamples int,
) error {
	callerID, err := s.GetCallerID(ctx)
	if err != nil {
		return fmt.Errorf("failed to get caller ID: %v", err)
	}

	// Verify update doesn't already exist
	exists, err := ctx.GetStub().GetState(updateID)
	if err != nil {
		return err
	}
	if exists != nil {
		return fmt.Errorf("update %s already submitted", updateID)
	}

	update := ModelUpdate{
		UpdateID:    updateID,
		RoundID:     roundID,
		ClientID:    callerID,
		WeightsHash: weightsHash,
		NumSamples:  numSamples,
		Timestamp:   time.Now(),
	}

	updateJSON, err := json.Marshal(update)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(updateID, updateJSON)
	if err != nil {
		return err
	}

	// Audit Log
	s.CreateAuditLog(ctx, ActionSubmitUpdate, callerID, "CLIENT", updateID, true, "Submitted model update")

	return nil
}

// GetGlobalModel retrieves a global model by RoundID
func (s *SmartContract) GetGlobalModel(ctx contractapi.TransactionContextInterface, roundID string) (*GlobalModel, error) {
	key := "GM_" + roundID
	modelJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, fmt.Errorf("failed to read world state: %v", err)
	}
	if modelJSON == nil {
		return nil, fmt.Errorf("global model for round %s not found", roundID)
	}

	var model GlobalModel
	err = json.Unmarshal(modelJSON, &model)
	if err != nil {
		return nil, err
	}

	return &model, nil
}

// QueryModelUpdates retrieves all updates for a specific round
// Note: This uses CouchDB selector query
func (s *SmartContract) QueryModelUpdates(ctx contractapi.TransactionContextInterface, roundID string) ([]*ModelUpdate, error) {
	queryString := fmt.Sprintf(`{"selector":{"roundId":"%s"}}`, roundID)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var updates []*ModelUpdate
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		// We need to try unmarshal into ModelUpdate.
		// Since other assets (EHRMetadata) exist, we should rely on struct shape or "docType" field if we had one.
		// However, simplified approach: try to unmarshal, if it matches fields.
		// Better approach for production: Add "DocType" field to every struct.
		// For now, we assume unique UpdateID format or just filter by implicit fields.
		// Actually, standard Pattern is to add DocType.
		// I will rely on the caller to filter valid returns or the Selector to be more specific if I added DocType.
		// Let's assume the selector `roundId` is unique to ModelUpdate/GlobalModel (EHR doesn't have roundId).
		
		var update ModelUpdate
		err = json.Unmarshal(response.Value, &update)
		if err == nil && update.ClientID != "" { // Simple valid check
			updates = append(updates, &update)
		}
	}

	return updates, nil
}
