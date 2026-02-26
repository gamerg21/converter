# Convertr (Next.js SaaS)

Production-style scaffold for an online file conversion platform.

## Stack

- Next.js (web UI)
- Express + TypeScript (API)
- Worker service for async conversion jobs
- Prisma + PostgreSQL
- Redis queue (scaffold currently uses in-memory queue abstraction)
- Stripe hooks for subscription lifecycle

## Monorepo Layout

- `apps/web` - customer-facing app and dashboard
- `apps/api` - REST API, auth middleware, quotas, webhooks
- `apps/worker` - job consumers and conversion execution
- `packages/db` - Prisma schema/client/migrations/seed
- `packages/shared` - schemas, format matrix, quota defaults
- `packages/conversion-engine` - conversion adapter layer
- `infra` - Dockerfiles and Kubernetes deployment manifests

## Local Development

1. Copy `.env.example` to `.env`.
2. Start local infra:
   - `docker compose up -d`
3. Install dependencies:
   - `pnpm install`
4. Generate Prisma client and run migrations:
   - `pnpm --filter @convertr/db prisma:generate`
   - `pnpm --filter @convertr/db prisma:migrate`
   - `pnpm --filter @convertr/db prisma:seed`
5. Start everything:
   - `pnpm dev`

## API

- OpenAPI spec: `apps/api/openapi.yaml`
- API base URL: `http://localhost:4000/v1`

## Notes

- Conversion adapters are scaffolded and ready for real ffmpeg/imagemagick/libreoffice integration.
- Auth middleware includes development defaults and API-key verification path.
