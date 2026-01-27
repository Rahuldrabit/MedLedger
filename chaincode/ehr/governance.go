package ehr

import (
    "fmt"
    
    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type GovernanceRule struct {
    RuleID      string `json:"ruleId"`
    Description string `json:"description"`
    MinValue    int    `json:"minValue"` // e.g., min number of updates
}

// ValidateRoundGovernance checks if a round meets the criteria to be aggregated
func (s *SmartContract) ValidateRoundGovernance(ctx contractapi.TransactionContextInterface, roundID string) (bool, error) {
    // 1. Count updates for this round
    updates, err := s.QueryModelUpdates(ctx, roundID)
    if err != nil {
        return false, err
    }
    
    // Rule: Minimum 2 updates (Simplified hardcoded rule for prototype)
    if len(updates) < 2 {
        return false, fmt.Errorf("insufficient updates: have %d, need at least 2", len(updates))
    }
    
    return true, nil
}
