from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum
import subprocess
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Git Repository Path
GIT_REPO_PATH = ROOT_DIR.parent / "git_configs"
GIT_REPO_PATH.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="Toolbox Network Scheme Manager")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    MAKER = "maker"
    CHECKER = "checker"

class ConnectionType(str, Enum):
    CLIENT_LISTENER = "client_listener"  # Client listens, Switch connects
    CLIENT_CONNECTOR = "client_connector"  # Client connects, Switch listens

class ClientType(str, Enum):
    ACQUIRING = "acquiring"
    ISSUING = "issuing"

class ConnectionStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    ERROR = "error"

class ChangeStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class AlertType(str, Enum):
    CONNECTION_DOWN = "connection_down"
    THRESHOLD_EXCEEDED = "threshold_exceeded"
    CONNECTION_UP = "connection_up"

# Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    password_hash: str
    role: UserRole
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.MAKER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: EmailStr
    role: UserRole
    is_active: bool

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ConnectorNode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ip_address: str
    port: int
    status: ConnectionStatus = ConnectionStatus.ACTIVE

class Connection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_type: ClientType
    connection_type: ConnectionType
    client_node_id: str
    client_port: int
    client_ip_address: str
    mti_supported: List[str] = []
    heartbeat_prompt_type: str
    heartbeat_interval: int  # in seconds
    switch_node_id: str
    iso_format: str = "ISO8583"
    format_version: str = "1987"
    connection_status: ConnectionStatus = ConnectionStatus.PENDING
    endpoint_name: str
    timeout_interval: int  # in seconds
    connector_nodes: List[ConnectorNode] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str

class ConnectionCreate(BaseModel):
    client_type: ClientType
    connection_type: ConnectionType
    client_node_id: str
    client_port: int
    client_ip_address: str
    mti_supported: List[str] = []
    heartbeat_prompt_type: str
    heartbeat_interval: int
    switch_node_id: str
    iso_format: str = "ISO8583"
    format_version: str = "1987"
    endpoint_name: str
    timeout_interval: int
    connector_nodes: List[ConnectorNode] = []

class PendingChange(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    change_type: str  # create, update, delete
    entity_type: str  # connection, business_config, etc.
    entity_id: Optional[str] = None
    old_data: Optional[Dict[str, Any]] = None
    new_data: Dict[str, Any]
    status: ChangeStatus = ChangeStatus.PENDING
    maker_id: str
    maker_username: str
    checker_id: Optional[str] = None
    checker_username: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    comments: Optional[str] = None

class PendingChangeReview(BaseModel):
    status: ChangeStatus
    comments: Optional[str] = None

class AuditTrail(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    entity_type: str
    entity_id: str
    action: str  # created, updated, deleted, approved, rejected
    old_data: Optional[Dict[str, Any]] = None
    new_data: Optional[Dict[str, Any]] = None
    user_id: str
    username: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ip_address: Optional[str] = None

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    alert_type: AlertType
    entity_type: str
    entity_id: str
    message: str
    severity: str = "medium"  # low, medium, high, critical
    is_resolved: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None

class Threshold(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    metric: str
    threshold_value: float
    comparison: str  # gt, lt, eq, gte, lte
    entity_type: str
    is_active: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ThresholdCreate(BaseModel):
    name: str
    metric: str
    threshold_value: float
    comparison: str
    entity_type: str

class BusinessConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    config_type: str  # mandatory_fields, product_types, etc.
    key: str
    value: Any
    description: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BusinessConfigCreate(BaseModel):
    config_type: str
    key: str
    value: Any
    description: Optional[str] = None

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(allowed_roles: List[UserRole]):
    async def role_checker(user: Dict = Depends(get_current_user)):
        if user["role"] not in [role.value for role in allowed_roles]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

async def log_audit(entity_type: str, entity_id: str, action: str, user: Dict, 
                    old_data: Optional[Dict] = None, new_data: Optional[Dict] = None):
    audit = AuditTrail(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        old_data=old_data,
        new_data=new_data,
        user_id=user["id"],
        username=user["username"]
    )
    doc = audit.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.audit_trail.insert_one(doc)

def git_commit_config(connection_id: str, config_data: Dict, message: str):
    """Commit configuration to Git repository"""
    try:
        file_path = GIT_REPO_PATH / f"{connection_id}.json"
        with open(file_path, 'w') as f:
            json.dump(config_data, f, indent=2, default=str)
        
        # Initialize git repo if not exists
        if not (GIT_REPO_PATH / ".git").exists():
            subprocess.run(["git", "init"], cwd=GIT_REPO_PATH, check=True)
            subprocess.run(["git", "config", "user.email", "toolbox@system.com"], cwd=GIT_REPO_PATH)
            subprocess.run(["git", "config", "user.name", "Toolbox System"], cwd=GIT_REPO_PATH)

        # Check if remote 'origin' is configured
        remote_check = subprocess.run(["git", "remote", "-v"], cwd=GIT_REPO_PATH, capture_output=True, text=True)
        if "origin" not in remote_check.stdout:
            git_token = os.environ.get("GIT_TOKEN")
            if not git_token:
                logging.error("GIT_TOKEN not set in environment")
                return False
            remote_url = f"https://{git_token}@github.com/pkul300381/git_configs.git"
            subprocess.run(["git", "remote", "add", "origin", remote_url], cwd=GIT_REPO_PATH, check=True)

        subprocess.run(["git", "add", f"{connection_id}.json"], cwd=GIT_REPO_PATH, check=True)
        subprocess.run(["git", "commit", "-m", message], cwd=GIT_REPO_PATH, check=True)
        return True
    except Exception as e:
        logging.error(f"Git commit failed: {e}")
        return False

# Authentication Routes
@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    return UserResponse(**user.model_dump())

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    token = create_access_token(user["id"], user["role"])
    user_response = UserResponse(**user)
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: Dict = Depends(get_current_user)):
    return UserResponse(**user)

# Connection Routes
@api_router.post("/connections", response_model=Dict)
async def create_connection(conn_data: ConnectionCreate, user: Dict = Depends(get_current_user)):
    # Create pending change for maker-checker
    pending = PendingChange(
        change_type="create",
        entity_type="connection",
        new_data=conn_data.model_dump(),
        maker_id=user["id"],
        maker_username=user["username"]
    )
    
    doc = pending.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.pending_changes.insert_one(doc)
    
    await log_audit("connection", "pending", "created_pending", user, new_data=conn_data.model_dump())
    
    return {"message": "Connection creation submitted for approval", "pending_change_id": pending.id}

@api_router.get("/connections", response_model=List[Connection])
async def get_connections(client_type: Optional[ClientType] = None, user: Dict = Depends(get_current_user)):
    query = {}
    if client_type:
        query["client_type"] = client_type.value
    
    connections = await db.connections.find(query, {"_id": 0}).to_list(1000)
    
    for conn in connections:
        if isinstance(conn.get('created_at'), str):
            conn['created_at'] = datetime.fromisoformat(conn['created_at'])
        if isinstance(conn.get('updated_at'), str):
            conn['updated_at'] = datetime.fromisoformat(conn['updated_at'])
    
    return connections

@api_router.get("/connections/{connection_id}", response_model=Connection)
async def get_connection(connection_id: str, user: Dict = Depends(get_current_user)):
    conn = await db.connections.find_one({"id": connection_id}, {"_id": 0})
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    if isinstance(conn.get('created_at'), str):
        conn['created_at'] = datetime.fromisoformat(conn['created_at'])
    if isinstance(conn.get('updated_at'), str):
        conn['updated_at'] = datetime.fromisoformat(conn['updated_at'])
    
    return Connection(**conn)

@api_router.put("/connections/{connection_id}")
async def update_connection(connection_id: str, conn_data: ConnectionCreate, user: Dict = Depends(get_current_user)):
    existing = await db.connections.find_one({"id": connection_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    # Create pending change
    pending = PendingChange(
        change_type="update",
        entity_type="connection",
        entity_id=connection_id,
        old_data=existing,
        new_data=conn_data.model_dump(),
        maker_id=user["id"],
        maker_username=user["username"]
    )
    
    doc = pending.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.pending_changes.insert_one(doc)
    
    return {"message": "Connection update submitted for approval", "pending_change_id": pending.id}

@api_router.delete("/connections/{connection_id}")
async def delete_connection(connection_id: str, user: Dict = Depends(get_current_user)):
    existing = await db.connections.find_one({"id": connection_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Connection not found")
    
    # Create pending change
    pending = PendingChange(
        change_type="delete",
        entity_type="connection",
        entity_id=connection_id,
        old_data=existing,
        new_data={},
        maker_id=user["id"],
        maker_username=user["username"]
    )
    
    doc = pending.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.pending_changes.insert_one(doc)
    
    return {"message": "Connection deletion submitted for approval", "pending_change_id": pending.id}

# Pending Changes Routes (Maker-Checker)
@api_router.get("/pending-changes", response_model=List[PendingChange])
async def get_pending_changes(user: Dict = Depends(get_current_user)):
    changes = await db.pending_changes.find({"status": ChangeStatus.PENDING.value}, {"_id": 0}).to_list(1000)
    
    for change in changes:
        if isinstance(change.get('created_at'), str):
            change['created_at'] = datetime.fromisoformat(change['created_at'])
        if change.get('reviewed_at') and isinstance(change['reviewed_at'], str):
            change['reviewed_at'] = datetime.fromisoformat(change['reviewed_at'])
    
    return changes

@api_router.post("/pending-changes/{change_id}/review")
async def review_pending_change(change_id: str, review: PendingChangeReview, user: Dict = Depends(get_current_user)):
    change = await db.pending_changes.find_one({"id": change_id}, {"_id": 0})
    if not change:
        raise HTTPException(status_code=404, detail="Pending change not found")
    
    if change["status"] != ChangeStatus.PENDING.value:
        raise HTTPException(status_code=400, detail="Change has already been reviewed")
    
    # Update pending change
    update_data = {
        "status": review.status.value,
        "checker_id": user["id"],
        "checker_username": user["username"],
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "comments": review.comments
    }
    
    await db.pending_changes.update_one({"id": change_id}, {"$set": update_data})
    
    # If approved, apply the change
    if review.status == ChangeStatus.APPROVED:
        if change["entity_type"] == "connection":
            if change["change_type"] == "create":
                conn_data = change["new_data"]
                conn = Connection(**conn_data, created_by=change["maker_id"])
                doc = conn.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                doc['updated_at'] = doc['updated_at'].isoformat()
                await db.connections.insert_one(doc)
                
                # Commit to Git
                git_commit_config(conn.id, doc, f"Create connection {conn.client_node_id}")
                
                await log_audit("connection", conn.id, "created", user, new_data=doc)
                
            elif change["change_type"] == "update":
                conn_data = change["new_data"]
                conn_data["updated_at"] = datetime.now(timezone.utc).isoformat()
                await db.connections.update_one({"id": change["entity_id"]}, {"$set": conn_data})
                
                # Commit to Git
                git_commit_config(change["entity_id"], conn_data, f"Update connection {change['entity_id']}")
                
                await log_audit("connection", change["entity_id"], "updated", user, 
                              old_data=change["old_data"], new_data=conn_data)
                
            elif change["change_type"] == "delete":
                await db.connections.delete_one({"id": change["entity_id"]})
                
                # Commit to Git
                file_path = GIT_REPO_PATH / f"{change['entity_id']}.json"
                if file_path.exists():
                    subprocess.run(["git", "rm", f"{change['entity_id']}.json"], cwd=GIT_REPO_PATH)
                    subprocess.run(["git", "commit", "-m", f"Delete connection {change['entity_id']}"], cwd=GIT_REPO_PATH)
                
                await log_audit("connection", change["entity_id"], "deleted", user, old_data=change["old_data"])
    
    action = "approved" if review.status == ChangeStatus.APPROVED else "rejected"
    await log_audit("pending_change", change_id, action, user)
    
    return {"message": f"Change {review.status.value} successfully"}

def convert_object_ids(data):
    """Recursively convert ObjectId instances to strings."""
    if isinstance(data, dict):
        return {key: convert_object_ids(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_object_ids(item) for item in data]
    elif isinstance(data, ObjectId):
        return str(data)
    else:
        return data

# Audit Trail Routes
@api_router.get("/audit-trail", response_model=List[AuditTrail])
async def get_audit_trail(entity_type: Optional[str] = None, entity_id: Optional[str] = None,
                         user: Dict = Depends(require_role([UserRole.ADMIN, UserRole.CHECKER]))):
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    
    # Fetch all fields, including the default '_id'
    trails = await db.audit_trail.find(query).sort("timestamp", -1).to_list(1000)
    
    # Process each document to make it serializable
    processed_trails = []
    for trail in trails:
        # Recursively convert all ObjectIds to strings
        processed_trail = convert_object_ids(trail)

        # Pydantic models expect 'id', but MongoDB provides '_id'
        if '_id' in processed_trail:
            processed_trail['id'] = processed_trail.pop('_id')

        # Ensure timestamp is a datetime object for Pydantic validation
        if 'timestamp' in processed_trail and isinstance(processed_trail['timestamp'], str):
            processed_trail['timestamp'] = datetime.fromisoformat(processed_trail['timestamp'])

        processed_trails.append(processed_trail)
    
    return processed_trails

# Alert Routes
@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(is_resolved: Optional[bool] = None, user: Dict = Depends(get_current_user)):
    query = {}
    if is_resolved is not None:
        query["is_resolved"] = is_resolved
    
    alerts = await db.alerts.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for alert in alerts:
        if isinstance(alert.get('created_at'), str):
            alert['created_at'] = datetime.fromisoformat(alert['created_at'])
        if alert.get('resolved_at') and isinstance(alert['resolved_at'], str):
            alert['resolved_at'] = datetime.fromisoformat(alert['resolved_at'])
    
    return alerts

@api_router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, user: Dict = Depends(get_current_user)):
    result = await db.alerts.update_one(
        {"id": alert_id},
        {"$set": {"is_resolved": True, "resolved_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return {"message": "Alert resolved"}

# Threshold Routes
@api_router.get("/thresholds", response_model=List[Threshold])
async def get_thresholds(user: Dict = Depends(get_current_user)):
    thresholds = await db.thresholds.find({"is_active": True}, {"_id": 0}).to_list(1000)
    
    for threshold in thresholds:
        if isinstance(threshold.get('created_at'), str):
            threshold['created_at'] = datetime.fromisoformat(threshold['created_at'])
    
    return thresholds

@api_router.post("/thresholds", response_model=Threshold)
async def create_threshold(threshold_data: ThresholdCreate, user: Dict = Depends(get_current_user)):
    threshold = Threshold(**threshold_data.model_dump(), created_by=user["id"])
    
    doc = threshold.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.thresholds.insert_one(doc)
    
    await log_audit("threshold", threshold.id, "created", user, new_data=doc)
    
    return threshold

@api_router.delete("/thresholds/{threshold_id}")
async def delete_threshold(threshold_id: str, user: Dict = Depends(get_current_user)):
    result = await db.thresholds.update_one({"id": threshold_id}, {"$set": {"is_active": False}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Threshold not found")
    
    await log_audit("threshold", threshold_id, "deleted", user)
    
    return {"message": "Threshold deleted"}

# Business Config Routes
@api_router.get("/business-configs", response_model=List[BusinessConfig])
async def get_business_configs(config_type: Optional[str] = None, user: Dict = Depends(get_current_user)):
    query = {"is_active": True}
    if config_type:
        query["config_type"] = config_type
    
    configs = await db.business_configs.find(query, {"_id": 0}).to_list(1000)
    
    for config in configs:
        if isinstance(config.get('created_at'), str):
            config['created_at'] = datetime.fromisoformat(config['created_at'])
        if isinstance(config.get('updated_at'), str):
            config['updated_at'] = datetime.fromisoformat(config['updated_at'])
    
    return configs

@api_router.post("/business-configs", response_model=BusinessConfig)
async def create_business_config(config_data: BusinessConfigCreate, user: Dict = Depends(get_current_user)):
    config = BusinessConfig(**config_data.model_dump())
    
    doc = config.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.business_configs.insert_one(doc)
    
    await log_audit("business_config", config.id, "created", user, new_data=doc)
    
    return config

@api_router.put("/business-configs/{config_id}", response_model=BusinessConfig)
async def update_business_config(config_id: str, config_data: BusinessConfigCreate, 
                                user: Dict = Depends(get_current_user)):
    existing = await db.business_configs.find_one({"id": config_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Config not found")
    
    update_data = config_data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.business_configs.update_one({"id": config_id}, {"$set": update_data})
    
    await log_audit("business_config", config_id, "updated", user, old_data=existing, new_data=update_data)
    
    updated = await db.business_configs.find_one({"id": config_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    
    return BusinessConfig(**updated)

@api_router.delete("/business-configs/{config_id}")
async def delete_business_config(config_id: str, user: Dict = Depends(get_current_user)):
    result = await db.business_configs.update_one({"id": config_id}, {"$set": {"is_active": False}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Config not found")
    
    await log_audit("business_config", config_id, "deleted", user)
    
    return {"message": "Config deleted"}

# Git Operations
@api_router.get("/git/status")
async def git_status(user: Dict = Depends(require_role([UserRole.ADMIN]))):
    try:
        result = subprocess.run(["git", "status", "--short"], cwd=GIT_REPO_PATH, 
                              capture_output=True, text=True, check=True)
        return {"status": result.stdout}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Git status failed: {e.stderr}")

@api_router.post("/git/push")
async def git_push(user: Dict = Depends(require_role([UserRole.ADMIN]))):
    try:
        # Push the main branch to the origin remote and set it as the upstream branch
        result = subprocess.run(
            ["git", "push", "--set-upstream", "origin", "main"],
            cwd=GIT_REPO_PATH,
            capture_output=True,
            text=True,
            check=True
        )
        await log_audit("git", "repository", "pushed", user)
        return {"message": "Pushed to remote", "output": result.stdout}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Git push failed: {e.stderr}")

@api_router.post("/git/pull")
async def git_pull(user: Dict = Depends(require_role([UserRole.ADMIN]))):
    try:
        result = subprocess.run(["git", "pull"], cwd=GIT_REPO_PATH, 
                              capture_output=True, text=True, check=True)
        await log_audit("git", "repository", "pulled", user)
        return {"message": "Pulled from remote", "output": result.stdout}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Git pull failed: {e.stderr}")

@api_router.get("/git/log")
async def git_log(limit: int = 20, user: Dict = Depends(get_current_user)):
    try:
        result = subprocess.run(["git", "log", f"-{limit}", "--pretty=format:%H|%an|%ae|%ad|%s"], 
                              cwd=GIT_REPO_PATH, capture_output=True, text=True, check=True)
        
        logs = []
        for line in result.stdout.split('\n'):
            if line:
                parts = line.split('|')
                logs.append({
                    "commit_hash": parts[0],
                    "author": parts[1],
                    "email": parts[2],
                    "date": parts[3],
                    "message": parts[4]
                })
        
        return {"logs": logs}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Git log failed: {e.stderr}")

@api_router.get("/git/files")
async def get_git_files(user: Dict = Depends(get_current_user)):
    try:
        files_data = []
        
        # List all JSON files in the git repository
        for file_path in GIT_REPO_PATH.glob("*.json"):
            try:
                with open(file_path, 'r') as f:
                    content = json.load(f)
                    
                files_data.append({
                    "filename": file_path.name,
                    "connection_id": file_path.stem,
                    "content": content
                })
            except Exception as e:
                logging.error(f"Error reading file {file_path}: {e}")
        
        return {"files": files_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read Git files: {str(e)}")

@api_router.get("/git/file/{connection_id}")
async def get_git_file(connection_id: str, user: Dict = Depends(get_current_user)):
    try:
        file_path = GIT_REPO_PATH / f"{connection_id}.json"
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Configuration file not found")
        
        with open(file_path, 'r') as f:
            content = json.load(f)
        
        return {
            "filename": file_path.name,
            "connection_id": connection_id,
            "content": content
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")

# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: Dict = Depends(get_current_user)):
    total_connections = await db.connections.count_documents({})
    active_connections = await db.connections.count_documents({"connection_status": ConnectionStatus.ACTIVE.value})
    pending_changes = await db.pending_changes.count_documents({"status": ChangeStatus.PENDING.value})
    unresolved_alerts = await db.alerts.count_documents({"is_resolved": False})
    acquiring_count = await db.connections.count_documents({"client_type": ClientType.ACQUIRING.value})
    issuing_count = await db.connections.count_documents({"client_type": ClientType.ISSUING.value})
    
    return {
        "total_connections": total_connections,
        "active_connections": active_connections,
        "pending_changes": pending_changes,
        "unresolved_alerts": unresolved_alerts,
        "acquiring_count": acquiring_count,
        "issuing_count": issuing_count
    }

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
