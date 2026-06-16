# Resolve — Serverless Complaint Management System

A production-style complaint management platform with a React (TanStack Start) frontend
and a fully serverless AWS backend (Lambda + API Gateway + DynamoDB + Cognito + S3 + SNS + CloudWatch).

## Live preview

The frontend in this repo runs against a **localStorage-backed mock API** so you can
explore every feature without deploying AWS. Pre-seeded demo accounts:

| Role  | Email               | Password   |
| ----- | ------------------- | ---------- |
| User  | `demo@user.com`     | `demo1234` |
| Admin | `admin@company.com` | `admin1234`|

## Features

### User
- Cognito-based sign up / sign in (mocked in preview)
- Submit complaints (name, email, phone, category, subject, description, priority, attachment)
- Auto-generated unique tracking ID (e.g. `CMP-AB12CD`)
- Per-user complaint list and detail view with public support updates
- Email notifications on create + status changes (via SNS in real deployment)

### Admin
- Role-gated `/admin` dashboard
- KPIs (total / pending / in progress / resolved)
- Charts: complaints by category (bar), status distribution (pie)
- Search + filter by status, category, priority
- Update status, assign agents, add internal or public notes
- Archive or hard-delete complaints
- CSV export of filtered results

### UX
- Dark + light theme, responsive on mobile and desktop
- Public FAQ page to reduce duplicate complaints
- Accessible components (Radix UI)

## Repo layout

```
.
├── src/                      # TanStack Start frontend
│   ├── routes/               # File-based routing
│   ├── components/           # Layout, ThemeProvider, UI primitives
│   ├── lib/api/              # API client + mock store (mirrors AWS endpoints)
│   └── lib/auth/             # Auth context
├── backend/                  # AWS SAM serverless backend
│   ├── template.yaml         # CloudFormation / SAM IaC
│   ├── src/handlers/         # Python 3.12 Lambdas
│   ├── src/common/           # Shared DB / response helpers
│   ├── api.md                # Full REST API reference
│   └── README.md             # Deploy + ops guide
└── README.md
```

## Frontend setup

```bash
bun install
bun run dev
```

To connect to your real AWS backend instead of the mock:

```bash
echo "VITE_API_BASE_URL=https://<api-id>.execute-api.<region>.amazonaws.com" > .env
```

Then implement the real `signIn` / `signUp` branches in `src/lib/api/client.ts` using
[`amazon-cognito-identity-js`](https://www.npmjs.com/package/amazon-cognito-identity-js)
and replace the mock CRUD calls with `fetch` requests carrying the Cognito ID token.

## Backend setup

See [`backend/README.md`](./backend/README.md) for the full deploy guide.
Quick version:

```bash
cd backend
sam build
sam deploy --guided --parameter-overrides AdminEmail=you@example.com
```

## API documentation

See [`backend/api.md`](./backend/api.md).

## License

MIT
