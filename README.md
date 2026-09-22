# Passenger Resource Management System

Day 1 foundation for a modular TypeScript and Express API backed by Prisma and PostgreSQL.

## Stack

- Node.js 20+
- TypeScript with strict compiler checks
- Express 4
- Prisma 5 with PostgreSQL 15+
- Jest and Supertest
- Docker Compose for local PostgreSQL

## Project Structure

```text
src/
  app.ts           Express application factory and HTTP routes
  config/env.ts    Environment loading and validation
  db/prisma.ts     Shared Prisma client
  server.ts        Database startup and graceful shutdown
  index.ts         Production entry point
prisma/
  schema.prisma    PRMS domain model
  migrations/      Versioned database migrations
tests/
  health.test.ts   Health endpoint integration test
```

The application factory is separate from the process entry point so tests can exercise HTTP routes without opening a listening socket. Day 2 modules can be added under `src/modules/` and mounted from `src/app.ts`.

## PRMS Domain

The initial schema contains:

- `CrewLead`, who manages assigned passengers and owns audit history
- `Passenger`, with a `MembershipLevel` of `BRONZE`, `SILVER`, `GOLD`, or `PLATINUM`
- `Resource`, with a `ResourceStatus` and optional current passenger assignment
- `ResourceAccess`, which defines membership-based access decisions for resources
- `ResourceUsage`, which records resource usage intervals
- `AuditLog`, which records actions against domain entities

Business workflows, authorization, and CRUD endpoints are intentionally reserved for Day 2.

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
npm run lint
npm run build
npm test
```

`npm test` runs the health endpoint suite against the configured PostgreSQL database and exits without an open-handle warning.

### Other useful commands

```bash
npm start                 # Run the compiled application
npm run prisma:studio    # Open Prisma Studio
docker compose logs -f postgres
docker compose down
```

## Environment Variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | Local Docker PostgreSQL URL |
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | Runtime environment | `development` |

Do not commit `.env`; use `.env.example` as the safe configuration template.

## Day 2 Direction

Add focused modules for passenger, resource, resource access, usage, and audit workflows. Each module should keep its routes, validation, service logic, and persistence mapping together, with integration tests covering the public API.
