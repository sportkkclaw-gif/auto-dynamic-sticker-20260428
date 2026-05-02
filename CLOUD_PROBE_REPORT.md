# Cloud Probe Report — AUTO動態貼圖 Vercel Preview (Re-probe 2026-05-02)

**Task:** 20260428_line_animated_sticker_autogen  
**Probe time:** 2026-05-02T10:33–10:34 UTC  
**Preview URL:** https://auto-dynamic-sticker-20260428-mtswt7v96.vercel.app  
**Deployed commit:** f49e1e2453cb62de91e8ee11b12cfdf03ecd5959 (acceptance branch, NOT yet rebuilt with lib/prisma.ts fix)

---

## Probe Sequence & Results

### 1. Public endpoint

| Endpoint | Method | Expected | Actual | Pass? |
|---|---|---|---|---|
| `/api/health` | GET | 200 | 200 | ✅ |

### 2. Auth login — THE BLOCKER (unchanged from prior probe)

| Probe | Expected | Actual | Pass? |
|---|---|---|---|
| `POST /api/auth/login` valid creds (`admin@demo.local/admin123`) | 200 + cookie | **500** | ❌ |
| `POST /api/auth/login` wrong password | 401 | **500** | ❌ |
| `POST /api/auth/login` malformed JSON | 400 | **500** | ❌ |
| `POST /api/auth/login` missing fields | 400 | 400 | ✅ |

**Root cause (unchanged):** `lib/prisma.ts` instantiates `PrismaClient` eagerly at module-import time. In Vercel Edge runtime without `DATABASE_URL`, `new PrismaClient()` throws at import time — before any route handler code runs. Even a deliberately malformed request returns 500 because the route module fails to load.

### 3. Unauthenticated access to protected APIs

| Endpoint | Method | Expected | Actual | Pass? |
|---|---|---|---|---|
| `/api/projects` | GET | 401 | 401 | ✅ |
| `/api/credits` | GET | 401 | 401 | ✅ |
| `/api/audit` | GET | 401 | 401 | ✅ |
| `/api/motion-templates` | GET | 401 | 401 | ✅ |
| `/api/risk-rules` | GET | 401 | 401 | ✅ |
| `/api/qc` | GET | 401 | 401 | ✅ |

✅ **Auth guard is correctly in place** — unauthenticated requests are properly rejected with 401.

### 4. Authenticated API chain (cannot test — login broken)

Cannot test because `POST /api/auth/login` still returns 500:
- `GET /api/projects` (with cookie) — **unreachable**
- `GET /api/credits` (with cookie) — **unreachable**

---

## Fix Applied Locally (awaiting redeploy)

The root-cause fix has been applied to `lib/prisma.ts` in the task workspace:

```typescript
// Before (eager — crashes in Edge/no-DB):
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ ... });

// After (lazy + error-throwing proxy — falls through to seeded fallback):
function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  if (existing) return existing;
  try {
    const client = new PrismaClient({ ... });
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
    return client;
  } catch (err) {
    console.error("[prisma] PrismaClient init failed:", ...);
    // Return a proxy that always throws on any property access.
    // verifyCredentials DB path (wrapped in try/catch) catches this
    // and falls through to seeded DEMO_USERS fallback.
    return new Proxy({} as PrismaClient, {
      get() { throw new Error("PrismaClient not available (DB unavailable)."); },
    });
  }
}
export const prisma = getPrismaClient();
```

**Local verification:**
- `node --run test` → **181/181 PASS**
- `node --run build` → **PASS (25 routes)**

**The cloud deployment still runs the OLD code** at commit `f49e1e2453cb62de91e8ee11b12cfdf03ecd5959`.  
**Redeploy to Vercel is required** to activate this fix.

---

## Failure Classification

| Failure | Category | Status |
|---|---|---|
| `POST /api/auth/login` → 500 | **DB/session dependency** — PrismaClient broken in Edge runtime | BLOCKER (still present) |
| Authenticated `/api/projects` etc. | **Cannot verify** — login chain broken | BLOCKER (still present) |
| Public routes and auth guards | Working correctly | ✅ PASS |

---

## Minimum Fix (already done, needs redeploy)

1. ✅ `lib/prisma.ts` — lazy Prisma init with try/catch fallback proxy  
   Applied locally. **Needs Vercel redeploy.**

2. After redeploy: re-run this probe suite to confirm login returns 200 + cookie and authenticated APIs are accessible.

---

## Truth-Pack Evidence Summary

```
cloud_probe_at: 2026-05-02T10:33:00+08:00
cloud_probe_status: BLOCKER
cloud_probe_blocker_reason: POST /api/auth/login returns HTTP 500 on current Vercel deployment (commit f49e1e2453cb62de91e8ee11b12cfdf03ecd5959); PrismaClient eager init crashes in Edge/no-DB; fix applied to lib/prisma.ts locally but not yet deployed
fix_applied_to: lib/prisma.ts (lazy init + error-throwing proxy fallback)
local_build: PASS (node --run build)
local_test: PASS (node --run test / 181 tests)
fix_requires_redeploy: true
probe_acceptance_gate: FAIL (500 on login = blocker)
ready_for_build_ready: false
next_event: null (pending Vercel redeploy + cloud re-probe)
```

---

## Commands Used

```bash
# Health check
curl -s -w "\n%{http_code}" "https://auto-dynamic-sticker-20260428-mtswt7v96.vercel.app/api/health"
# → 200

# Login probe (valid creds)
curl -s -w "\n%{http_code}" -X POST "https://auto-dynamic-sticker-20260428-mtswt7v96.vercel.app/api/auth/login" \
  -H "Content-Type: application/json" -d '{"email":"admin@demo.local","password":"admin123"}'
# → 500 Internal server error

# Login (wrong pw)
curl -s -w "\n%{http_code}" -X POST "https://auto-dynamic-sticker-20260428-mtswt7v96.vercel.app/api/auth/login" \
  -H "Content-Type: application/json" -d '{"email":"admin@demo.local","password":"wrong"}'
# → 500

# Login (missing fields)
curl -s -w "\n%{http_code}" -X POST "https://auto-dynamic-sticker-20260428-mtswt7v96.vercel.app/api/auth/login" \
  -H "Content-Type: application/json" -d '{}'
# → 400

# Unauthenticated /api/projects
curl -s -w "\n%{http_code}" "https://auto-dynamic-sticker-20260428-mtswt7v96.vercel.app/api/projects"
# → 401

# Same for /api/credits, /api/audit, /api/motion-templates, /api/risk-rules, /api/qc
# All return 401 ✅
```