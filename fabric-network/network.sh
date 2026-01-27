#!/bin/bash
#
# Network Management Script for EHR Blockchain
# Manages Hyperledger Fabric network lifecycle
#

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}
export VERBOSE=false

# Print help
function printHelp() {
  echo "Usage: "
  echo "  network.sh <Mode> [Flags]"
  echo "    Modes:"
  echo "      up - Bring up the network"
  echo "      down - Tear down the network"
  echo "      restart - Restart the network"
  echo "      generateCerts - Generate certificates"
  echo "      createChannel - Create application channel"
  echo "      deployCC - Deploy chaincode"
  echo "      clean - Remove all artifacts and containers"
  echo
  echo "    Flags:"
  echo "    -ca <use CAs> - Use Certificate Authorities to generate crypto material"
  echo "    -c <channel name> - Channel name (default: ehr-channel)"
  echo "    -s <dbtype> - State database: goleveldb or couchdb (default: couchdb)"
  echo "    -verbose - Enable verbose logging"
  echo
  echo "  network.sh -h - Print this message"
}

# Set environment variables
CHANNEL_NAME="ehr-channel"
DATABASE="couchdb"
CRYPTO_MODE="cryptogen"

# Parse commandline args
while [[ $# -ge 1 ]] ; do
  key="$1"
  case $key in
  -h )
    printHelp
    exit 0
    ;;
  -c )
    CHANNEL_NAME="$2"
    shift
    ;;
  -ca )
    CRYPTO_MODE="ca"
    ;;
  -s )
    DATABASE="$2"
    shift
    ;;
  -verbose )
    VERBOSE=true
    ;;
  * )
    MODE="$1"
    ;;
  esac
  shift
done

# Determine mode
if [ "$MODE" == "up" ]; then
  echo "🚀 Starting EHR Blockchain Network..."
elif [ "$MODE" == "down" ]; then
  echo "🛑 Stopping EHR Blockchain Network..."
elif [ "$MODE" == "restart" ]; then
  echo "♻️  Restarting EHR Blockchain Network..."
elif [ "$MODE" == "generateCerts" ]; then
  echo "🔐 Generating Certificates..."
elif [ "$MODE" == "createChannel" ]; then
  echo "📺 Creating Channel..."
elif [ "$MODE" == "deployCC" ]; then
  echo "📦 Deploying Chaincode..."
elif [ "$MODE" == "clean" ]; then
  echo "🧹 Cleaning up..."
else
  printHelp
  exit 1
fi

# Import utility functions
. scripts/utils.sh

# Generate certificates
function generateCerts() {
  if [ -d "crypto-config" ]; then
    echo "⚠️  Crypto material already exists. Use 'clean' first to regenerate."
    return
  fi

  if command -v cryptogen &> /dev/null; then
    echo "📝 Generating crypto material using cryptogen..."
    cryptogen generate --config=./crypto-config.yaml --output="crypto-config"
    if [ $? -ne 0 ]; then
      echo "❌ Failed to generate crypto material"
      exit 1
    fi
  else
    echo "❌ cryptogen tool not found. Please install Hyperledger Fabric binaries."
    exit 1
  fi
  echo "✅ Crypto material generated successfully"
}

# Generate genesis block and channel transaction
function generateChannelArtifacts() {
  if command -v configtxgen &> /dev/null; then
    echo "📝 Generating genesis block..."
    
    mkdir -p channel-artifacts
    
    configtxgen -profile EHROrdererGenesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block
    if [ $? -ne 0 ]; then
      echo "❌ Failed to generate genesis block"
      exit 1
    fi
    
    echo "📝 Generating channel creation transaction..."
    configtxgen -profile EHRChannel -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME
    if [ $? -ne 0 ]; then
      echo "❌ Failed to generate channel creation transaction"
      exit 1
    fi
    
    echo "📝 Generating anchor peer updates..."
    configtxgen -profile EHRChannel -outputAnchorPeersUpdate ./channel-artifacts/HospitalMSPanchors.tx -channelID $CHANNEL_NAME -asOrg HospitalMSP
    configtxgen -profile EHRChannel -outputAnchorPeersUpdate ./channel-artifacts/PatientMSPanchors.tx -channelID $CHANNEL_NAME -asOrg PatientMSP
    
    echo "✅ Channel artifacts generated successfully"
  else
    echo "❌ configtxgen tool not found. Please install Hyperledger Fabric binaries."
    exit 1
  fi
}

# Start network
function networkUp() {
  # Check if crypto material exists
  if [ ! -d "crypto-config" ]; then
    echo "📝 Crypto material not found. Generating..."
    generateCerts
    generateChannelArtifacts
  fi

  # Start CouchDB
  if [ "$DATABASE" == "couchdb" ]; then
    echo "🗄️  Starting CouchDB containers..."
    docker-compose -f docker-compose-couch.yaml up -d
    if [ $? -ne 0 ]; then
      echo "❌ Failed to start CouchDB"
      exit 1
    fi
    sleep 5
  fi

  # Start the network
  echo "🌐 Starting network containers..."
  docker-compose up -d
  if [ $? -ne 0 ]; then
    echo "❌ Failed to start network"
    exit 1
  fi

  echo ""
  echo "✅ Network started successfully!"
  echo ""
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Stop network
function networkDown() {
  echo "🛑 Stopping network..."
  docker-compose down --volumes --remove-orphans
  docker-compose -f docker-compose-couch.yaml down --volumes --remove-orphans
  
  # Remove chaincode containers
  docker ps -a | grep dev-peer | awk '{print $1}' | xargs -r docker rm -f
  docker images | grep dev-peer | awk '{print $3}' | xargs -r docker rmi -f
  
  echo "✅ Network stopped"
}

# Clean everything
function cleanAll() {
  networkDown
  echo "🧹 Removing artifacts..."
  rm -rf crypto-config
  rm -rf channel-artifacts
  rm -rf wallet
  echo "✅ Cleanup complete"
}

# Main execution
case $MODE in
  up)
    networkUp
    ;;
  down)
    networkDown
    ;;
  restart)
    networkDown
    networkUp
    ;;
  generateCerts)
    generateCerts
    generateChannelArtifacts
    ;;
  createChannel)
    ./scripts/createChannel.sh $CHANNEL_NAME
    ;;
  deployCC)
    ./scripts/deployCC.sh $CHANNEL_NAME
    ;;
  clean)
    cleanAll
    ;;
  *)
    printHelp
    exit 1
    ;;
esac
