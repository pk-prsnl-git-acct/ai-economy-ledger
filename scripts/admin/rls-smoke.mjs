#!/usr/bin/env node
import postgres from "postgres";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const databaseUrl = process.env.DATABASE_URL;
const reviewerUserId = process.env.RLS_SMOKE_REVIEWER_USER_ID;

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!databaseUrl || databaseUrl.startsWith("replace_")) fail("DATABASE_URL is required.");
if (reviewerUserId && !uuidPattern.test(reviewerUserId)) fail("RLS_SMOKE_REVIEWER_USER_ID must be a valid UUID when set.");

const sql = postgres(databaseUrl, { max: 1, prepare: false, ssl: "require" });

async function asRole(role, userId, query) {
  return sql.begin(async (tx) => {
    await tx.unsafe(`set local role ${role}`);
    if (userId) await tx`select set_config('request.jwt.claim.sub', ${userId}, true)`;
    return query(tx);
  });
}

try {
  let anonDenied = false;
  try {
    await asRole("anon", undefined, async (tx) => tx`select count(*) from ledger.review_queue`);
  } catch {
    anonDenied = true;
  }
  if (!anonDenied) fail("anon unexpectedly read ledger.review_queue.");

  await asRole("authenticated", "00000000-0000-4000-8000-000000000000", async (tx) => {
    const rows = await tx`select count(*)::int as count from ledger.review_queue`;
    if (rows[0].count !== 0) fail("unmapped authenticated user unexpectedly saw review queue rows.");
  });

  if (reviewerUserId) {
    await asRole("authenticated", reviewerUserId, async (tx) => {
      await tx`select count(*)::int as count from ledger.review_queue`;
    });
  }

  console.log("RLS smoke passed: anon denied, unmapped auth isolated, reviewer path checked when configured.");
} finally {
  await sql.end();
}
