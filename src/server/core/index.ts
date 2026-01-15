// @/src/server/core/index.ts

/* ----------------- Import Module ----------------------- */

import { ORPCError, os } from "@orpc/server";
import type { Drizzle } from "@/server/libraries/drizzle";
import { db } from "@/server/libraries/drizzle";

/* ----------------- AppContext Type ----------------------- */

export type AppContext = {
  db: Drizzle;
  req: Request;
  requestId: string;
  auth: "true" | "false";
};

/* ----------------- oRPC Instance ----------------------- */

export const orpc = os.$context<AppContext>();

/* ----------------- oRPC Auth Middleware ----------------------- */

export const authMiddleware = orpc.middleware(async ({ context, next }) => {
  let auth: "true" | "false" = "false";

  try {
    const cookieHeader = context.req.headers.get("cookie");

    if (!cookieHeader) {
      return next({ context: { ...context, auth } });
    }

    // 1️⃣ Extract token locally
    const match = cookieHeader.match(
      /(?:__Secure-)?better-auth\.session_token=([^;]+)/,
    );
    const token = match
      ? decodeURIComponent(match[1]).split(".")[0]
      : undefined;

    if (!token) {
      return next({ context: { ...context, auth } });
    }

    // 2️⃣ Validate token in DB
    const session = await context.db.query.session.findFirst({
      where: (session, { eq, gt, and }) =>
        and(eq(session.token, token), gt(session.expiresAt, new Date())),
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

/* ----------------- oRPC Database Middleware ----------------------- */

export const dbMiddleware = orpc.middleware(async ({ context, next }) => {
  return db.transaction(async (tx) => {
    return next({
      context: {
        ...context,
        db: tx,
      },
    });
  });
});

/* ----------------- oRPC HTTP Response Function ----------------------- */

/** @public */
export function InternalServerError(context: AppContext) {
  return new ORPCError("HTTP/1.1 500 Internal Server Error", {
    status: 500,
    message: "An unexpected error occurred while processing this request.",
    data: {
      requestId: context.requestId,
    },
  });
}

/** @public */
export function Unauthorized(context: AppContext) {
  return new ORPCError("HTTP/1.1 401 Unauthorized", {
    status: 401,
    message: "An unexpected error occurred while processing this request.",
    data: {
      requestId: context.requestId,
    },
  });
}

/** @public */
export function BadRequest(context: AppContext) {
  return new ORPCError("HTTP/1.1 400 Bad Request", {
    status: 400,
    message: "An unexpected error occurred while processing this request.",
    data: {
      requestId: context.requestId,
    },
  });
}

/** @public */
export function Forbidden(context: AppContext) {
  return new ORPCError("HTTP/1.1 403 Forbidden", {
    status: 403,
    message: "An unexpected error occurred while processing this request.",
    data: {
      requestId: context.requestId,
    },
  });
}

/** @public */
export function NotFound(context: AppContext) {
  return new ORPCError("HTTP/1.1 404 Not Found", {
    status: 404,
    message: "An unexpected error occurred while processing this request.",
    data: {
      requestId: context.requestId,
    },
  });
}

/** @public */
export function MethodNotAllowed(context: AppContext) {
  return new ORPCError("HTTP/1.1 405 Method Not Allowed", {
    status: 405,
    message: "An unexpected error occurred while processing this request.",
    data: {
      requestId: context.requestId,
    },
  });
}

/** @public */
export function NotAcceptable(context: AppContext) {
  return new ORPCError("HTTP/1.1 406 Not Acceptable", {
    status: 406,
    message: "An unexpected error occurred while processing this request.",
    data: {
      requestId: context.requestId,
    },
  });
}

/** @public */
export function Success(context: AppContext, result: string) {
  return {
    data: {
      result,
      requestId: context.requestId,
    },
  };
}
