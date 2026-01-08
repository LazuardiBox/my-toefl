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
