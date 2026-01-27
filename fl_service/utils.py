import torch
from torch.utils.data import DataLoader, Dataset
import numpy as np
import hashlib
import json

class MedicalDataset(Dataset):
    """
    Simulated Medical Dataset.
    In a real scenario, this would load from a secure local database or IPFS.
    """
    def __init__(self, num_samples=100, input_dim=10):
        self.data = torch.randn(num_samples, input_dim)
        self.targets = torch.randint(0, 2, (num_samples,))

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        return self.data[idx], self.targets[idx]

def get_dataloader(batch_size=32, num_samples=100, input_dim=10):
    dataset = MedicalDataset(num_samples=num_samples, input_dim=input_dim)
    return DataLoader(dataset, batch_size=batch_size, shuffle=True)

def train(model, train_loader, epochs=1, lr=0.01, device="cpu"):
    """
    Local training loop.
    """
    model.to(device)
    model.train()
    criterion = torch.nn.CrossEntropyLoss()
    optimizer = torch.optim.SGD(model.parameters(), lr=lr)

    for epoch in range(epochs):
        for data, target in train_loader:
            data, target = data.to(device), target.to(device)
            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()
    
    return model.state_dict(), loss.item()

def evaluate(model, test_loader, device="cpu"):
    """
    Evaluation loop.
    """
    model.to(device)
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for data, target in test_loader:
            data, target = data.to(device), target.to(device)
            outputs = model(data)
            _, predicted = torch.max(outputs.data, 1)
            total += target.size(0)
            correct += (predicted == target).sum().item()
    
    return correct / total

def model_to_hash(state_dict):
    """
    Compute SHA256 hash of the model weights for blockchain verification.
    """
    # Convert state_dict to a sorted string representation
    # This is rough; for production, use a more stable serialization
    
    # We'll hash the actual bytes of the tensors
    hasher = hashlib.sha256()
    
    keys = sorted(state_dict.keys())
    for k in keys:
        hasher.update(state_dict[k].cpu().numpy().tobytes())
        
    return hasher.hexdigest()
