"""User-facing complaint endpoints.

Routes (all require Cognito JWT):
  POST   /complaints                       create a complaint
  GET    /complaints                       list current user's complaints
  GET    /complaints/{id}                  fetch one (only if owner)
  POST   /complaints/{id}/attachment-url   get S3 presigned PUT url
"""
import logging
import os
import re
from typing import Any, Dict

from common.db import (
    gen_complaint_id,
    get_complaint,
    list_user_complaints,
    now_iso,
    presigned_put_url,
    publish_notification,
    put_complaint,
    update_complaint,
)
from common.responses import (
    bad_request,
    created,
    forbidden,
    not_found,
    ok,
    parse_body,
    require_user,
    server_error,
    unauthorized,
)

logger = logging.getLogger()

VALID_PRIORITIES = {"Low", "Medium", "High"}
VALID_CATEGORIES = {"Billing", "Technical", "Service", "Product", "Account", "Other"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
BUCKET = os.environ.get("BUCKET_NAME", "")


def handler(event: Dict[str, Any], _context) -> Dict[str, Any]:
    try:
        method = event["requestContext"]["http"]["method"]
        path = event["requestContext"]["http"]["path"]
        user = require_user(event)

        if method == "POST" and path == "/complaints":
            return _create(event, user)
        if method == "GET" and path == "/complaints":
            return ok({"items": list_user_complaints(user["user_id"])})
        if method == "GET" and path.startswith("/complaints/") and not path.endswith("attachment-url"):
            cid = event["pathParameters"]["id"]
            c = get_complaint(cid)
            if not c:
                return not_found()
            if c["userId"] != user["user_id"] and "admin" not in user["groups"]:
                return forbidden()
            return ok(c)
        if method == "POST" and path.endswith("/attachment-url"):
            return _attachment_url(event, user)
        return not_found("Route not found")
    except PermissionError as e:
        return unauthorized(str(e))
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return server_error(e)


def _create(event, user) -> Dict[str, Any]:
    body = parse_body(event)
    errors = _validate(body)
    if errors:
        return bad_request("; ".join(errors))

    complaint = {
        "id": gen_complaint_id(),
        "userId": user["user_id"],
        "name": body["name"].strip()[:100],
        "email": body["email"].strip().lower()[:255],
        "phone": body["phone"].strip()[:40],
        "category": body["category"],
        "subject": body["subject"].strip()[:120],
        "description": body["description"].strip()[:2000],
        "priority": body["priority"],
        "status": "Pending",
        "notes": [],
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    if body.get("attachmentKey"):
        complaint["attachmentKey"] = body["attachmentKey"]

    put_complaint(complaint)

    publish_notification(
        subject=f"[Resolve] New {complaint['priority']} complaint: {complaint['subject']}",
        message=(
            f"A new complaint has been submitted.\n\n"
            f"ID: {complaint['id']}\n"
            f"Customer: {complaint['name']} <{complaint['email']}>\n"
            f"Category: {complaint['category']}\n"
            f"Priority: {complaint['priority']}\n\n"
            f"{complaint['description']}\n"
        ),
        attributes={"event": "complaint.created", "priority": complaint["priority"]},
    )
    return created(complaint)


def _attachment_url(event, user) -> Dict[str, Any]:
    cid = event["pathParameters"]["id"]
    c = get_complaint(cid)
    if not c:
        return not_found()
    if c["userId"] != user["user_id"]:
        return forbidden()
    body = parse_body(event)
    filename = (body.get("filename") or "file").replace("/", "_")[:80]
    content_type = body.get("contentType", "application/octet-stream")
    key = f"attachments/{cid}/{filename}"
    url = presigned_put_url(key, content_type)
    update_complaint(cid, {"attachmentKey": key, "attachmentName": filename})
    return ok({"uploadUrl": url, "key": key, "bucket": BUCKET})


def _validate(body: Dict[str, Any]) -> list[str]:
    errors = []
    for f in ("name", "email", "phone", "category", "subject", "description", "priority"):
        if not body.get(f) or not isinstance(body[f], str):
            errors.append(f"Missing field: {f}")
    if errors:
        return errors
    if not EMAIL_RE.match(body["email"]):
        errors.append("Invalid email")
    if body["priority"] not in VALID_PRIORITIES:
        errors.append("Invalid priority")
    if body["category"] not in VALID_CATEGORIES:
        errors.append("Invalid category")
    if len(body["description"].strip()) < 20:
        errors.append("Description must be at least 20 characters")
    if len(body["subject"].strip()) < 5:
        errors.append("Subject must be at least 5 characters")
    return errors
