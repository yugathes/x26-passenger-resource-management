# Passenger Resource Management System (PRMS)

A modular TypeScript and Express API backed by Prisma and PostgreSQL for managing passengers, shared resources, membership-based access control, and crew-lead administration.

## Stack

- Node.js 20+
- TypeScript with strict compiler checks
- Express 4
- Prisma 5 with PostgreSQL 15+
- Zod for request validation
- Jest and Supertest for integration testing
- Docker Compose for local PostgreSQL

## Architecture

The app/server split keeps the HTTP process separate from the Express application so tests can exercise routes without opening a socket:

```text
src/
  app.ts                        Express application factory, route mounting, error handling
  server.ts                     Process startup, DB connect, graceful shutdown
  index.ts                      Production entry point
  config/env.ts                 Environment loading and validation
  db/prisma.ts                  Shared Prisma client
  types/express.d.ts            Request augmentation (req.crewLead)
  lib/
    http-error.ts                HttpError hierarchy (400/401/404/409)
    async-handler.ts             Wraps async route handlers for Express error middleware
  modules/
    passengers/                  Passenger CRUD (create, list, get, update membership)
    resources/                   Resource CRUD (create, list, get, update, set status)
    access/                      canAccessResource domain rule + resource access endpoint
    audit/                       Reusable audit log writer (access attempts + admin actions)
    crew-leads/                  Crew lead management + requireCrewLead auth middleware
    reports/                     Crew-lead-only analytics endpoints
prisma/
  schema.prisma                  PRMS domain model
  migrations/                    Versioned database migrations
tests/
  *.test.ts                      Integration tests run against a real PostgreSQL database
  helpers.ts                     Shared test utilities (crew lead bootstrap)
```

Every module keeps its routes, Zod validation, service (business logic), and Prisma access together. Controllers stay thin: they parse input, call a service function, and shape the HTTP response. All business rules — membership hierarchy, resource status checks, crew-lead caps — live in service/domain files, never in controllers.

## PRMS Domain Model

- **CrewLead** — an administrator. The system enforces a maximum of 3 crew leads at any time.
- **Passenger** — has a `MembershipLevel` of `SILVER`, `GOLD`, or `PLATINUM` (ordered lowest to highest; a higher tier inherits all access of the tiers below it).
- **Resource** — has a `ResourceStatus` (`ACTIVE`, `INACTIVE`, `DECOMMISSIONED`) and a `minMembership` requirement.
- **ResourceUsage** — one row per successful access, linking a passenger to a resource.
- **AuditLog** — records every resource access attempt (`ALLOWED`/`DENIED`) and every crew-lead admin action, with optional links to the passenger, resource, and acting crew lead.

### Authorization rule

`canAccessResource(passenger, resource)` in [src/modules/access/authorization.service.ts](src/modules/access/authorization.service.ts) is a pure function, decoupled from HTTP and Prisma:

1. The resource must be `ACTIVE`.
2. The passenger's membership rank must be `>=` the resource's `minMembership` rank (`SILVER < GOLD < PLATINUM`).

The `/access` endpoint uses this rule to decide whether to create a `ResourceUsage` record, and always writes an `AuditLog` entry recording the outcome.

## Local Setup

### Prerequisites

- Node.js 20 or newer
- Docker and Docker Compose

### Install and configure

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate
```

The default `.env.example` connects to the PostgreSQL service from `docker-compose.yml`.

### Run the application

```bash
npm run dev
```

The API runs at `http://localhost:3000`. Check the database-backed health endpoint:

```bash
curl http://localhost:3000/health
```

### Verify the project

```bash
npm run lint     # tsc --noEmit
npm run build    # tsc
npm test         # jest --coverage, against the configured PostgreSQL database
```

### Other useful commands

```bash
npm start                 # Run the compiled application
npm run prisma:studio    # Open Prisma Studio
docker compose logs -f postgres
docker compose down
```

## API Usage Examples

### Crew leads (max 3, no auth required to create — this is how the first admins are onboarded)

```bash
curl -X POST http://localhost:3000/crew-leads \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alex Rivera","email":"alex@x26.com","role":"OPERATIONS"}'

curl http://localhost:3000/crew-leads
```

Admin-aware endpoints (creating/updating passengers and resources, and all `/reports` endpoints) require an `x-crew-lead-id` header identifying an existing crew lead. Requests without a valid header receive `401 Unauthorized`.

### Passengers

```bash
CREW_LEAD_ID="<id from above>"

curl -X POST http://localhost:3000/passengers \
  -H 'Content-Type: application/json' -H "x-crew-lead-id: $CREW_LEAD_ID" \
  -d '{"name":"Jamie Lee","email":"jamie@x26.com","membership":"SILVER"}'

curl http://localhost:3000/passengers
curl http://localhost:3000/passengers/<id>

curl -X PATCH http://localhost:3000/passengers/<id>/membership \
  -H 'Content-Type: application/json' -H "x-crew-lead-id: $CREW_LEAD_ID" \
  -d '{"membership":"GOLD"}'
```

### Resources

```bash
curl -X POST http://localhost:3000/resources \
  -H 'Content-Type: application/json' -H "x-crew-lead-id: $CREW_LEAD_ID" \
  -d '{"name":"VIP Lounge","type":"LOUNGE","minMembership":"GOLD"}'

curl http://localhost:3000/resources
curl http://localhost:3000/resources/<id>

curl -X PATCH http://localhost:3000/resources/<id>/status \
  -H 'Content-Type: application/json' -H "x-crew-lead-id: $CREW_LEAD_ID" \
  -d '{"status":"DECOMMISSIONED"}'
```

### Resource access

```bash
curl -X POST http://localhost:3000/access \
  -H 'Content-Type: application/json' \
  -d '{"passengerId":"<id>","resourceId":"<id>"}'
```

Returns `201` with the created `ResourceUsage` when allowed, or `403` with a reason when denied. Every attempt is recorded in `AuditLog`.

### Reports (crew-lead only)

```bash
curl http://localhost:3000/reports/passengers/<id>/usage -H "x-crew-lead-id: $CREW_LEAD_ID"
curl http://localhost:3000/reports/resources/usage -H "x-crew-lead-id: $CREW_LEAD_ID"
curl http://localhost:3000/reports/resources/demand -H "x-crew-lead-id: $CREW_LEAD_ID"
curl http://localhost:3000/reports/membership-usage -H "x-crew-lead-id: $CREW_LEAD_ID"
```

- **usage** — passenger's full resource usage history
- **resources/usage** — total usage count per resource
- **resources/demand** — allowed vs. denied access attempts per resource, sorted by total demand
- **membership-usage** — usage counts grouped by passenger membership level

## Error Responses

All errors use a consistent envelope:

```json
{ "error": { "message": "Resource abc123 not found" } }
```

Validation errors additionally include a `details` array with Zod issue paths and messages.

Every error path — validation failures, malformed JSON bodies, missing/invalid/unknown crew-lead identity, not-found lookups, and duplicate-value conflicts (e.g. an email already in use) — is normalized to one of `400`/`401`/`403`/`404`/`409` by the shared error middleware in [src/app.ts](src/app.ts), including translating raw Prisma constraint errors (`P2002` unique violations, `P2025` missing records) instead of leaking a `500`.

## Environment Variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | Local Docker PostgreSQL URL |
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | Runtime environment | `development` |

Do not commit `.env`; use `.env.example` as the safe configuration template.

## Future Directions (not yet implemented)

`ResourceUsage` currently records a single point-in-time access event (`accessedAt`), matching the spec's framing of usage as discrete interactions for audit/demand reporting. The following were deliberately scoped out to avoid overengineering beyond the stated requirements, but are reasonable next steps if the product direction calls for them:

- **Session limits with extension**: a fixed `maxUsageMinutes` threshold on `Resource`, an `expiresAt`/`status` on `ResourceUsage`, and a `POST /access/:usageId/extend` endpoint for passengers to extend an active session before it lapses.
- **Resource health/faulty state**: a lifecycle beyond `ACTIVE`/`INACTIVE`/`DECOMMISSIONED` (e.g. `FAULTY`), including who can force-end active usages on a resource that goes faulty mid-session.
- **Occupancy/capacity tracking**: a `capacity` on `Resource` plus concurrent-usage counting, needed only if resources have a hard limit on simultaneous occupants (requires transactional locking to avoid race conditions on the last available slot).

These three are coupled (a session-limit workflow implies usage state, which implies audit actions for expiry/extension), so they should be scoped and built together as a single feature rather than piecemeal.
