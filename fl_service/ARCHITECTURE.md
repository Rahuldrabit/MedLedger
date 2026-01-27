# Federated Learning Architecture

## System Overview

The Federated Learning (FL) system allows multiple hospitals to collaboratively train a global disease prediction model without sharing raw patient data.

```mermaid
sequenceDiagram
    participant Aggregator as FL Server (Aggregator)
    participant Blockchain as Hyperledger Fabric
    participant H1 as Hospital 1
    participant H2 as Hospital 2

    Aggregator->>Aggregator: Initialize Global Model (v0)
    Aggregator->>Blockchain: Register Global Model (v0)
    
    loop Round 1..N
        Aggregator->>H1: Broadcast Model Weights (v_current)
        Aggregator->>H2: Broadcast Model Weights (v_current)
        
        par Training
            H1->>H1: Train on Local Data
            H2->>H2: Train on Local Data
        end

        H1->>H1: Compute Hash(Update1)
        H1->>Blockchain: Submit Update Hash (Proof of Work)
        H1->>Aggregator: Send Update (Weights)

        H2->>H2: Compute Hash(Update2)
        H2->>Blockchain: Submit Update Hash
        H2->>Aggregator: Send Update (Weights)

        Aggregator->>Blockchain: Verify Update Hashes
        Aggregator->>Aggregator: Aggregate (FedAvg)
        Aggregator->>Blockchain: Register Global Model (v_next)
    end
```

## Components

### 1. FL Server (Aggregator)
- **Role**: Coordinates the training rounds.
- **Responsibilities**:
    - Manage the lifecycle of the Global Model.
    - Select participating clients for each round.
    - Receive model updates.
    - Perform Federated Averaging (FedAvg).
    - Interact with Blockchain to record the new Global Model hash.

### 2. FL Client (Hospital Node)
- **Role**: Participant in the training network.
- **Responsibilities**:
    - Download the latest Global Model.
    - Train (fine-tune) the model on local private EHR data.
    - Compute the hash of the trained weights.
    - Submit the hash to the Blockchain (Chaincode).
    - Send the actual weights to the Aggregator securely (e.g., HTTPS/GRPC).

### 3. Blockchain (Fabric)
- **Role**: Trust Anchor and Audit Log.
- **Responsibilities**:
    - `ModelUpdate`: Stores the hash of every update submitted by hospitals. Prevents tampering (e.g., a hospital claiming they trained X when they trained Y).
    - `GlobalModel`: Stores the version history and hashes of the global model.
    - **Incentives**: Can distribute tokens/reputation based on contributions (future phase).

### 4. Data Privacy
- Raw patient data NEVER leaves the hospital's secure environment.
- Only model weights (gradients/parameters) are shared.
- Differential Privacy (DP) can be added to the weights to prevent reverse-engineering (future enhancement).
