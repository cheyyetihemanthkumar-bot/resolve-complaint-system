"""DynamoDB + SNS helpers."""
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import boto3
from boto3.dynamodb.conditions import Key

TABLE_NAME = os.environ["TABLE_NAME"]
TOPIC_ARN = os.environ.get("TOPIC_ARN")
BUCKET_NAME = os.environ.get("BUCKET_NAME")

_ddb = boto3.resource("dynamodb")
_table = _ddb.Table(TABLE_NAME)
_sns = boto3.client("sns")
_s3 = boto3.client("s3")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def gen_complaint_id() -> str:
    return f"CMP-{uuid.uuid4().hex[:6].upper()}"


def put_complaint(complaint: Dict[str, Any]) -> Dict[str, Any]:
    item = {
        "PK": f"COMPLAINT#{complaint['id']}",
        "SK": "METADATA",
        "GSI1PK": f"USER#{complaint['userId']}",
        "GSI1SK": complaint["createdAt"],
        "GSI2PK": f"STATUS#{complaint['status']}",
        "GSI2SK": complaint["createdAt"],
        **complaint,
    }
    _table.put_item(Item=item)
    return complaint


def get_complaint(complaint_id: str) -> Optional[Dict[str, Any]]:
    res = _table.get_item(Key={"PK": f"COMPLAINT#{complaint_id}", "SK": "METADATA"})
    item = res.get("Item")
    if not item:
        return None
    # strip storage keys
    for k in ("PK", "SK", "GSI1PK", "GSI1SK", "GSI2PK", "GSI2SK"):
        item.pop(k, None)
    return item


def list_user_complaints(user_id: str) -> List[Dict[str, Any]]:
    res = _table.query(
        IndexName="GSI1-User",
        KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}"),
        ScanIndexForward=False,
    )
    return [_clean(i) for i in res.get("Items", [])]


def list_all_complaints(status: Optional[str] = None) -> List[Dict[str, Any]]:
    if status:
        res = _table.query(
            IndexName="GSI2-Status",
            KeyConditionExpression=Key("GSI2PK").eq(f"STATUS#{status}"),
            ScanIndexForward=False,
        )
        return [_clean(i) for i in res.get("Items", [])]
    # full scan (small-scale admin use; paginate for prod)
    res = _table.scan(FilterExpression=Key("SK").eq("METADATA"))
    items = [_clean(i) for i in res.get("Items", [])]
    items.sort(key=lambda c: c.get("createdAt", ""), reverse=True)
    return items


def update_complaint(complaint_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    expr_names = {}
    expr_values = {":updatedAt": now_iso()}
    sets = ["#updatedAt = :updatedAt"]
    expr_names["#updatedAt"] = "updatedAt"

    for i, (k, v) in enumerate(updates.items()):
        nk = f"#k{i}"
        vk = f":v{i}"
        expr_names[nk] = k
        expr_values[vk] = v
        sets.append(f"{nk} = {vk}")
        if k == "status":
            expr_names["#g2pk"] = "GSI2PK"
            expr_values[":g2pk"] = f"STATUS#{v}"
            sets.append("#g2pk = :g2pk")

    _table.update_item(
        Key={"PK": f"COMPLAINT#{complaint_id}", "SK": "METADATA"},
        UpdateExpression="SET " + ", ".join(sets),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )
    return get_complaint(complaint_id)


def delete_complaint(complaint_id: str) -> None:
    _table.delete_item(Key={"PK": f"COMPLAINT#{complaint_id}", "SK": "METADATA"})


def append_note(complaint_id: str, note: Dict[str, Any]) -> Dict[str, Any]:
    current = get_complaint(complaint_id)
    if not current:
        raise LookupError("Complaint not found")
    notes = current.get("notes", [])
    notes.append(note)
    return update_complaint(complaint_id, {"notes": notes})


def publish_notification(subject: str, message: str, attributes: Dict[str, str] = None) -> None:
    if not TOPIC_ARN:
        return
    msg_attrs = {
        k: {"DataType": "String", "StringValue": v} for k, v in (attributes or {}).items()
    }
    _sns.publish(
        TopicArn=TOPIC_ARN,
        Subject=subject[:100],
        Message=message,
        MessageAttributes=msg_attrs,
    )


def presigned_put_url(key: str, content_type: str, expires: int = 600) -> str:
    return _s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": BUCKET_NAME, "Key": key, "ContentType": content_type},
        ExpiresIn=expires,
    )


def presigned_get_url(key: str, expires: int = 600) -> str:
    return _s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET_NAME, "Key": key},
        ExpiresIn=expires,
    )


def _clean(item: Dict[str, Any]) -> Dict[str, Any]:
    for k in ("PK", "SK", "GSI1PK", "GSI1SK", "GSI2PK", "GSI2SK"):
        item.pop(k, None)
    return item
