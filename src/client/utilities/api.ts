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
