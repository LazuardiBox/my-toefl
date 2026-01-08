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
