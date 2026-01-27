# Federated Learning Service

This service handles the Federated Learning (FL) operations for the Blockchain EHR system.

## Components

- **Server (`server.py`)**: Acts as the aggregator. It initializes the global model, coordinates training rounds, and aggregates updates from clients.
- **Client (`client.py`)**: Runs on hospital nodes. It trains the local model on private patient data and submits updates to the aggregator (and hashes to the blockchain).
- **Model (`model.py`)**: Defines the neural network architecture (e.g., SimpleNN for disease prediction).
- **Utils (`utils.py`)**: Helper functions for data loading, preprocessing, and blockchain interaction.

## Setup

1. Install dependencies:
   ```bash
   pip install -r ../requirements-ml.txt
   ```
2. Run Server:
   ```bash
   python server.py
   ```
3. Run Client:
   ```bash
   python client.py --client_id hospital1
   ```
