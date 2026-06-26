from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import redis
import json
from core.config import settings

# Create Redis client for rate limiting
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

# Create limiter
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.REDIS_URL,
    default_limits=["200 per day", "50 per hour"]
)


def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded"""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "detail": "Too many requests. Please try again later.",
            "error": "rate_limit_exceeded"
        }
    )


# Set custom error handler
_rate_limit_exceeded_handler.custom_rate_limit_exceeded_handler = custom_rate_limit_exceeded_handler
