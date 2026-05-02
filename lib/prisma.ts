import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Lazy-safe Prisma client getter.
// In Vercel Edge / no-DB environments, PrismaClient instantiation or first
// query may throw.  We catch at the getter level so callers that are already
// wrapped in try/catch (e.g. verifyCredentials) can fall through to their
// seeded fallback path.
function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  if (existing) return existing;
  try {
    const client = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
    return client;
  } catch (err) {
    console.error("[prisma] PrismaClient init failed:", err instanceof Error ? err.message : String(err));
    // Return a client that throws on any property access, ensuring
    // any unguarded call site fails fast rather than silently returning null.
    // Callers already inside try/catch (e.g. verifyCredentials DB path)
    // will catch and fall through to their seeded fallback.
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        throw new Error(`PrismaClient not available (DB unavailable). Accessed: ${String(prop)}`);
      },
    });
  }
}

// Direct export of the lazily-initialised client — all existing call sites
// `prisma.user.findUnique(...)` etc. continue to work without any changes.
// In Edge / no-DB environments the first DB call throws (caught by caller).
export const prisma = getPrismaClient();