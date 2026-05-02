/**
 * app/api/projects/[id]/briefs/generate/route.ts
 *
 * POST /api/projects/:id/briefs/generate — auto-generate sticker briefs.
 * Spec §D-7: Request { theme, tone, count }; Response { briefs: StickerBrief[], provider: "mock"|"ai" }
 */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isDatabaseAvailable } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Mock brief planner per SPEC §E
function mockBriefPlanner(theme: string, tone: string, count: number) {
  const briefs = [];
  const emotions = ["happy", "sad", "angry", "surprised", "love", "sleepy", "thinking", "excited"];
  const phrases = [
    "Good morning!", "Thank you!", "Sorry!", "Let's go!",
    "I love you", "Wow!", "Hmm...", "Yay!",
    "Oops!", "Congrats!", "Help!", "Bye bye!",
    "Hungry~", "Tired...", "Sneeze!", "Shock!",
    "Wink~", "Relieved~", "Angry!", "Sad...",
    "Happy!", "Confused", "Love it!", "Hungry",
  ];
  for (let i = 0; i < count; i++) {
    briefs.push({
      id: `mock_brief_${Date.now()}_${i}`,
      projectId: "",
      briefText: `[${tone}] ${theme} — ${emotions[i % emotions.length]}`,
      promptHash: phrases[i % phrases.length],
      provider: "mock",
      metadata: JSON.stringify({ theme, tone, index: i }),
      createdAt: new Date(),
    });
  }
  return briefs;
}

// POST /api/projects/:id/briefs/generate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json(
      { error: { code: "SERVICE_UNAVAILABLE", message: "Service temporarily unavailable. Please try again later." } },
      { status: 503 }
    );
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Project not found." } },
      { status: 404 }
    );
  }
  if (user.role !== "ADMIN" && project.userId !== user.id) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Forbidden." } },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { theme = "daily office", tone = "cute", count = 8 } = body as {
      theme?: string;
      tone?: string;
      count?: number;
    };

    // Upsert a StickerBrief record for the project (store first brief)
    const briefs = mockBriefPlanner(theme, tone, count);

    const briefText = briefs.map((b) => b.briefText).join(" | ");
    const savedBrief = await prisma.stickerBrief.upsert({
      where: { projectId: id },
      update: { briefText, promptHash: `mock:${theme}:${count}`, provider: "mock" },
      create: {
        projectId: id,
        briefText,
        promptHash: `mock:${theme}:${count}`,
        provider: "mock",
        metadata: JSON.stringify({ theme, tone, count }),
      },
    });

    return NextResponse.json({ briefs: [savedBrief], provider: "mock" }, { status: 200 });
  } catch (err) {
    console.error("[briefs/generate] error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error." } },
      { status: 500 }
    );
  }
}
