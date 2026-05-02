/**
 * app/api/credits/route.ts
 *
 * Credit ledger API — read balance, purchase, list transactions.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isDatabaseAvailable } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// ─── Demo fallback data (used when DB is unavailable) ─────────────────────────

const DEMO_CREDIT_BALANCE = 100;
const DEMO_TRANSACTIONS = [
  { id: "tx_demo_01", type: "GRANT", amount: 100, balanceBefore: 0, balanceAfter: 100, description: "Demo seed credits", createdAt: new Date("2026-01-01T00:00:00Z").toISOString() },
  { id: "tx_demo_02", type: "GRANT", amount: 50, balanceBefore: 100, balanceAfter: 150, description: "Demo top-up", createdAt: new Date("2026-01-15T00:00:00Z").toISOString() },
];

// GET /api/credits — get current user's credit balance and recent transactions
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── DB path ──────────────────────────────────────────────────────────────────
  if (await isDatabaseAvailable()) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { teamMemberships: true },
      });
      if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const teamId = dbUser.teamMemberships[0]?.teamId ?? null;

      const txs = await prisma.creditTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      return NextResponse.json({ balance: dbUser.creditBalance, teamId, transactions: txs }, { status: 200 });
    } catch (err) {
      console.error("[GET /api/credits] DB query failed:", err instanceof Error ? err.message : String(err));
    }
  }

  // ── Demo fallback (DB unavailable) ─────────────────────────────────────────
  console.warn("[GET /api/credits] DB unavailable — returning demo data");
  return NextResponse.json(
    { balance: DEMO_CREDIT_BALANCE, teamId: null, transactions: DEMO_TRANSACTIONS, _demo: true },
    { status: 200 }
  );
}

// POST /api/credits — purchase credits (demo: adds free credits)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Permission check
  if (user.role !== "ADMIN" && user.role !== "EDITOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // DB required for write operations — return 503 if unavailable
  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: "Database unavailable. Cannot purchase credits in preview mode." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { amount, description } = body as { amount?: number; description?: string };

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "amount must be a positive integer" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { teamMemberships: true },
    });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const teamId = dbUser.teamMemberships[0]?.teamId;
    if (!teamId) return NextResponse.json({ error: "No team found" }, { status: 400 });

    const balanceBefore = dbUser.creditBalance;
    const balanceAfter = balanceBefore + amount;

    // Transaction and balance update in a transaction
    await prisma.$transaction([
      prisma.creditTransaction.create({
        data: {
          teamId,
          userId: user.id,
          type: "GRANT",
          amount,
          balanceBefore,
          balanceAfter,
          description: description ?? `Grant ${amount} credits`,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { creditBalance: balanceAfter },
      }),
    ]);

    return NextResponse.json({ balance: balanceAfter, granted: amount }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/credits] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}