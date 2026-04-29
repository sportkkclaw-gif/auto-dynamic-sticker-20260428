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

// ─── Demo users (must match seed.ts IDs) ─────────────────────────────────────
// For production this map is irrelevant — credentials are verified via DB.

// ─── Functions ───────────────────────────────────────────────────────────────

/**
 * Verify credentials against DB and return a session token.
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthResult | AuthFailure> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: "Invalid email or password." };
  }

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

  // Generate a random session token
  const token = Array.from({ length: 32 }, () =>
    Math.random().toString(36).charAt(2)
  ).join("");

  // Store session in DB
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  return { success: true, user: sessionUser, token };
}

/**
 * Retrieve the current session user from the request cookie.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  // Try to decode as base64-encoded JSON (demo token format from login)
  const decoded = decodeDemoToken(token);
  if (decoded) return decoded;

  // Fallback: look up token in DB session table
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
}

/**
 * Decode a demo token → SessionUser (or null).
 * Token format: base64(JSON.stringify(user)) for demo only.
 */
function decodeDemoToken(token: string): SessionUser | null {
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

// ─── RBAC Permission Matrix ─────────────────────────────────────────────────────

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
