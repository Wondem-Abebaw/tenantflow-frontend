# TenantFlow AI Frontend

Next.js tenant experience for the TenantFlow AI leasing workflow:

`Inquiry -> Conversational Screening -> Rule-Based Qualification -> Viewing Booking -> Reminders`

The NestJS backend is the source of truth for lead status, qualification decisions, property alternatives, Calendar availability, scheduling, and reminders.

## Setup

Install dependencies and create the public environment file:

```bash
npm install
cp .env.example .env.local
```

Set the separately running backend origin:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:3000`. The first screen is the public property inquiry flow.

## Lifecycle

1. `POST /leads` stores the inquiry, appends the first backend-authored qualification question, and returns a `CHATTING` lead.
2. The tenant answers in the persisted conversation. `POST /leads/:leadId/messages` extracts income, estimated credit score, pets, desired move-in date, and co-signer status.
3. When no qualification fields are missing, the backend applies the selected property rules and returns `PRE_QUALIFIED` or `REJECTED`. The frontend does not calculate eligibility.
4. A `PRE_QUALIFIED` tenant can fetch Calendar availability and submit one exact returned interval.
5. After scheduling, `GET /leads/:leadId/viewing` restores the persisted date, interval, timezone, and Calendar link after refresh.

The manager-wide pipeline and calendar workspace remain deferred until authenticated manager list APIs are available. This frontend does not use fixtures or direct database access for that production path.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

See `AGENTS.md` for the complete frontend architecture and API contract.
