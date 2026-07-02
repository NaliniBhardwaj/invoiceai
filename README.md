# InvoiceAI

AI Powered Financial Operations Platform for SMEs.

## Structure

```
backend/    Node.js + Express + TypeScript + Prisma + MySQL
frontend/   Next.js (App Router) + TypeScript + Tailwind v4
docs/       Architecture, API contracts, roadmap (added as each phase lands)
```

## Quick start

```bash
# Backend
cd backend
npm install
cp .env.example .env        # set DATABASE_URL at minimum
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev                 # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:3000
```

Register an account at `/register` — this creates your Organization, your User, and assigns you the OWNER role.

## Build status

**Phase 1 (Foundation): complete.** RBAC (Role/Permission/RolePermission/UserRole, seeded), the domain event system (EventBus + AuditLogListener), the jobs layer (scheduler + 3 stubbed jobs), the AI assistant skeleton (ToolRegistry/ConversationStore/intent-classifier interfaces), auth (register/login/JWT), and the full Next.js shell (auth pages, dashboard layout, dark mode, design system) are built and verified — see each package's own README for exactly what was tested and what's pending a normal (non-sandboxed) environment to verify (Prisma engine download, live MySQL connection, Google Fonts, shadcn registry).

**Next: Phase 2 — Invoices core.** Customer CRUD, the GST Tax Engine, Invoice CRUD with line items, PDF/JSON/printable export.

See the architecture document (shared earlier in this conversation) for the full reasoning behind RBAC, the event system, the jobs layer, the AI architecture, and the Next.js App Router decisions.
