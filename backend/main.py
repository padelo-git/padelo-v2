from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.database import engine, Base
from auth.router import router as auth_router
from clubs.router import router as clubs_router
from matches.router import router as matches_router
from messaging.router import router as messaging_router
from notifications.router import router as notifications_router
from notifications.firebase_service import FirebaseService
from admin.router import router as admin_router
from matching.scheduler import start_scheduler, stop_scheduler
from payments.stripe_service import initialize_stripe


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Initialize Firebase
    FirebaseService.initialize()
    
    # Initialize Stripe
    if settings.STRIPE_SECRET_KEY:
        initialize_stripe(settings.STRIPE_SECRET_KEY)
    
    # Start background scheduler for automated matching
    start_scheduler()
    
    yield
    # Shutdown
    stop_scheduler()

# Create FastAPI app
app = FastAPI(
    title="Padelo V2",
    description="Sistema de gestión de clubes de pádel - Versión 2",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(clubs_router, prefix="/clubs", tags=["Clubs"])
app.include_router(matches_router, prefix="/matches", tags=["Matches"])
app.include_router(messaging_router, prefix="/messaging", tags=["Messaging"])
app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
app.include_router(admin_router, tags=["Admin"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Padelo V2 API",
        "version": "2.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
