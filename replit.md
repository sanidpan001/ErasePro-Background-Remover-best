# ErasePro Background Remover

ErasePro removes image backgrounds locally in the browser and exports a transparent PNG without sign-in, watermarks, subscriptions, or API keys.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/erasepro/src/App.tsx` — the single-page upload, processing, comparison, and download experience.
- `artifacts/erasepro/src/index.css` — ErasePro visual tokens, responsive styling, transparency checkerboard, and motion.
- `artifacts/erasepro/index.html` — page title and search/social metadata.

## Architecture decisions

- Background removal is intentionally client-only through `@imgly/background-removal`; image bytes are not sent to the shared API server.
- The page keeps the processing state local and revokes object URLs when replacing or resetting an image to avoid unnecessary browser memory usage.
- The 10MB limit and accepted MIME types are enforced before the removal engine starts.

## Product

Users can click or drag in a JPG, PNG, or WEBP (up to 10MB), watch local processing progress, compare the original to the transparent result, and download `erasepro-removed.png`. The page also includes trust messaging, feature explanations, and empty ad slots for future placement.

## User preferences

The product must remain free, browser-only, and free of login, signup, watermark, pricing, and subscription flows.

## Gotchas

The removal model may take a moment to load on its first use because it runs in the browser; the UI exposes progress and a clear error/reset state rather than hiding the work.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
