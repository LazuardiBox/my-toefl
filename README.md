# toefl.wiki (orpc)

Next.js app bootstrapped with Bun and pre-wired to use oRPC for an end-to-end type-safe API. The API surface is **not implemented yet**—dependencies are installed so you can start wiring oRPC routers when ready.

## Stack
- Next.js 16 (App Router)
- React 19
- Bun runtime
- oRPC (`@orpc/server` and `@orpc/client`)
- Biome for lint/format

## Getting started
```bash
bun install          # install deps
bun run dev          # start Next.js dev server
bun run build        # production build
bun run start        # run built app
bun run lint         # biome check
bun run format       # biome format --write
```

## Project structure
```
src/
└─ app/              # Next.js App Router entry (layout, globals, landing page)
```

## oRPC status & next steps
- Packages are installed, but no routers/contracts are defined yet.
- Suggested layout when you start:
  - `src/server/` for oRPC routers, plugins, middleware, schemas.
  - `src/client/` for typed API clients/hooks generated from your contract.
- Typical flow:
  1) Define routers with `@orpc/server` (e.g., `src/server/routers/...`).
  2) Export a contract and hook it into your Next.js routes or handlers.
  3) Consume it in the client with `@orpc/client` (hooks/helpers under `src/client`).

## Notes
- This repo currently ships the default Next.js landing page in `src/app/page.tsx`; replace it with your UI and wire it to your oRPC client once the API is ready.
