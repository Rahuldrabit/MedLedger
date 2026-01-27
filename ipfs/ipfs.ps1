# IPFS Management Script for Windows PowerShell

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

$ComposeFile = "docker-compose-ipfs.yaml"

function Show-Help {
    Write-Host "IPFS Management Script" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\ipfs.ps1 [command]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  start      - Start IPFS node"
    Write-Host "  stop       - Stop IPFS node"
    Write-Host "  restart    - Restart IPFS node"
    Write-Host "  status     - Check IPFS node status"
    Write-Host "  logs       - View IPFS logs"
    Write-Host "  stats      - Show repository statistics"
    Write-Host "  peers      - List connected peers"
    Write-Host "  gc         - Run garbage collection"
    Write-Host "  clean      - Stop and remove all data"
    Write-Host ""
}

function Start-IPFS {
    Write-Host "🚀 Starting IPFS node..." -ForegroundColor Cyan
    docker-compose -f $ComposeFile up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ IPFS node started successfully" -ForegroundColor Green
        Write-Host "📍 API: http://localhost:5001" -ForegroundColor Yellow
        Write-Host "🌐 Gateway: http://localhost:8080" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to start IPFS node" -ForegroundColor Red
        exit 1
    }
}

function Stop-IPFS {
    Write-Host "🛑 Stopping IPFS node..." -ForegroundColor Cyan
    docker-compose -f $ComposeFile down
    Write-Host "✅ IPFS node stopped" -ForegroundColor Green
}

function Restart-IPFS {
    Stop-IPFS
    Start-Sleep -Seconds 2
    Start-IPFS
}

function Get-IPFSStatus {
    Write-Host "📊 IPFS Node Status:" -ForegroundColor Cyan
    docker ps | Select-String "ipfs-node"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🔌 Testing API connection..." -ForegroundColor Yellow
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:5001/api/v0/version"
            Write-Host "Version: $($response.Version)" -ForegroundColor Green
        } catch {
            Write-Host "❌ API not responding" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ IPFS node is not running" -ForegroundColor Red
    }
}

function Show-IPFSLogs {
    Write-Host "📜 IPFS Logs (Ctrl+C to exit):" -ForegroundColor Cyan
    docker logs -f ipfs-node
}

function Get-IPFSStats {
    Write-Host "📈 Repository Statistics:" -ForegroundColor Cyan
    docker exec ipfs-node ipfs repo stat
}

function Get-IPFSPeers {
    Write-Host "👥 Connected Peers:" -ForegroundColor Cyan
    $peerCount = (docker exec ipfs-node ipfs swarm peers | Measure-Object).Count
    Write-Host "$peerCount peers connected" -ForegroundColor Green
}

function Invoke-IPFSGC {
    Write-Host "🧹 Running garbage collection..." -ForegroundColor Cyan
    docker exec ipfs-node ipfs repo gc
    Write-Host "✅ Garbage collection complete" -ForegroundColor Green
}

function Remove-IPFSData {
    Write-Host "⚠️  This will delete all IPFS data!" -ForegroundColor Yellow
    $confirm = Read-Host "Are you sure? (yes/no)"
    
    if ($confirm -eq "yes") {
        Stop-IPFS
        Write-Host "🗑️  Removing data..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force ipfs-data -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force ipfs-staging -ErrorAction SilentlyContinue
        Write-Host "✅ Cleanup complete" -ForegroundColor Green
    } else {
        Write-Host "❌ Cleanup cancelled" -ForegroundColor Red
    }
}

# Main execution
switch ($Command.ToLower()) {
    "start" { Start-IPFS }
    "stop" { Stop-IPFS }
    "restart" { Restart-IPFS }
    "status" { Get-IPFSStatus }
    "logs" { Show-IPFSLogs }
    "stats" { Get-IPFSStats }
    "peers" { Get-IPFSPeers }
    "gc" { Invoke-IPFSGC }
    "clean" { Remove-IPFSData }
    default { Show-Help }
}
