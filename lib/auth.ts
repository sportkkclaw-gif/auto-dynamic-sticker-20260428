/**
 * lib/auth.ts
 *
 * Demo auth utilities backed by Prisma DB.
 * In production replace with real JWT/OAuth.
 */

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type Role = "ADMIN" | "EDITOR" | "USER";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

export interface AuthResult {
  success: true;
  user: SessionUser;
  token: string;
}

export interface AuthFailure {
  success: false;
  error: string;
}

// ─── Demo token helpers ───────────────────────────────────────────────────────

/**
 * Decode a demo token → SessionUser (or null).
 * Token format: base64(JSON.stringify(user)) for demo only.
 */
export function decodeDemoToken(token: string): SessionUser | null {
  try {
    const payload = Buffer.from(token, "base64").toString("utf-8");
    return JSON.parse(payload) as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Encode a SessionUser into a demo token.
 */
export function encodeDemoToken(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

// ─── DB availability probe ─────────────────────────────────────────────────────

/**
 * Returns true only when Prisma can successfully execute a trivial query.
 * Used to gate DB-dependent code paths in preview/no-DB environments.
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    // Lightweight probe — findFirst on a model that always exists, no filter
    await prisma.user.findFirst({ select: { id: true }, take: 1 });
    return true;
  } catch {
    return false;
  }
}

// ─── Seeded fallback users ─────────────────────────────────────────────────────

const DEMO_USERS: Array<SessionUser & { password: string }> = [
  { id: "user_admin_01", email: "admin@demo.local", name: "Admin User", role: "ADMIN", password: "admin123" },
  { id: "user_editor_01", email: "editor@demo.local", name: "Editor User", role: "EDITOR", password: "editor123" },
  { id: "user_viewer_01", email: "viewer@demo.local", name: "Viewer User", role: "USER", password: "viewer123" },
];

// ─── Functions ────────────────────────────────────────────────────────────────

/**
 * Verify credentials against DB and return a session token.
 * Falls back to seeded in-memory credentials when the database is unavailable
 * (e.g. Vercel Preview without DATABASE_URL configured).
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthResult | AuthFailure> {
  // ── Try DB path ─────────────────────────────────────────────────────────────
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Demo mode: plaintext comparison (production must use bcrypt)
      if (user.password !== password) {
        return { success: false, error: "Invalid email or password." };
      }
      const sessionUser: SessionUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role,
      };
      const token = Array.from({ length: 32 }, () =>
        Math.random().toString(36).charAt(2)
      ).join("");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await prisma.session.create({ data: { userId: user.id, token, expiresAt } });
      return { success: true, user: sessionUser, token };
    }
    // User not found in DB — fall through to seeded fallback
  } catch (dbErr) {
    // DB unavailable (e.g. no DATABASE_URL on Vercel Preview) — use seeded fallback
    console.warn("[auth] DB unavailable, using seeded fallback:", dbErr instanceof Error ? dbErr.message : String(dbErr));
  }

  // ── Seeded fallback (preview / no-DB path) ─────────────────────────────────
  const demoUser = DEMO_USERS.find((u) => u.email === email && u.password === password);
  if (!demoUser) {
    return { success: false, error: "Invalid email or password." };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...sessionUser } = demoUser;
  const token = Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join("");
  return { success: true, user: sessionUser, token };
}

/**
 * Retrieve the current session user from the request cookie.
 * Returns null if not authenticated.
 *
 * Demo token (base64-encoded JSON) is always parseable without DB.
 * DB session lookup is attempted only when the token is not a demo token.
 * If DB is unavailable and token is not a valid demo token, returns null.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  // ── Fast path: decode demo token (no DB required) ───────────────────────────
  const decoded = decodeDemoToken(token);
  if (decoded) return decoded;

  // ── DB path: look up session (only attempted when DB is likely available) ───
  // If DB is unavailable, skip DB lookup entirely to avoid propagating 500.
  if (!(await isDatabaseAvailable())) {
    // DB unavailable and token is not a recognised demo token → treat as unauthenticated
    return null;
  }

  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
      return null;
    }
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as Role,
    };
  } catch {
    // DB error (e.g. connection lost mid-request) → treat as unauthenticated
    return null;
  }
}

// ─── RBAC Permission Matrix ───────────────────────────────────────────────────

export type Permission =
  | "project:create" | "project:read" | "project:update" | "project:delete"
  | "asset:upload"
  | "stylelock:create"
  | "brief:generate"
  | "sticker:render"
  | "motion:apply"
  | "qc:run"
  | "export:create" | "export:download"
  | "credit:purchase" | "billing:read"
  | "admin:template:write"
  | "admin:riskRule:write"
  | "audit:read";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "project:create", "project:read", "project:update", "project:delete",
    "asset:upload", "stylelock:create", "brief:generate",
    "sticker:render", "motion:apply", "qc:run",
    "export:create", "export:download",
    "credit:purchase", "billing:read",
    "admin:template:write", "admin:riskRule:write", "audit:read",
  ],
  EDITOR: [
    "project:create", "project:read", "project:update",
    "asset:upload", "stylelock:create", "brief:generate",
    "sticker:render", "motion:apply", "qc:run",
    "export:create", "export:download",
  ],
  USER: [
    "project:read",
    "export:download",
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Require permission — returns error message if not authorized, null if OK.
 */
export function requirePermission(role: Role, permission: Permission): string | null {
  if (!hasPermission(role, permission)) {
    return `Forbidden: ${role} does not have permission '${permission}'.`;
  }
  return null;
}