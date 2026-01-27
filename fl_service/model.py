import torch
import torch.nn as nn
import torch.nn.functional as F

class SimpleCNN(nn.Module):
    """
    A simple Convolutional Neural Network for demonstration purposes.
    Can be used for image-based medical diagnosis (e.g., X-ray classification).
    """
    def __init__(self):
        super(SimpleCNN, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, stride=1, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(64 * 7 * 7, 128) # Assuming 28x28 input (MNIST-like)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = x.view(-1, 64 * 7 * 7)
        x = F.relu(self.fc1(x))
        x = self.fc2(x)
        return x

class DiseasePredictionModel(nn.Module):
    """
    A simple MLP for tabular data based disease prediction.
    """
    def __init__(self, input_dim=10, hidden_dim=64, output_dim=2):
        super(DiseasePredictionModel, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_dim, output_dim)
        
    def forward(self, x):
        out = self.fc1(x)
        out = self.relu(out)
        out = self.fc2(out)
        return out

def get_model(model_name="mlp"):
    if model_name == "cnn":
        return SimpleCNN()
    elif model_name == "mlp":
        return DiseasePredictionModel()
    else:
        raise ValueError(f"Unknown model name: {model_name}")
