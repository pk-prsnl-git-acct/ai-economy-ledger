#!/usr/bin/env node
import postgres from "postgres";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const databaseUrl = process.env.DATABASE_URL;
const userId = process.env.ADMIN_BOOTSTRAP_USER_ID;
const role = process.env.ADMIN_BOOTSTRAP_ROLE ?? "admin";
const grantedBy = process.env.ADMIN_BOOTSTRAP_GRANTED_BY;

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!databaseUrl || databaseUrl.startsWith("replace_")) fail("DATABASE_URL is required.");
if (!userId || !uuidPattern.test(userId)) fail("ADMIN_BOOTSTRAP_USER_ID must be a valid auth.users UUID.");
if (!["reviewer", "admin"].includes(role)) fail("ADMIN_BOOTSTRAP_ROLE must be reviewer or admin.");
if (grantedBy && !uuidPattern.test(grantedBy)) fail("ADMIN_BOOTSTRAP_GRANTED_BY must be a valid UUID when set.");

const sql = postgres(databaseUrl, { max: 1, prepare: false, ssl: "require" });

try {
  await sql`
    insert into private.app_user_roles (user_id, role, granted_by)
    values (${userId}, ${role}, ${grantedBy ?? null})
    on conflict (user_id, role) do nothing
  `;
  console.log(`Bootstrapped ${role} role for ${userId}.`);
} finally {
  await sql.end();
}
