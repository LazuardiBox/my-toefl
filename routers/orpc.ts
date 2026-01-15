// @/routers/orpc.ts

import { createRoute } from "@tanstack/react-router";
import { createServerOnlyFn } from "@tanstack/react-start";
import { Route as RootRoute } from "@/routers/layout";
import type { AppContext } from "@/server/core";

const getServerDeps = createServerOnlyFn(async () => {
  const [{ rpcHandler }, { db }, { NotFound }, { randomBytes }] =
    await Promise.all([
      import("@/server/plugins/tanstack"),
      import("@/server/libraries/drizzle"),
      import("@/server/core"),
      import("node:crypto"),
    ]);

  return { rpcHandler, db, NotFound, randomBytes };
});

export const Route = createRoute({
  getParentRoute: () => RootRoute,
  path: "/orpc/$",
  server: {
    handlers: {
      ANY: async ({ request }: { request: Request }) => {
        const { rpcHandler, db, NotFound, randomBytes } = await getServerDeps();
        const { response } = await rpcHandler.handle(request, {
          prefix: "/orpc",
          context: {
            req: request,
            db,
            requestId: "",
            auth: "false",
          } satisfies AppContext,
        });

        if (response) {
          return response;
        }

        const notFound = NotFound({
          req: request,
          db,
          requestId: `${randomBytes(4).toString("hex")}-${Date.now()}`,
          auth: "false",
        });

        return new Response(JSON.stringify(notFound.toJSON()), {
          status: notFound.status ?? 404,
          headers: {
            "content-type": "application/json",
          },
        });
      },
    },
  },
});
