package main

import (
	"log"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/ehr-blockchain/chaincode/ehr"
)

func main() {
	// Create a new Smart Contract
	chaincode, err := shim.Start(new(ehr.SmartContract))
	if err != nil {
		log.Fatalf("Error starting EHR chaincode: %v", err)
	}

	if chaincode != nil {
		log.Println("EHR chaincode started successfully")
	}
}
