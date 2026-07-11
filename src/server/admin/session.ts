import "server-only";

import { cookies } from "next/headers";
import postgres from "postgres";

export type AppRole = "reviewer" | "admin";

export type AdminSession =
  | {
      status: "authorized";
      user: { id: string; email: string | null };
      roles: AppRole[];
    }
  | {
      status: "unauthenticated" | "forbidden" | "configuration_error";
      reason: string;
      user?: { id: string; email: string | null };
      roles?: AppRole[];
    };

type CookieValue = { name: string; value: string };
type CookieReader = { getAll(): CookieValue[] };

const ROLE_ORDER: Record<AppRole, number> = { reviewer: 1, admin: 2 };

function envValue(name: string) {
  const value = process.env[name];
  return value && !value.startsWith("replace_") ? value : undefined;
}

function supabaseUrl() {
  return envValue("SUPABASE_URL") ?? envValue("NEXT_PUBLIC_SUPABASE_URL");
}

function supabasePublishableKey() {
  return envValue("SUPABASE_PUBLISHABLE_KEY") ?? envValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

function decodeCookieValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function decodeBase64Json(value: string) {
  const encoded = value.replace(/^base64-/, "").replaceAll("-", "+").replaceAll("_", "/");
  const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as unknown;
}

function tokenFromStructuredCookie(value: string) {
  const decoded = decodeCookieValue(value);
  const candidates = [decoded];

  if (decoded.startsWith("base64-")) {
    try {
      candidates.push(JSON.stringify(decodeBase64Json(decoded)));
    } catch {
      return undefined;
    }
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0];
      if (parsed && typeof parsed === "object") {
        const session = parsed as { access_token?: unknown; currentSession?: { access_token?: unknown } };
        if (typeof session.access_token === "string") return session.access_token;
        if (typeof session.currentSession?.access_token === "string") return session.currentSession.access_token;
      }
    } catch {
      continue;
    }
  }

  return undefined;
}

export function extractSupabaseAccessToken(cookieReader: CookieReader) {
  const allCookies = cookieReader.getAll();
  const direct = allCookies.find((cookie) =>
    ["sb-access-token", "supabase-access-token", "supabase_access_token"].includes(cookie.name),
  );
  if (direct?.value) return decodeCookieValue(direct.value);

  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
      const token = tokenFromStructuredCookie(cookie.value);
      if (token) return token;
    }
  }

  return undefined;
}

async function getSupabaseUser(accessToken: string) {
  const url = supabaseUrl();
  const key = supabasePublishableKey();
  if (!url || !key) {
    throw new Error("Supabase URL and publishable key are required for admin authentication");
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    headers: {
      apikey: key,
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) return undefined;
  const user = (await response.json()) as { id?: unknown; email?: unknown };
  if (typeof user.id !== "string") return undefined;
  return { id: user.id, email: typeof user.email === "string" ? user.email : null };
}

async function getUserRoles(userId: string) {
  const databaseUrl = envValue("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for admin role checks");
  }

  const sql = postgres(databaseUrl, { max: 1, prepare: false, ssl: "require" });
  try {
    const rows = await sql<{ role: AppRole }[]>`
      select role
      from private.app_user_roles
      where user_id = ${userId}
      order by role
    `;
    return rows.map((row) => row.role).filter((role): role is AppRole => role === "reviewer" || role === "admin");
  } finally {
    await sql.end();
  }
}

export function roleMeetsMinimum(roles: AppRole[], minimumRole: AppRole) {
  return roles.some((role) => ROLE_ORDER[role] >= ROLE_ORDER[minimumRole]);
}

export async function getAdminSession(minimumRole: AppRole = "reviewer"): Promise<AdminSession> {
  let accessToken: string | undefined;
  try {
    accessToken = extractSupabaseAccessToken(await cookies());
  } catch {
    return { status: "unauthenticated", reason: "No readable Supabase session cookie was found." };
  }

  if (!accessToken) {
    return { status: "unauthenticated", reason: "A Supabase session is required for admin access." };
  }

  try {
    const user = await getSupabaseUser(accessToken);
    if (!user) return { status: "unauthenticated", reason: "The Supabase session is invalid or expired." };

    const roles = await getUserRoles(user.id);
    if (!roleMeetsMinimum(roles, minimumRole)) {
      return { status: "forbidden", reason: "The authenticated user has no required app role.", user, roles };
    }

    return { status: "authorized", user, roles };
  } catch (error) {
    return {
      status: "configuration_error",
      reason: error instanceof Error ? error.message : "Admin authentication could not be evaluated.",
    };
  }
}
