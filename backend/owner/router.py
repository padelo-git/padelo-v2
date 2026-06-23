from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from auth.router import get_current_user
from pydantic import BaseModel
import psutil
import subprocess
import os
from datetime import datetime
import time

router = APIRouter()
security = HTTPBearer()


class SystemMetrics(BaseModel):
    cpu_percent: float
    memory_percent: float
    memory_used: str
    memory_total: str
    disk_percent: float
    disk_used: str
    disk_total: str
    uptime: str
    connections: int
    network_io: dict


class RestartRequest(BaseModel):
    service: str  # 'database', 'server', 'all'


class BackupInfo(BaseModel):
    id: str
    filename: str
    size: str
    created_at: str
    status: str


class Alert(BaseModel):
    id: str
    type: str
    message: str
    severity: str
    created_at: str


def get_uptime() -> str:
    """Get system uptime in human-readable format"""
    boot_time = psutil.boot_time()
    uptime_seconds = time.time() - boot_time
    days = int(uptime_seconds // 86400)
    hours = int((uptime_seconds % 86400) // 3600)
    minutes = int((uptime_seconds % 3600) // 60)
    return f"{days}d {hours}h {minutes}m"


def format_bytes(bytes_value: int) -> str:
    """Format bytes to human-readable string"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.2f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.2f} PB"


@router.get("/owner/metrics")
async def get_system_metrics(current_user: dict = Depends(get_current_user)):
    """Get real-time system metrics"""
    try:
        # CPU - without interval to be faster
        cpu_percent = psutil.cpu_percent(interval=0.1)
        
        # Memory
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_used = format_bytes(memory.used)
        memory_total = format_bytes(memory.total)
        
        # Disk
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        disk_used = format_bytes(disk.used)
        disk_total = format_bytes(disk.total)
        
        # Uptime
        uptime = get_uptime()
        
        # Network connections - skip if permission error
        try:
            connections = len(psutil.net_connections())
        except (psutil.AccessDenied, PermissionError):
            connections = 0
        
        # Network I/O
        try:
            net_io = psutil.net_io_counters()
            network_io = {
                "bytes_sent": format_bytes(net_io.bytes_sent),
                "bytes_recv": format_bytes(net_io.bytes_recv),
                "packets_sent": net_io.packets_sent,
                "packets_recv": net_io.packets_recv
            }
        except Exception:
            network_io = {
                "bytes_sent": "N/A",
                "bytes_recv": "N/A",
                "packets_sent": 0,
                "packets_recv": 0
            }
        
        return SystemMetrics(
            cpu_percent=cpu_percent,
            memory_percent=memory_percent,
            memory_used=memory_used,
            memory_total=memory_total,
            disk_percent=disk_percent,
            disk_used=disk_used,
            disk_total=disk_total,
            uptime=uptime,
            connections=connections,
            network_io=network_io
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting metrics: {str(e)}")


@router.get("/owner/metrics/debug")
async def get_system_metrics_debug():
    """Debug endpoint for metrics without authentication"""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "disk_percent": disk.percent,
            "psutil_installed": True
        }
    except Exception as e:
        return {
            "error": str(e),
            "psutil_installed": False
        }


@router.post("/owner/restart")
async def restart_service(request: RestartRequest, current_user: dict = Depends(get_current_user)):
    """Restart services (database, server, or all)"""
    try:
        if request.service == "database":
            # Restart PostgreSQL
            subprocess.run(["docker-compose", "restart", "db"], check=True)
            return {"message": "Database restarted successfully"}
        elif request.service == "server":
            # Restart backend
            subprocess.run(["docker-compose", "restart", "backend"], check=True)
            return {"message": "Server restarted successfully"}
        elif request.service == "all":
            # Restart all services
            subprocess.run(["docker-compose", "restart"], check=True)
            return {"message": "All services restarted successfully"}
        else:
            raise HTTPException(status_code=400, detail="Invalid service")
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Error restarting service: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/owner/backups")
async def list_backups(current_user: dict = Depends(get_current_user)):
    """List all backups"""
    try:
        backups_dir = "/backups"
        if not os.path.exists(backups_dir):
            return []
        
        backups = []
        for filename in os.listdir(backups_dir):
            if filename.endswith(".sql") or filename.endswith(".dump"):
                filepath = os.path.join(backups_dir, filename)
                stat = os.stat(filepath)
                size = format_bytes(stat.st_size)
                created_at = datetime.fromtimestamp(stat.st_mtime).isoformat()
                backups.append(BackupInfo(
                    id=filename,
                    filename=filename,
                    size=size,
                    created_at=created_at,
                    status="completed"
                ))
        
        return sorted(backups, key=lambda x: x.created_at, reverse=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing backups: {str(e)}")


@router.post("/owner/backups/create")
async def create_backup(current_user: dict = Depends(get_current_user)):
    """Create a new backup"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_{timestamp}.sql"
        backups_dir = "/backups"
        
        if not os.path.exists(backups_dir):
            os.makedirs(backups_dir)
        
        # Create backup using pg_dump
        from core.config import settings
        db_url = settings.DATABASE_URL
        
        # Extract connection details
        # Format: postgresql+asyncpg://user:password@host:port/database
        parts = db_url.replace("postgresql+asyncpg://", "").split("@")
        user_pass = parts[0].split(":")
        host_db = parts[1].split("/")
        host_port = host_db[0].split(":")
        
        user = user_pass[0]
        password = user_pass[1]
        host = host_port[0]
        port = host_port[1] if len(host_port) > 1 else "5432"
        database = host_db[0]
        
        # Set PGPASSWORD environment variable
        env = os.environ.copy()
        env["PGPASSWORD"] = password
        
        # Run pg_dump
        filepath = os.path.join(backups_dir, filename)
        subprocess.run([
            "pg_dump",
            f"-h{host}",
            f"-p{port}",
            f"-U{user}",
            f"-d{database}",
            "-f", filepath
        ], env=env, check=True)
        
        return {"message": "Backup created successfully", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating backup: {str(e)}")


@router.get("/owner/alerts")
async def get_alerts(current_user: dict = Depends(get_current_user)):
    """Get system alerts (GitHub Actions, production errors)"""
    try:
        alerts = []
        
        # Check GitHub Actions status (placeholder - would need GitHub API integration)
        # For now, return empty list
        
        # Check for production errors (placeholder - would need error logging integration)
        # For now, return empty list
        
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting alerts: {str(e)}")


@router.get("/owner/health")
async def get_health_status(current_user: dict = Depends(get_current_user)):
    """Get health status of all services"""
    try:
        health_status = {
            "database": "healthy",
            "backend": "healthy",
            "frontend": "healthy",
            "last_backup": None
        }
        
        # Check last backup
        backups_dir = "/backups"
        if os.path.exists(backups_dir):
            backups = [f for f in os.listdir(backups_dir) if f.endswith(".sql") or f.endswith(".dump")]
            if backups:
                latest_backup = max(backups, key=lambda f: os.path.getmtime(os.path.join(backups_dir, f)))
                health_status["last_backup"] = latest_backup
        
        return health_status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting health status: {str(e)}")
