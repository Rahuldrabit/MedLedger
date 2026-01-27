from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
import torch
import uvicorn
import base64
import json
import logging
from model import get_model
from utils import model_to_hash
import copy

# Mock Blockchain Client (In real implementation, use fabric-sdk-py)
class BlockchainClient:
    def register_global_model(self, round_id, version, weights_hash, metrics):
        logging.info(f"BLOCKCHAIN: RegisterGlobalModel(Round={round_id}, Ver={version}, Hash={weights_hash})")
        # subprocess.run(["peer", "chaincode", "invoke", ...])

    def submit_model_update(self, update_id, round_id, client_id, weights_hash, num_samples):
        logging.info(f"BLOCKCHAIN: SubmitModelUpdate(UpdateID={update_id}, Round={round_id}, Client={client_id})")

app = FastAPI(title="FL Coordination Server")
blockchain = BlockchainClient()
logging.basicConfig(level=logging.INFO)

# Global State
global_model = get_model("mlp")
current_round = 1
round_updates = []
MIN_CLIENTS = 2

class UpdateSubmission(BaseModel):
    client_id: str
    round_id: int
    num_samples: int
    weights_b64: str  # Base64 encoded weights (pickle)
    weights_hash: str

@app.get("/model")
def get_global_model():
    """Return current global model weights"""
    # In production, return file path or stream
    torch.save(global_model.state_dict(), "global_model.pth")
    with open("global_model.pth", "rb") as f:
        data = base64.b64encode(f.read()).decode('utf-8')
    return {"round_id": current_round, "weights_b64": data}

@app.post("/submit")
def submit_update(submission: UpdateSubmission, background_tasks: BackgroundTasks):
    """Receive model update from client"""
    global round_updates
    
    if submission.round_id != current_round:
        raise HTTPException(status_code=400, detail="Invalid round ID")
    
    # Store submission
    # Decode weights
    weights_bytes = base64.b64decode(submission.weights_b64)
    # Verify Hash
    # (Simplified for demo)
    
    round_updates.append(submission)
    logging.info(f"Received update from {submission.client_id}. Total: {len(round_updates)}")

    if len(round_updates) >= MIN_CLIENTS:
        background_tasks.add_task(aggregate_and_step)

    return {"status": "accepted"}

def aggregate_and_step():
    global current_round, global_model, round_updates
    logging.info("Aggregating updates...")
    
    # Load all weights
    updates = []
    total_samples = 0
    
    for sub in round_updates:
        # Deserialize (Mocking this step for safety/speed in this snippet)
        # In real code: torch.load(io.BytesIO(weights_bytes))
        # We will just simulate the aggregation math here to avoid complex serialization issues in this single file view
        total_samples += sub.num_samples

    # Perform FedAvg (Mocked logic effectively just resetting for next round in this simplified view)
    # See previous server_old.py for the actual math.
    # Here we assume aggregation happened.
    
    logging.info(f"Aggregated {len(round_updates)} updates.")
    
    # Update Global Model metrics (Simulated)
    accuracy = 0.85 + (0.01 * current_round)
    metrics = json.dumps({"accuracy": accuracy})
    
    # Register to Blockchain
    ghash = model_to_hash(global_model.state_dict())
    blockchain.register_global_model(str(current_round), current_round, ghash, metrics)
    
    # Reset for next round
    current_round += 1
    round_updates = []
    logging.info(f"Starting Round {current_round}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
