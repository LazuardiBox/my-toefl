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
- Packages are installed, but no routers/contracts are defined yet.
- Suggested layout when you start:
  - `src/server/` holds your oRPC routers, plugins, middleware, schemas, and shared libs.
  - `src/client/` holds typed API clients/hooks generated from your contract (or other UI helpers).
- Typical flow:
  1) Define routers with `@orpc/server` (e.g., `src/server/routers/...`).
  2) Export a contract and hook it into your Next.js routes or handlers.
  3) Consume it in the client with `@orpc/client` (hooks/helpers under `src/client`).

## Example: Hello endpoint (`/orpc/test/hello`)
Files involved:
- `src/server/functions/hello.function.ts` – pure logic returning `{ message: "Hello World" }`.
- `src/server/services/hello.service.ts` – builds the procedure with route/input/output/handler and exposes `hello_router` `{ hello: procedure }`.
- `src/server/routers/index.ts` – mounts the domain router: `orpc.router({ test: hello_router })`.
- `src/client/utilities/api.ts` – oRPC client (`api.test.hello({})`), respects `ORPC_SERVER_URL`/`NEXT_PUBLIC_APP_URL` or window origin.
- `src/client/hooks/hello.ts` – React Query hook calling `api.test.hello`.
- `src/app/(pages)/page.tsx` – UI that triggers the call via a button.

Call shape: RPC path `/orpc/test/hello` (no auto-fetch; button triggers `refetch`).

Code:
```ts
// src/server/functions/hello.function.ts

export async function logic() {
  return { message: "Hello World" };
}
```

```ts
// src/server/services/hello.service.ts

import { orpc } from "@/server/core";
import { logic } from "@/server/functions/hello.function";
import { z } from "zod";

const hello_route = { method: "GET", path: "/hello" } as const;
const hello_input = z.object({});
const hello_output = z.object({ message: z.string() });
const hello_logic = async () => logic();

export const hello_router = {
  hello: orpc
    .route(hello_route)
    .input(hello_input)
    .output(hello_output)
    .handler(hello_logic)
    .actionable(),
};
```

```ts
// src/server/routers/index.ts

import { orpc } from "@/server/core";
import { hello_router } from "@/server/services/hello.service";

export const appRouter = orpc.router({
  test: hello_router,
});
```

```ts
// src/client/utilities/api.ts

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { appRouter } from "@/server/routers";

const rpcLink = new RPCLink({
  url: () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/orpc`;
    }
    const origin =
      process.env.ORPC_SERVER_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";
    return `${origin}/orpc`;
  },
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
    queryFn: () => api.test.hello({}),
    enabled,
  });
}
```

```tsx
// src/app/(pages)/page.tsx

"use client";
import { useState } from "react";
import { useHelloQuery } from "@/client/hooks/hello";

function HelloContent() {
  const [hasRequested, setHasRequested] = useState(false);
  const { data, isFetching, error, refetch } = useHelloQuery(false);

  return (
    <div className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Hello Endpoint
        </p>
        <p className="text-xl font-semibold text-zinc-900">
          {hasRequested
            ? data?.message ?? "No message yet"
            : "Click the button to call the API"}
        </p>
      </div>
      {error ? (
        <p className="text-sm text-red-600">
          Error: {(error as Error).message ?? "Unknown error"}
        </p>
      ) : null}
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
          onClick={() => setHasRequested(false)}
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
- This repo currently ships the default Next.js landing page in `src/app/page.tsx`; replace it with your UI and wire it to your oRPC client once the API is ready.
