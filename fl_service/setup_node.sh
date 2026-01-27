#!/bin/bash

# Setup script for a Hospital Node (FL Client)
# Usage: ./setup_node.sh <hospital_name>

CLIENT_ID=${1:-hospital1}

echo "Setting up FL Node: $CLIENT_ID"

# 1. Install System Dependencies (if needed)
# sudo apt-get install python3-pip -y

# 2. Create Virtual Environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# 3. Activate and Install
source venv/bin/activate
echo "Installing ML dependencies..."
pip install -r ../requirements-ml.txt

# 4. Check Connection to Aggregator (Simulated)
echo "Checking connection to Aggregator..."
# ping -c 1 aggregator_host

echo "Setup complete for $CLIENT_ID"
echo "To start training: python client.py --client_id $CLIENT_ID"
