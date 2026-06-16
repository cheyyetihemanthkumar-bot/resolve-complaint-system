"""Admin-only complaint management endpoints.

Routes (require Cognito JWT + 'admin' group):
  GET    /admin/complaints                   list all (optional ?status=)
  PUT    /admin/complaints/{id}/status       { status }
  PUT    /admin/complaints/{id}/assign       { assignedTo }
  POST   /admin/complaints/{id}/notes        { text, internal }
  DELETE /admin/complaints/{id}              hard delete
"""
import uuid
from typing import Any, Dict

from common.db import (
    append_note,
    delete_complaint,
    get_complaint,
    list_all_complaints,
    now_iso,
    publish_notification,
    update_complaint,
)
from common.responses import (
    bad_request,
    forbidden,
    not_found,
    ok,
    parse_body,
    require_admin,
    server_error,
    unauthorized,
)

VALID_STATUS = {"Pending", "In Progress", "Resolved", "Closed"}


def handler(event: Dict[str, Any], _ctx) -> Dict[str, Any]:
    try:
        method = event["requestContext"]["http"]["method"]
        path = event["requestContext"]["http"]["path"]
        admin = require_admin(event)
        qs = event.get("queryStringParameters") or {}

        if method == "GET" and path == "/admin/complaints":
            return ok({"items": list_all_complaints(qs.get("status"))})

        cid = (event.get("pathParameters") or {}).get("id")
        if not cid:
            return bad_request("Missing complaint id")
        current = get_complaint(cid)
        if not current:
            return not_found()

        if method == "PUT" and path.endswith("/status"):
            body = parse_body(event)
            status = body.get("status")
            if status not in VALID_STATUS:
                return bad_request("Invalid status")
            updated = update_complaint(cid, {"status": status})
            publish_notification(
                subject=f"[Resolve] {cid} status: {status}",
                message=(
                    f"Hi {current['name']},\n\n"
                    f"Your complaint {cid} status was updated to: {status}.\n\n"
                    f"Subject: {current['subject']}\n"
                ),
                attributes={"event": "complaint.status_changed", "status": status},
            )
            return ok(updated)

        if method == "PUT" and path.endswith("/assign"):
            body = parse_body(event)
            assigned = (body.get("assignedTo") or "").strip().lower()
            if not assigned:
                return bad_request("assignedTo required")
            return ok(update_complaint(cid, {"assignedTo": assigned}))

        if method == "POST" and path.endswith("/notes"):
            body = parse_body(event)
            text = (body.get("text") or "").strip()[:1000]
            if not text:
                return bad_request("text required")
            note = {
                "id": uuid.uuid4().hex[:8],
                "authorEmail": admin["email"],
                "authorName": admin["name"],
                "text": text,
                "internal": bool(body.get("internal", True)),
                "createdAt": now_iso(),
            }
            updated = append_note(cid, note)
            if not note["internal"]:
                publish_notification(
                    subject=f"[Resolve] Update on {cid}",
                    message=f"Support added a note on your complaint {cid}:\n\n{text}",
                    attributes={"event": "complaint.note_added"},
                )
            return ok(updated)

        if method == "DELETE":
            delete_complaint(cid)
            return ok({"deleted": cid})

        return not_found("Route not found")
    except PermissionError as e:
        return forbidden(str(e)) if "Admin" in str(e) else unauthorized(str(e))
    except ValueError as e:
        return bad_request(str(e))
    except Exception as e:
        return server_error(e)
