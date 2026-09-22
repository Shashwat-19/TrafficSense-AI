"""
TrafficSense AI — Structured logging middleware.
"""

import time
import uuid
import logging
import json
from datetime import datetime, timezone

from fastapi import Request

logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
)
logger = logging.getLogger("trafficsense")


async def log_requests(request: Request, call_next):
    """Structured logging middleware with request ID and latency tracking."""
    request_id = str(uuid.uuid4())[:8]
    start_time = time.time()

    # Attach request_id to request state for downstream use
    request.state.request_id = request_id

    try:
        response = await call_next(request)
    except Exception as exc:
        latency = time.time() - start_time
        log_entry = {
            "timestamp": datetime.now(tz=timezone.utc).isoformat(),
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status": 500,
            "latency_ms": round(latency * 1000, 2),
            "error": str(exc),
        }
        logger.error(json.dumps(log_entry))
        raise

    latency = time.time() - start_time
    log_entry = {
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        "request_id": request_id,
        "method": request.method,
        "path": request.url.path,
        "status": response.status_code,
        "latency_ms": round(latency * 1000, 2),
    }
    logger.info(json.dumps(log_entry))

    response.headers["X-Request-ID"] = request_id
    return response
