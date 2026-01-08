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

## Example: Hello endpoint (`/orpc/hello`)
Core/context:
- `src/server/core/index.ts` – `orpc` instance typed with `AppContext`.
- `src/server/contexts/index.ts` – defines `AppContext` (db + request lifecycle metadata), filled by middleware.

Files involved:
- `src/server/core/index.ts` – `orpc` instance with context typing (`AppContext`).
- `src/server/libraries/drizzle.ts` – Drizzle base client and types for base/transaction DB.
- `src/server/contexts/index.ts` – `AppContext` shape (db + timing/status fields).
- `src/server/middlewares/databaseMiddleware.ts` – wraps requests in a transaction and injects `db`.
- `src/server/functions/hello.function.ts` – pure logic: ping DB and return timing.
- `src/server/services/hello.service.ts` – route/input/output + lifecycle hooks, returns metadata.
- `src/server/routers/index.ts` – mounts the domain router: `orpc.router({ hello })`.
- `src/client/utilities/api.ts` – oRPC client (`api.hello({})`), respects `ORPC_SERVER_URL`/`NEXT_PUBLIC_APP_URL` or window origin.
- `src/client/hooks/hello.ts` – React Query hook calling `api.hello`.
- `src/app/(pages)/page.tsx` – UI that triggers the call and renders JSON.

Call shape: RPC path `/orpc/hello` (no auto-fetch; button triggers `refetch`).

Code:
```ts
// server/core/orpc.ts

import { os } from '@orpc/server'
import type { AppContext } from '@/server/contexts'

export const orpc = os.$context<AppContext>()
```

```ts
// server/contexts/index.ts

import type { Drizzle } from '@/server/libraries/drizzle'

export type AppContext = {
    db: Drizzle
    requestId: string
    requestedAt: string
    status: string
    error?: string
}
```

```ts
// server/libraries/drizzle.ts

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const client = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
})

export const db = drizzle(client)
export type Drizzle = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0]
```

```ts
// src/server/functions/pingDatabase.ts

import type { Drizzle } from '@/server/libraries/drizzle'

export async function pingDatabase(database: Drizzle) {
  const startedAt = performance.now()
  await database.execute('select 1')
  const endedAt = performance.now()

  return {
    response: `PONG in ${Math.round(endedAt - startedAt)}ms`,
  }
}
```

```ts
// server/middlewares/databaseMiddleware.ts

import type { AppContext } from "@/server/contexts";
import { orpc } from "@/server/core";
import { db } from "@/server/libraries/drizzle";

export const databaseMiddleware = orpc
  .$context<AppContext>()
  .middleware(async ({ context, next }) => {
    return db.transaction(async (tx) => {
      return next({
        context: {
          ...context,
          db: tx,
        },
      });
    });
  });
```

```ts

/* ----------------- import procedure ----------------------- */

import { randomBytes } from "node:crypto";
import { onStart } from "@orpc/server";
import { z } from "zod";
import { orpc } from "@/server/core";
import { pingDatabase } from "@/server/functions/hello.function";
import { databaseMiddleware } from "@/server/middlewares/databaseMiddleware";
import type { AppContext } from "@/server/contexts";

/* ----------------- expose procedure ----------------------- */

const hello_route = {
  method: "GET",
  path: "/hello",
} as const;

/* ----------------- schema procedure ----------------------- */

const hello_output = z.object({
  result: z.string(),
  status: z.literal("HTTP/1.1 200 OK").or(z.literal("HTTP/1.1 500 Internal Server Error")),
  requestId: z.string(),
});

/* ----------------- lifecycle hooks ----------------------- */

function hello_cycle_start({ context }: { context: AppContext }) {
  context.requestId = `${randomBytes(4).toString("hex")}-${Date.now()}`;
}

/* ----------------- function hooks ----------------------- */

async function hello_function({ context }: { context: AppContext }) {
  try {
    const result = await pingDatabase(context.db);

    return {
      status: "HTTP/1.1 200 OK" as const,
      requestId: context.requestId,
      result: result.response,
    };
  } catch (_error) {
    return {
      status: "HTTP/1.1 500 Internal Server Error" as const,
      requestId: context.requestId,
      result: "An unexpected error occurred while processing your request.",
    };
  }
}
/* ----------------- router procedure ----------------------- */

export const hello = orpc
  .use(databaseMiddleware)
  .use(onStart(hello_cycle_start))
  .route(hello_route)
  .output(hello_output)
  .handler(hello_function);
```

```ts
// server/routers/index.ts

import { orpc } from "@/server/core";
import { hello } from "@/server/services/hello.service";

/* ----------------- router procedure ----------------------- */

export const appRouter = orpc.router({
  hello,
});
```

```ts
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";

import type { appRouter } from "@/server/routers";

const rpcLink = new RPCLink({
  url: `${process.env.NEXT_PUBLIC_ORPC_SERVER_URL}/orpc`,
  headers: async () => {
    if (typeof window !== "undefined") {
      return new Headers();
    }

    const { headers } = await import("next/headers");
    return new Headers(await headers());
  },
});

type AppRouterClient = RouterClient<typeof appRouter>;

export const api = createORPCClient<AppRouterClient>(rpcLink);
```

```ts
// src/client/hooks/hello.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/client/utilities/api";

export function useHelloQuery(enabled = false) {
  return useQuery({
    queryKey: ["hello"],
    queryFn: () => api.hello({}),
    enabled,
  });
}
```

```tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useState } from "react";

import { useHelloQuery } from "@/client/hooks/hello";

function HelloContent() {
  const queryClient = useQueryClient();
  const [hasRequested, setHasRequested] = useState(false);
  const { data, isFetching, error, refetch, isFetched } = useHelloQuery(false);

  const statusLabel = (() => {
    if (isFetching) return "Loading";
    if (error) return "Error";
    if (hasRequested && isFetched) return "Success";
    return "Idle";
  })();

  return (
    <div className="w-full max-w-3xl space-y-6 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Hello Endpoint
          </p>
          <p className="text-xl font-semibold text-zinc-900">
            {data?.result ?? "Call the API to see the response"}
          </p>
        </div>
        <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">
          {statusLabel}
        </span>
      </div>
      {error ? (
        <p className="text-sm text-red-600">
          Error: {(error as Error).message ?? "Unknown error"}
        </p>
      ) : null}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-zinc-800">JSON Response</p>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm text-zinc-800">
          <pre className="whitespace-pre-wrap break-words">
            {data
              ? JSON.stringify(data, null, 2)
              : "// No response yet. Call the API to view the payload."}
          </pre>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={async () => {
            setHasRequested(true);
            await refetch();
          }}
          className="flex flex-1 items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 active:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isFetching}
        >
          {isFetching ? "Calling..." : "Call API"}
        </button>
        <button
          type="button"
          onClick={() => {
            setHasRequested(false);
            queryClient.resetQueries({ queryKey: ["hello"] });
          }}
          className="flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 active:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isFetching && hasRequested}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 font-sans">
      <HelloContent />
    </main>
  );
}
```

## Notes
- The included UI in `src/app/(pages)/page.tsx` is already wired to `hello`; extend it or replace it with your own pages.
