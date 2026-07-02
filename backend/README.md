# InvoiceAI Backend

AI-powered financial operations platform for SMEs. Node.js + Express + TypeScript + Prisma + MySQL.

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL at minimum
npx prisma migrate dev --name init
npm run prisma:seed    # creates the 4 system roles + permission set
npm run dev
```

Server starts on `http://localhost:4000`. Health check at `GET /health`.

## Status: Phase 1 (Foundation) complete

What's implemented and working:

- **Auth** — `POST /api/v1/auth/register` (creates Organization + User, assigns OWNER role), `POST /api/v1/auth/login` (JWT issuance).
- **RBAC** — `Role` / `Permission` / `RolePermission` / `UserRole` tables, seeded with OWNER/ADMIN/ACCOUNTANT/VIEWER and their permission bundles (see `prisma/seed.ts`). `requirePermission('resource:action')` middleware is ready for every future route.
- **Domain event system** — `EventBus` with persistent `DomainEventLog`, `AuditLogListener` wired up as the first subscriber. Every feature service built from here on emits events through `eventBus.emit(...)` rather than writing audit rows directly.
- **Jobs layer** — `JobScheduler` (node-cron backed) with three jobs registered but disabled (`recurring-invoice-generation`, `payment-reminder`, `reconciliation-batch`), pending the services they depend on.
- **AI assistant skeleton** — `ToolRegistry`, `ConversationStore` (fully functional, schema-backed), `ContextBuilder` and `IntentClassifier` (interfaces defined, implementation pending Phase 5 once there's business logic worth calling).
- **Shared infrastructure** — centralized error handling (`ApiError` + Zod + Prisma error translation), structured logging (pino), rate limiting (global + tighter auth-specific), pagination/filter/sort/search query contract, strict TypeScript with `no-explicit-any` enforced by ESLint.

## Verified in this environment

- `npm install` ✅
- `npx tsc --noEmit` ✅ (clean)
- `npx eslint src --ext .ts` ✅ (clean)
- `npx vitest run` ✅ (8/8 passing — pure-logic tests for `ApiError` and pagination utils)

## NOT verified in this sandbox (no internet access to required services)

- `npx prisma generate` — blocked, `binaries.prisma.sh` isn't reachable from this container. The schema is correct; this is a one-time engine binary download that will succeed on any machine with normal internet access (or in CI/CD). Until it's run, `@prisma/client` types fall back to a generic stub (this is why `error-handler.ts` will show a transient type error here for `Prisma.PrismaClientKnownRequestError` — it resolves the moment `prisma generate` runs against the real schema).
- Actual database connectivity / migrations — no MySQL instance available in this sandbox. Run `npx prisma migrate dev` against a real MySQL 8+ instance to create the schema.
- Puppeteer's bundled Chromium download — also blocked here (`PUPPETEER_SKIP_DOWNLOAD=true` is set). Either let Puppeteer manage its own Chrome locally (`PUPPETEER_SKIP_DOWNLOAD=false`) or point it at a remote browser endpoint in production.

## Project structure

Feature-based. Every feature folder under `src/features/` is self-contained (types, schema, service, controller, routes) and never imports another feature's internals directly — cross-feature interaction happens through a feature's exported service or through domain events. See the architecture document for the full reasoning.

## Next: Phase 2 — Invoices core

Customer CRUD, the Tax Engine (CGST/SGST/IGST split based on org state vs customer state), Invoice CRUD with line items, invoice number generation, PDF export, JSON export, printable view.
