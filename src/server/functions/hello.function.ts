// src/server/functions/pingDatabase.ts

import type { Drizzle } from "@/server/libraries/drizzle";

export async function pingDatabase(database: Drizzle) {
  const startedAt = performance.now();
  await database.execute("select 1");
  const endedAt = performance.now();

  return {
    response: `PONG in ${Math.round(endedAt - startedAt)}ms`,
  };
}
