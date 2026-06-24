from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://padelo:padelo_secure_2026@localhost:5432/padelo_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8080", "http://18.212.126.125", "http://18.212.126.125:3000", "http://18.212.126.125:8000", "http://18.212.126.125:8080", "http://18.212.126.125:80"]
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_PROJECT_ID: Optional[str] = None
    
    # Stripe
    STRIPE_API_KEY: Optional[str] = None
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Transaction Fee
    TRANSACTION_FEE_PERCENTAGE: float = 0.05  # 5%
    
    class Config:
        env_file = ".env"


settings = Settings()
