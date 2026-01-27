package ehr

import (
    "encoding/json"
    "fmt"
    
    "github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type ReputationScore struct {
    ClientID string `json:"clientId"`
    Score    int    `json:"score"`
    LastUpdate time.Time `json:"lastUpdate"`
}

// AwardIncentive updates the reputation score of a contributor
func (s *SmartContract) AwardIncentive(ctx contractapi.TransactionContextInterface, clientID string, points int) error {
    key := "REP_" + clientID
    existingJSON, err := ctx.GetStub().GetState(key)
    if err != nil {
        return err
    }

    var reputation ReputationScore
    if existingJSON != nil {
        json.Unmarshal(existingJSON, &reputation)
    } else {
        reputation = ReputationScore{ClientID: clientID, Score: 0}
    }

    reputation.Score += points
    reputation.LastUpdate = time.Now()

    updatedJSON, _ := json.Marshal(reputation)
    return ctx.GetStub().PutState(key, updatedJSON)
}

// GetReputation queries the score of a participant
func (s *SmartContract) GetReputation(ctx contractapi.TransactionContextInterface, clientID string) (*ReputationScore, error) {
    key := "REP_" + clientID
    val, err := ctx.GetStub().GetState(key)
    if err != nil {
        return nil, err
    }
    if val == nil {
        return &ReputationScore{ClientID: clientID, Score: 0}, nil
    }
    
    var rep ReputationScore
    json.Unmarshal(val, &rep)
    return &rep, nil
}
