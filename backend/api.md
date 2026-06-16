# Resolve — REST API Reference

Base URL: value of the `ApiUrl` CloudFormation output, e.g.
`https://abc123.execute-api.us-east-1.amazonaws.com`

All endpoints require a Cognito JWT in the `Authorization: Bearer <id_token>` header.
Admin endpoints additionally require the user to belong to the `admin` group in the user pool.

Responses are JSON. Errors use shape: `{ "error": "<message>" }`.

---

## User endpoints

### `POST /complaints`
Create a new complaint.

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1 415 555 0101",
  "category": "Billing",          // Billing | Technical | Service | Product | Account | Other
  "subject": "Charged twice",
  "description": "Detailed description (min 20 chars)…",
  "priority": "High",              // Low | Medium | High
  "attachmentKey": "attachments/CMP-XXX/file.png"   // optional, returned by /attachment-url
}
```
→ `201` returns the full complaint object including its generated `id`.

### `GET /complaints`
List complaints belonging to the authenticated user.
→ `200 { "items": Complaint[] }`

### `GET /complaints/{id}`
Get a single complaint. Only the owner (or an admin) can read.
→ `200 Complaint` · `404` if missing · `403` if not owner.

### `POST /complaints/{id}/attachment-url`
Returns an S3 presigned PUT URL for uploading an attachment directly from the browser.

```json
{ "filename": "screenshot.png", "contentType": "image/png" }
```
→ `200 { "uploadUrl": "...", "key": "attachments/CMP-XXX/screenshot.png", "bucket": "..." }`

---

## Admin endpoints (require `admin` group)

### `GET /admin/complaints?status=Pending`
List all complaints, optionally filtered by status.

### `PUT /admin/complaints/{id}/status`
```json
{ "status": "In Progress" }
```
Updates status and publishes an SNS notification to the customer.

### `PUT /admin/complaints/{id}/assign`
```json
{ "assignedTo": "agent@company.com" }
```

### `POST /admin/complaints/{id}/notes`
```json
{ "text": "Issued refund, awaiting confirmation.", "internal": true }
```
If `internal: false`, the customer is notified.

### `DELETE /admin/complaints/{id}`
Hard-delete a complaint from DynamoDB.

---

## Complaint object

```ts
interface Complaint {
  id: string;            // CMP-ABC123
  userId: string;        // Cognito sub
  name: string;
  email: string;
  phone: string;
  category: "Billing" | "Technical" | "Service" | "Product" | "Account" | "Other";
  subject: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  status: "Pending" | "In Progress" | "Resolved" | "Closed";
  assignedTo?: string;
  attachmentKey?: string;
  attachmentName?: string;
  notes: { id: string; authorEmail: string; authorName: string; text: string; internal: boolean; createdAt: string }[];
  createdAt: string;     // ISO 8601
  updatedAt: string;
}
```
