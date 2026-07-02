# InvoiceAI Frontend

Next.js App Router + TypeScript + Tailwind v4 + shadcn-style components + TanStack Query.

## Setup

```bash
npm install
cp .env.example .env.local   # point NEXT_PUBLIC_API_URL at your running backend
npm run dev
```

Visit `http://localhost:3000`. You'll be redirected to `/login` until you register/sign in against the backend.

## Status: Phase 1 (Foundation) complete

- **Route groups** — `(auth)` for `/login` and `/register` (split-panel layout), `(dashboard)` for the authenticated app shell (sidebar + top bar), each with their own `layout.tsx`.
- **Auth flow** — full login/register forms (React Hook Form + Zod, validation mirrors the backend's schemas), `AuthProvider` context persisting the session, an Axios instance with automatic JWT attachment and 401-redirect handling.
- **Loading/error states as framework primitives** — `(dashboard)/dashboard/loading.tsx` and `error.tsx` use Next's Suspense/error-boundary conventions rather than hand-rolled conditionals.
- **Dark mode** — `next-themes`, toggle in the top bar, full light/dark token set in `globals.css`.
- **Design system** — see "Design tokens" below. Core primitives (`Button`, `Card`, `Input`, `Label`, `Badge`, `Skeleton`, `Separator`) built by hand following shadcn's standard shape, since `npx shadcn init` couldn't reach its registry from the build sandbox this was developed in — `components.json` is in place so `npx shadcn add <component>` works normally going forward.
- **Command-palette-ready** — the top bar's search input is laid out and styled as the eventual ⌘K trigger; wiring it up to a real palette is deferred until there's invoice/customer data worth searching (Phase 6+).

## Design tokens

A ledger-inspired palette rather than a generic SaaS default: warm paper background, deep verdigris (teal-green) primary accent, amber for tax/GST highlights, crimson for errors/overdue. Every monetary figure and document number should use the `.figure-numeric` utility class (Geist Mono, tabular figures) so columns of numbers align — this is the one consistent signature detail to carry through every later screen (invoice tables, reconciliation reports, dashboard cards).

## NOT verified in this sandbox

- `npx shadcn add <component>` itself — blocked here (registry at `ui.shadcn.com` unreachable from this build environment), but `components.json` is configured correctly and this will work in your normal dev environment.
- Live integration against the backend — no requests were actually made to a running Express server; forms and hooks are wired correctly against the documented API contract but haven't been exercised end-to-end. Run both `backend` and `frontend` together to verify.

## Next: Phase 2 frontend work

Once Invoice/Customer endpoints exist on the backend: the invoices list/detail/create routes under `(dashboard)/invoices/`, using the same `features/<name>/{components,hooks,services,types,validation}` structure as `features/auth`.
