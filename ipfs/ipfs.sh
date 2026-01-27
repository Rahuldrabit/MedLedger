#!/bin/bash
#
# IPFS Management Script
#

IPFS_COMPOSE_FILE="docker-compose-ipfs.yaml"

function print_help() {
    echo "IPFS Management Script"
    echo ""
    echo "Usage: ./ipfs.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start      - Start IPFS node"
    echo "  stop       - Stop IPFS node"
    echo "  restart    - Restart IPFS node"
    echo "  status     - Check IPFS node status"
    echo "  logs       - View IPFS logs"
    echo "  stats      - Show repository statistics"
    echo "  peers      - List connected peers"
    echo "  gc         - Run garbage collection"
    echo "  clean      - Stop and remove all data"
    echo ""
}

function start_ipfs() {
    echo "🚀 Starting IPFS node..."
    docker-compose -f $IPFS_COMPOSE_FILE up -d
    
    if [ $? -eq 0 ]; then
        echo "✅ IPFS node started successfully"
        echo "📍 API: http://localhost:5001"
        echo "🌐 Gateway: http://localhost:8080"
    else
        echo "❌ Failed to start IPFS node"
        exit 1
    fi
}

function stop_ipfs() {
    echo "🛑 Stopping IPFS node..."
    docker-compose -f $IPFS_COMPOSE_FILE down
    echo "✅ IPFS node stopped"  
}

function restart_ipfs() {
    stop_ipfs
    sleep 2
    start_ipfs
}

function status_ipfs() {
    echo "📊 IPFS Node Status:"
    docker ps | grep ipfs-node
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🔌 Testing API connection..."
        curl -s http://localhost:5001/api/v0/version | python3 -m json.tool
    else
        echo "❌ IPFS node is not running"
    fi
}

function logs_ipfs() {
    echo "📜 IPFS Logs (Ctrl+C to exit):"
    docker logs -f ipfs-node
}

function stats_ipfs() {
    echo "📈 Repository Statistics:"
    docker exec ipfs-node ipfs repo stat
}

function peers_ipfs() {
    echo "👥 Connected Peers:"
    docker exec ipfs-node ipfs swarm peers | wc -l
    echo "peers connected"
}

function gc_ipfs() {
    echo "🧹 Running garbage collection..."
    docker exec ipfs-node ipfs repo gc
    echo "✅ Garbage collection complete"
}

function clean_ipfs() {
    echo "⚠️  This will delete all IPFS data!"
    read -p "Are you sure? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        stop_ipfs
        echo "🗑️  Removing data..."
        rm -rf ipfs-data ipfs-staging
        echo "✅ Cleanup complete"
    else
        echo "❌ Cleanup cancelled"
    fi
}

# Main execution
case "$1" in
    start)
        start_ipfs
        ;;
    stop)
        stop_ipfs
        ;;
    restart)
        restart_ipfs
        ;;
    status)
        status_ipfs
        ;;
    logs)
        logs_ipfs
        ;;
    stats)
        stats_ipfs
        ;;
    peers)
        peers_ipfs
        ;;
    gc)
        gc_ipfs
        ;;
    clean)
        clean_ipfs
        ;;
    *)
        print_help
        ;;
esac
