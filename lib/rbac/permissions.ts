/**
 * lib/rbac/permissions.ts
 *
 * RBAC permission matrix for AUTO動態貼圖.
 * All API routes must check session, team scope, and role permission
 * before performing any operation.
 */

import type { Role } from "@/lib/auth";

export type Permission =
  | "project:create"
  | "project:read"
  | "project:update"
  | "asset:upload"
  | "stylelock:create"
  | "brief:generate"
  | "sticker:render"
  | "motion:apply"
  | "qc:run"
  | "export:create"
  | "export:download"
  | "credit:purchase"
  | "billing:read"
  | "admin:template:write"
  | "admin:riskRule:write"
  | "audit:read";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "project:create",
    "project:read",
    "project:update",
    "asset:upload",
    "stylelock:create",
    "brief:generate",
    "sticker:render",
    "motion:apply",
    "qc:run",
    "export:create",
    "export:download",
    "credit:purchase",
    "billing:read",
    "admin:template:write",
    "admin:riskRule:write",
    "audit:read",
  ],
  EDITOR: [
    "project:create",
    "project:read",
    "project:update",
    "asset:upload",
    "stylelock:create",
    "brief:generate",
    "sticker:render",
    "motion:apply",
    "qc:run",
    "export:create",
    "export:download",
    "credit:purchase",
  ],
  USER: [
    "project:read",
    "project:update",
    "asset:upload",
    "qc:run",
    "export:download",
  ],
};

/**
 * Check whether a given role has a given permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check multiple permissions at once (all must be present).
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check any of the given permissions (at least one must be present).
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
