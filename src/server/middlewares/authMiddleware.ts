// server/middlewares/authMiddleware.ts

import type { AppContext } from "@/server/contexts";
import { orpc } from "@/server/core";

export const authMiddleware = orpc
  .$context<AppContext>()
  .middleware(async ({ context, next }) => {
    let auth: "true" | "false" = "false";

    try {
      const cookieHeader = context.req.headers.get("cookie");

      if (!cookieHeader) {
        return next({ context: { ...context, auth } });
      }

      // 1️⃣ Extract token locally
      const match = cookieHeader.match(
        /__Secure-better-auth\.session_token=([^;]+)/,
      );
      const token = match ? decodeURIComponent(match[1]) : undefined;

      if (!token) {
        return next({ context: { ...context, auth } });
      }

      // 2️⃣ Validate token in DB
      const session = await context.db.query.session.findFirst({
        where: (session, { eq, gt }) =>
          eq(session.token, token) && gt(session.expiresAt, new Date()),
        columns: {
          id: true,
        },
      });

      if (session) {
        auth = "true";
      }
    } catch {
      auth = "false";
    }

    return next({
      context: {
        ...context,
        auth,
      },
    });
  });
