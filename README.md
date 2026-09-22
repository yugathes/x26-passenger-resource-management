# Passenger Resource Management System (PRMS)

A modular backend for managing passenger access to shipboard resources under a membership-tier model. The project enforces access rules, preserves an audit trail, and keeps admin operations protected behind crew-lead validation.

## Live demo

Local demo environment:
- http://localhost:3000

This project was designed to run on a small bare-metal or home-lab environment and is ready for local deployment or further containerization.

## What this project does

- Manages crew leads with a strict maximum of 3 administrators
- Tracks passengers by membership level: SILVER, GOLD, PLATINUM
- Enforces resource access rules based on minimum required membership
- Records every access attempt in an audit log
- Creates usage records only for successful access
- Exposes analytical reports for crew leads
- Keeps the domain logic separated from the HTTP layer

## Core rules

- Higher membership levels inherit access from lower tiers
- A resource must be `ACTIVE` before access is allowed
- The passenger’s membership must meet the resource’s `minMembership`
- All admin-driven actions require a valid `x-crew-lead-id` header
- Reporting endpoints are restricted to crew leads

## Tech stack

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Zod
- Jest + Supertest
- Docker Compose

## Project structure

```text
src/
  app.ts
  server.ts
  index.ts
  config/
  db/
  lib/
  modules/
    access/
    audit/
    crew-leads/
    passengers/
    reports/
    resources/
prisma/
  schema.prisma
  migrations/
tests/
README.md
```

## Domain model

- `CrewLead`: system administrator; exactly 3 allowed
- `Passenger`: has a membership level and email identity
- `Resource`: has a type, status, and minimum required membership
- `ResourceUsage`: records successful resource access
- `AuditLog`: records allowed and denied access, plus admin actions

## Authorization model

The authorization rule is deliberately pure and reusable:

- resource must be `ACTIVE`
- passenger rank must be greater than or equal to the resource minimum rank

Membership order:

`SILVER < GOLD < PLATINUM`

This keeps the business rule simple, auditable, and easy to test.

## Local setup

### Prerequisites

- Node.js 20+
- Docker + Docker Compose

### Installation

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npx prisma generate
npx prisma migrate dev
```

### Run locally

```bash
npm run dev
```

### Verification commands

```bash
npm run lint
npm run build
npm test
```

## Example API usage

### 1) Create crew lead

```bash
curl -X POST http://localhost:3000/crew-leads \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alex Rivera","email":"alex@x26.com","role":"OPERATIONS"}'
```

### 2) Create passenger

```bash
curl -X POST http://localhost:3000/passengers \
  -H 'Content-Type: application/json' \
  -H 'x-crew-lead-id: <crewLeadId>' \
  -d '{"name":"Jamie Lee","email":"jamie@x26.com","membership":"SILVER"}'
```

### 3) Create resource

```bash
curl -X POST http://localhost:3000/resources \
  -H 'Content-Type: application/json' \
  -H 'x-crew-lead-id: <crewLeadId>' \
  -d '{"name":"VIP Lounge","type":"LOUNGE","minMembership":"GOLD"}'
```

### 4) Attempt resource access

```bash
curl -X POST http://localhost:3000/access \
  -H 'Content-Type: application/json' \
  -d '{"passengerId":"<passengerId>","resourceId":"<resourceId>"}'
```

### 5) View reports

```bash
curl http://localhost:3000/reports/resources/usage \
  -H 'x-crew-lead-id: <crewLeadId>'
```

## Testing

The project includes end-to-end style integration tests covering:

- resource access authorization
- denied and allowed access behavior
- membership hierarchy checks
- crew-lead enforcement limits
- reporting endpoints
- malformed request handling

## AI usage disclosure

This project was developed with GitHub Copilot as an AI assistance tool.

AI was used to support:
- code scaffolding and refactoring ideas
- validation and edge-case review
- test design suggestions
- readability improvements

All final code, architecture, and verification decisions were reviewed and executed by me.

## Design decisions and trade-offs

- Authorization is evaluated at access time rather than cached in the client or request layer.
- Resource status is validated before a resource can be consumed.
- Audit logs record both successful and failed access attempts for accountability.
- Crew-lead enforcement is handled with middleware, keeping the admin boundary explicit and reusable.

## Future improvements

Potential next enhancements include:

- pagination for larger reporting datasets
- richer reporting dashboards
- more advanced session lifecycle handling
- extended resource health/fault states
- production monitoring and deployment configuration

## Submission summary

This submission implements a clean, test-backed, production-minded backend for passenger-resource authorization and crew-lead operations. The solution emphasizes maintainability, validation, auditability, and domain-driven design while staying within the scope of the challenge.
