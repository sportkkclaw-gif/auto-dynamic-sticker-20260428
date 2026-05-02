import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser, type Role } from "@/lib/auth";

export const config = {
  matcher: [
    "/api/:path*",
  ],
};

// ─── RBAC helper ──────────────────────────────────────────────────────────────

type Permission =
  | "projects:read"
  | "projects:write"
  | "projects:delete"
  | "projects:admin";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: ["projects:read", "projects:write", "projects:delete", "projects:admin"],
  EDITOR: ["projects:read", "projects:write"],
  USER: ["projects:read"],
};

function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// ─── Middleware handler ───────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Public paths (no auth required) ──────────────────────────────────────
  if (
    pathname === "/api/health" ||
    pathname === "/api/auth/login"
  ) {
    return NextResponse.next();
  }

  // ── Auth-gated paths ──────────────────────────────────────────────────────
  // getCurrentUser reads auth_token cookie; returns null if missing/invalid
  const user = await getCurrentUser();

  if (!user) {
    // If the Accept header is text/html (browser navigation), redirect to login.
    // Otherwise return 401 JSON — this handles both AJAX/API calls and
    // browser page navigations correctly.
    const accept = request.headers.get("accept") ?? "";
    if (accept.includes("text/html")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Please log in to continue." } },
      { status: 401 }
    );
  }

  // ── RBAC ──────────────────────────────────────────────────────────────────
  const isRead = request.method === "GET";
  const isWrite = request.method === "POST" || request.method === "PUT" || request.method === "PATCH";
  const isDelete = request.method === "DELETE";

  const requiredPermission: Permission | null =
    isDelete
      ? "projects:delete"
      : isWrite
      ? "projects:write"
      : isRead
      ? "projects:read"
      : null;

  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return NextResponse.json(
      {
        error: `Forbidden. Role '${user.role}' lacks permission '${requiredPermission}'.`,
      },
      { status: 403 }
    );
  }

  // ── Attach user to headers for downstream route handlers ─────────────────
  const headers = new Headers(request.headers);
  headers.set("x-user-id", user.id);
  headers.set("x-user-email", user.email);
  headers.set("x-user-role", user.role);

  return NextResponse.next({ request: { headers } });
}
