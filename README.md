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
   ├─ core/          # Core definitions (AppContext, middlewares, error helpers, orpc instance)
   ├─ functions/     # Pure business logic functions
   ├─ libraries/     # Shared libs (drizzle, etc.)
   ├─ plugins/       # Transport adapters (next.ts, hono.ts)
   ├─ private/       # Private/Protected RPC procedures (require auth)
   ├─ public/        # Public RPC procedures
   └─ routers/       # Router composition
```

## oRPC status & next steps
- Packages are installed and a sample `hello` contract/router is implemented; use it as a pattern for new endpoints.
- Suggested layout when you start:
  - `src/server/` holds your oRPC routers, plugins, middleware, schemas, and shared libs.
  - `src/client/` holds typed API clients/hooks generated from your contract (or other UI helpers).
- Typical flow:
  1) Define routers with `@orpc/server` (e.g., `src/server/public/...` or `src/server/private/...`).
  2) Export a contract and hook it into your Next.js routes or handlers.
  3) Consume it in the client with `@orpc/client` (hooks/helpers under `src/client`).

## Documentation
Detailed documentation for specific parts of the system can be found in the `.docs/` directory:
- [Auth Middleware Flow](.docs/authMiddleware.md)
- [Database Middleware](.docs/databaseMiddleware.md)
- [Public oRPC Usage](.docs/publicUsage.md)
- [Protected oRPC Usage](.docs/protectedUsage.md)

## Example: Hello endpoint (`/orpc/hello-public` & `/orpc/hello-private`)

Files involved:
- `src/server/core/index.ts` – Central definition of `orpc` instance, `AppContext`, middlewares (`authMiddleware`, `dbMiddleware`), and error helpers (`InternalServerError`, `Unauthorized`, etc.).
- `src/server/functions/Hello.ts` – Shared pure logic (database ping).
- `src/server/public/HelloRPC.ts` – Public endpoint example.
- `src/server/private/HelloRPC.ts` – Protected endpoint example.
- `src/server/routers/index.ts` – Mounts routers.

### Code Snippets

**Core Definition (Context & Middlewares)**
```ts
// src/server/core/index.ts
export type AppContext = {
  db: Drizzle;
  req: Request;
  requestId: string;
  auth: "true" | "false";
};

export const orpc = os.$context<AppContext>();

export const authMiddleware = orpc.middleware(async ({ context, next }) => {
  // ... checks cookie, verifies with DB ...
  return next({
    context: {
      ...context,
      auth, // "true" or "false"
    },
  });
});

export const dbMiddleware = orpc.middleware(async ({ context, next }) => {
  return db.transaction(async (tx) => {
    return next({
      context: {
        ...context,
        db: tx, // inject transaction
      },
    });
  });
});
```

**Service Example (Public)**
```ts
// src/server/public/HelloRPC.ts
export const HelloPublicRPC = core.orpc
  .use(core.dbMiddleware)
  .use(onStart(HelloStart))
  .route({ method: "GET", path: "/hello-public" })
  .input(HelloInput)
  .output(HelloOutput)
  .handler(async ({ context }) => {
     const result = await HelloFunction(context);
     return core.Success(context, result.response);
  });
```

**Service Example (Protected)**
```ts
// src/server/private/HelloRPC.ts
export const HelloPrivateRPC = core.orpc
  .use(core.authMiddleware) // Applied auth middleware
  .use(core.dbMiddleware)
  .route({ method: "GET", path: "/hello-private" })
  // ...
  .handler(async ({ context }) => {
     if (context.auth !== "true") {
       throw core.Unauthorized(context);
     }
     // ...
  });
```
