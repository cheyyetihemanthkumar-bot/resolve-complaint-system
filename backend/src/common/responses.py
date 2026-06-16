"""Shared HTTP response + auth helpers for all Lambda handlers."""
import json
import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Content-Type": "application/json",
}


def respond(status: int, body: Any) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, default=str),
    }


def ok(body: Any) -> Dict[str, Any]:
    return respond(200, body)


def created(body: Any) -> Dict[str, Any]:
    return respond(201, body)


def bad_request(msg: str) -> Dict[str, Any]:
    return respond(400, {"error": msg})


def unauthorized(msg: str = "Unauthorized") -> Dict[str, Any]:
    return respond(401, {"error": msg})


def forbidden(msg: str = "Forbidden") -> Dict[str, Any]:
    return respond(403, {"error": msg})


def not_found(msg: str = "Not found") -> Dict[str, Any]:
    return respond(404, {"error": msg})


def server_error(e: Exception) -> Dict[str, Any]:
    logger.exception("Unhandled error: %s", e)
    return respond(500, {"error": "Internal server error"})


def parse_body(event: Dict[str, Any]) -> Dict[str, Any]:
    raw = event.get("body") or "{}"
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON body")


def get_claims(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Extract Cognito JWT claims from API Gateway HTTP API authorizer context."""
    try:
        return event["requestContext"]["authorizer"]["jwt"]["claims"]
    except (KeyError, TypeError):
        return None


def require_user(event: Dict[str, Any]) -> Dict[str, Any]:
    claims = get_claims(event)
    if not claims:
        raise PermissionError("Missing or invalid auth")
    return {
        "user_id": claims.get("sub"),
        "email": claims.get("email"),
        "name": claims.get("name") or claims.get("email", ""),
        "groups": (claims.get("cognito:groups") or "").split(",") if claims.get("cognito:groups") else [],
    }


def require_admin(event: Dict[str, Any]) -> Dict[str, Any]:
    user = require_user(event)
    if "admin" not in user["groups"]:
        raise PermissionError("Admin role required")
    return user
