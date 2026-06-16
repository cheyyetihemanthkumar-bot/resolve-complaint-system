# Resolve — AWS Backend (SAM)

Fully serverless backend for the Resolve complaint management system.

## Architecture

```
        Browser
           │
           ▼
   ┌──────────────┐
   │ API Gateway  │──► Cognito User Pool (JWT authorizer)
   └──────┬───────┘
          ▼
   ┌──────────────┐      ┌────────────┐
   │   Lambda     │─────►│ DynamoDB   │   (PK/SK + GSIs)
   │ (Python 3.12)│      └────────────┘
   └──┬───────┬───┘      ┌────────────┐
      │       └────────► │  S3 bucket │   (attachments, signed URLs)
      ▼                  └────────────┘
    SNS Topic ──► email subscribers (admins + status updates)
      │
      ▼
   CloudWatch Logs & Metrics
```

## Folder layout

```
backend/
├── template.yaml          # SAM / CloudFormation IaC
├── requirements.txt
├── api.md                 # full REST API reference
├── samples/seed.json      # sample complaint payloads
└── src/
    ├── common/
    │   ├── db.py          # DynamoDB / SNS / S3 helpers
    │   └── responses.py   # HTTP + auth helpers
    └── handlers/
        ├── complaints.py  # user endpoints
        └── admin.py       # admin endpoints
```

## Prerequisites

- AWS account + AWS CLI configured
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- Python 3.12

## Deploy

```bash
cd backend
sam build
sam deploy --guided \
  --stack-name resolve \
  --parameter-overrides AdminEmail=you@example.com \
  --capabilities CAPABILITY_IAM
```

Confirm the SNS subscription in your inbox after the first deploy.

The stack outputs:
- `ApiUrl` — set as `VITE_API_BASE_URL` in the frontend `.env`
- `UserPoolId`, `UserPoolClientId` — wire into the frontend Cognito client
- `AttachmentsBucket`, `NotificationsTopic`

## Create the first admin user

```bash
USER_POOL=<UserPoolId from outputs>
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL \
  --username admin@company.com \
  --user-attributes Name=email,Value=admin@company.com Name=email_verified,Value=true \
  --temporary-password 'TempPass123!'

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL \
  --username admin@company.com \
  --group-name admin
```

## Seed sample data

```bash
ID_TOKEN=<paste from frontend after login>
API=https://<api-id>.execute-api.<region>.amazonaws.com
jq -c '.complaints[]' samples/seed.json | while read body; do
  curl -X POST $API/complaints \
    -H "Authorization: Bearer $ID_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$body"
done
```

## Local invoke

```bash
sam local invoke ComplaintsFn -e events/create.json
sam local start-api
```

## Logs

```bash
sam logs -n ComplaintsFn --stack-name resolve --tail
sam logs -n AdminFn      --stack-name resolve --tail
```

CloudWatch Log Groups: `/aws/lambda/resolve-ComplaintsFn-*` and `/aws/lambda/resolve-AdminFn-*`.

## Security notes

- Every Lambda uses a least-privilege IAM role via SAM-managed policies
  (`DynamoDBCrudPolicy`, `S3CrudPolicy`, `SNSPublishMessagePolicy`).
- The S3 attachments bucket blocks all public access; uploads/downloads
  use presigned URLs only.
- DynamoDB has SSE + Point-in-Time Recovery enabled.
- API Gateway JWT authorizer validates the Cognito token before any Lambda runs.
- Admin actions additionally check the `cognito:groups` claim for `admin`.

## Cost

Pay-per-request DynamoDB + Lambda + API Gateway. A small team's traffic
typically falls well within the AWS Free Tier.

See [`api.md`](./api.md) for the full endpoint reference.
