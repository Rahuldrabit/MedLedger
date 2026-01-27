import requests
import torch
import base64
import argparse
import time
import io
import uuid
import hashlib
from model import get_model
from utils import train, get_dataloader, model_to_hash

# Mock Blockchain Interaction
def blockchain_submit_update_hash(update_id, round_id, client_id, weights_hash, num_samples):
    print(f"[Blockchain] Submitting Hash: {weights_hash} for Update {update_id}")

SERVER_URL = "http://localhost:8000"

class FLClientNode:
    def __init__(self, client_id):
        self.client_id = client_id
        self.model = get_model("mlp")
        self.device = "cpu"
        self.train_loader = get_dataloader(num_samples=100)

    def run_cycle(self):
        try:
            # 1. Get Global Model
            print(f"[{self.client_id}] Fetching global model...")
            resp = requests.get(f"{SERVER_URL}/model")
            if resp.status_code != 200:
                print("Server not ready.")
                return
            
            data = resp.json()
            round_id = data['round_id']
            weights_b64 = data['weights_b64']
            
            # Load weights
            weights_bytes = base64.b64decode(weights_b64)
            buffer = io.BytesIO(weights_bytes)
            state_dict = torch.load(buffer)
            self.model.load_state_dict(state_dict)
            
            # 2. Train
            print(f"[{self.client_id}] Training round {round_id}...")
            new_state_dict, loss = train(self.model, self.train_loader, epochs=1)
            num_samples = len(self.train_loader.dataset)
            
            # 3. Validation / Hashing
            weights_hash = model_to_hash(new_state_dict)
            update_id = str(uuid.uuid4())
            
            # 4. Submit Hash to Blockchain (Simulation)
            blockchain_submit_update_hash(update_id, round_id, self.client_id, weights_hash, num_samples)
            
            # 5. Submit Update to Aggregator
            # Serialize
            bio = io.BytesIO()
            torch.save(new_state_dict, bio)
            upload_b64 = base64.b64encode(bio.getvalue()).decode('utf-8')
            
            payload = {
                "client_id": self.client_id,
                "round_id": round_id,
                "num_samples": num_samples,
                "weights_b64": upload_b64,
                "weights_hash": weights_hash
            }
            
            res = requests.post(f"{SERVER_URL}/submit", json=payload)
            print(f"[{self.client_id}] Submission status: {res.json()['status']}")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--client_id", type=str, default="hospital1")
    args = parser.parse_args()
    
    client = FLClientNode(args.client_id)
    while True:
        client.run_cycle()
        print("Waiting for next cycle...")
        time.sleep(10)
