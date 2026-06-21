import redis.asyncio as redis
from core.config import settings

# Create Redis connection
redis_client = redis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True
)


async def get_redis():
    """Dependency for getting Redis client"""
    return redis_client


async def cache_get(key: str):
    """Get value from cache"""
    try:
        return await redis_client.get(key)
    except Exception:
        return None


async def cache_set(key: str, value: str, expire: int = 3600):
    """Set value in cache with expiration"""
    try:
        await redis_client.set(key, value, ex=expire)
    except Exception:
        pass


async def cache_delete(key: str):
    """Delete value from cache"""
    try:
        await redis_client.delete(key)
    except Exception:
        pass


async def queue_push(queue_name: str, value: str):
    """Push value to queue"""
    try:
        await redis_client.lpush(queue_name, value)
    except Exception:
        pass


async def queue_pop(queue_name: str):
    """Pop value from queue"""
    try:
        return await redis_client.rpop(queue_name)
    except Exception:
        return None


async def queue_size(queue_name: str) -> int:
    """Get queue size"""
    try:
        return await redis_client.llen(queue_name)
    except Exception:
        return 0
