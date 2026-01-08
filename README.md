# toefl.wiki (orpc)

Next.js app bootstrapped with Bun and pre-wired to use oRPC for an end-to-end type-safe API. A sample `hello` endpoint is wired through oRPC; extend or replace it as you build out the API.

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
├─ app/              # Next.js App Router entry (layout, globals, landing page)
├─ client/           # Frontend-only utilities (no oRPC server code)
│  ├─ assets/
│  ├─ components/
│  ├─ contexts/
│  ├─ hooks/
│  ├─ libraries/
│  ├─ pages/
│  └─ utilities/
└─ server/           # oRPC backend
   ├─ contexts/      # Service context builders (db/user/session loaders)
   ├─ core/          # Singleton oRPC instance/wiring
   ├─ functions/     # Pure business logic (no transport concerns)
   ├─ libraries/     # Shared libs (e.g., drizzle.ts, redis.ts)
   ├─ middlewares/   # oRPC middlewares used via `.use`
   ├─ plugins/       # Transport adapters (Next.js routes, Hono, etc.)
   ├─ routers/       # oRPC router composition (index.ts, nesting only)
   └─ services/      # Service groupings (optionally host function bundles)
```

## oRPC status & next steps
- Packages are installed and a sample `hello` contract/router is implemented; use it as a pattern for new endpoints.
- Suggested layout when you start:
  - `src/server/` holds your oRPC routers, plugins, middleware, schemas, and shared libs.
  - `src/client/` holds typed API clients/hooks generated from your contract (or other UI helpers).
- Typical flow:
  1) Define routers with `@orpc/server` (e.g., `src/server/routers/...`).
  2) Export a contract and hook it into your Next.js routes or handlers.
  3) Consume it in the client with `@orpc/client` (hooks/helpers under `src/client`).

## Documentation
Detailed documentation for specific parts of the system can be found in the `docs/` directory:
- [Auth Middleware Flow](docs/authMiddleware.md)
- [Database Middleware](docs/databaseMiddleware.md)
- [Public oRPC Usage](docs/publicUsage.md)
- [Protected oRPC Usage](docs/protectedUsage.md)

## Example: Hello endpoint (`/orpc/hello-public` & `/orpc/hello-protected`)

Files involved:
- `src/server/core/index.ts` – `orpc` instance with context typing (`AppContext`).
- `src/server/libraries/drizzle.ts` – Drizzle client with `authSchema` registered.
- `src/server/contexts/index.ts` – `AppContext` shape including `req` and `auth` status.
- `src/server/middlewares/databaseMiddleware.ts` – wrappers for transaction safety.
- `src/server/middlewares/authMiddleware.ts` – cookie-based auth verification (cookie -> db check).
- `src/server/functions/hello.function.ts` – shared pure logic (database ping).
- `src/server/services/public/hello.service.ts` – Public endpoint example.
- `src/server/services/auth/hello.service.ts` – Protected endpoint example.
- `src/server/routers/index.ts` – mounts routers with kebab-case keys.

### Code Snippets

**Context Definition**
```ts
// server/contexts/index.ts
import type { Drizzle } from "@/server/libraries/drizzle";

export type AppContext = {
  db: Drizzle;
  req: Request;
  requestId: string;
  status: string;
  auth: "true" | "false";
};
```

**Drizzle Client**
```ts
// server/libraries/drizzle.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/server/libraries/authSchema";

const client = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
  // ... timeouts
});

export const db = drizzle(client, { schema });
```

**Auth Middleware (High Performance)**
```ts
// server/middlewares/authMiddleware.ts
export const authMiddleware = orpc
    .$context<AppContext>()
    .middleware(async ({ context, next }) => {
        // 1. Check & Parse Cookie Locally (No external Fetch)
        const cookieHeader = context.req.headers.get("cookie");
        // ... (extract token via Regex)

        // 2. Direct Index-Optimized DB Lookup
        // ... (query session table for token existence)

        return next({
            context: { ...context, auth: isValid ? "true" : "false" },
        });
    });
```

**Service Example (Protected)**
```ts
// server/services/auth/hello.service.ts
export const hello_protected = orpc
  .use(authMiddleware)
  .use(databaseMiddleware)
  .use(onStart(hello_cycle_start))
  .route({ method: "GET", path: "/hello-protected" })
  .input(z.object({}).optional())
  .output(hello_output)
  .handler(async ({ context }) => {
     if (context.auth !== "true") {
         return { status: "HTTP/1.1 401 Unauthorized", ... };
     }
     // ... business logic
  });
```

**Router Composition**
```ts
// server/routers/index.ts
export const appRouter = orpc.router({
  "hello-public": hello_public,
  "hello-protected": hello_protected,
});
```

## Notes
- The included UI in `src/app/(pages)/page.tsx` is already wired to `hello`; extend it or replace it with your own pages.
