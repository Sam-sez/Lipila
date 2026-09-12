"""
TTL-backed key/value store for Dynamic QR tokens and Bong session tokens.
Uses real Redis if reachable (production: Upstash/Redis Cloud URL in
REDIS_URL), otherwise falls back to an in-memory store with manual
expiry checks — so local dev and demos work with zero Redis setup.
"""
import time
import json
from typing import Optional
import redis
from app.config import settings


class _InMemoryTTLStore:
    def __init__(self):
        self._data: dict[str, tuple[str, float]] = {}

    def setex(self, key: str, ttl_seconds: int, value: str):
        self._data[key] = (value, time.time() + ttl_seconds)

    def get(self, key: str):
        item = self._data.get(key)
        if not item:
            return None
        value, expires_at = item
        if time.time() > expires_at:
            del self._data[key]
            return None
        return value.encode() if isinstance(value, str) else value

    def delete(self, key: str):
        self._data.pop(key, None)

    def ttl(self, key: str) -> int:
        item = self._data.get(key)
        if not item:
            return -2
        _, expires_at = item
        remaining = int(expires_at - time.time())
        return remaining if remaining > 0 else -2


def _build_client():
    try:
        client = redis.from_url(settings.REDIS_URL, socket_connect_timeout=1)
        client.ping()
        return client
    except Exception:
        return _InMemoryTTLStore()


cache = _build_client()


def set_json(key: str, value: dict, ttl_seconds: int):
    cache.setex(key, ttl_seconds, json.dumps(value))


def get_json(key: str) -> Optional[dict]:
    raw = cache.get(key)
    if raw is None:
        return None
    return json.loads(raw)


def delete(key: str):
    cache.delete(key)


def ttl(key: str) -> int:
    return cache.ttl(key)
