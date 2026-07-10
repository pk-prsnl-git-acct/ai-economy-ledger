import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

export type LedgerDatabase = ReturnType<typeof createLedgerDatabase>["db"];

export function createLedgerDatabase(databaseUrl: string) {
  if (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://")) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection URI");
  }

  const client = postgres(databaseUrl, {
    max: 1,
    prepare: false,
    ssl: "require",
  });

  return {
    client,
    db: drizzle(client, { schema }),
  };
}
