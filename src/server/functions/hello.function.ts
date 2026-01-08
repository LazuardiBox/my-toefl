// src/server/functions/pingDatabase.ts

import type { Drizzle } from "@/server/libraries/drizzle";

export async function pingDatabase(database: Drizzle, maxMs = 28) {
  const startedAt = performance.now();

  await database.execute("select 1");

  const endedAt = performance.now();
  const duration = endedAt - startedAt;

  if (duration > maxMs) {
    throw new Error();
  }

  return {
    response: `PONG in ${Math.round(duration)}ms`,
  };
}
