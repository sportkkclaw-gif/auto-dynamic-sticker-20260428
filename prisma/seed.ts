/**
 * Prisma seed — creates demo users, teams, projects, credit ledger, risk rules, motion templates.
 * Run: npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Teams ────────────────────────────────────────────────────────────────────
  const team = await prisma.team.upsert({
    where: { id: "team_demo_01" },
    update: {},
    create: {
      id: "team_demo_01",
      name: "Demo Team",
    },
  });
  console.log(`✓ team: ${team.name}`);

  // ─── Users ────────────────────────────────────────────────────────────────────
  const users = await Promise.all([
    upsertUser({
      id: "user_admin_01",
      email: "admin@demo.local",
      name: "Admin User",
      password: "admin123",
      role: "ADMIN",
      teamId: "team_demo_01",
      creditBalance: 1000,
    }),
    upsertUser({
      id: "user_editor_01",
      email: "editor@demo.local",
      name: "Editor User",
      password: "editor123",
      role: "EDITOR",
      teamId: "team_demo_01",
      creditBalance: 500,
    }),
    upsertUser({
      id: "user_viewer_01",
      email: "viewer@demo.local",
      name: "Viewer User",
      password: "viewer123",
      role: "USER",
      teamId: "team_demo_01",
      creditBalance: 0,
    }),
  ]);
  console.log(`✓ ${users.length} users seeded`);

  // ─── Team Memberships ───────────────────────────────────────────────────────
  await Promise.all([
    upsertMembership("user_admin_01", "team_demo_01", "ADMIN"),
    upsertMembership("user_editor_01", "team_demo_01", "EDITOR"),
    upsertMembership("user_viewer_01", "team_demo_01", "USER"),
  ]);
  console.log("✓ team memberships seeded");

  // ─── Credit Transactions ─────────────────────────────────────────────────────
  await prisma.creditTransaction.createMany({
    data: [
      {
        teamId: "team_demo_01",
        userId: "user_admin_01",
        type: "GRANT",
        amount: 1000,
        balanceBefore: 0,
        balanceAfter: 1000,
        description: "Initial grant",
      },
      {
        teamId: "team_demo_01",
        userId: "user_editor_01",
        type: "GRANT",
        amount: 500,
        balanceBefore: 0,
        balanceAfter: 500,
        description: "Initial grant",
      },
    ],
  });
  console.log("✓ credit transactions seeded");

  // ─── Risk Rules ─────────────────────────────────────────────────────────────
  const riskRules = [
    { code: "ANIMATED_STICKER_MAX_FRAMES", level: "P0", message: "APNG frame count exceeds LINE maximum 20" },
    { code: "ANIMATED_STICKER_MAX_DURATION", level: "P0", message: "Total loop duration exceeds LINE maximum 4s" },
    { code: "ANIMATED_STICKER_MAX_SIZE", level: "P0", message: "APNG dimensions exceed LINE maximum 320×270" },
    { code: "ANIMATED_STICKER_TRANSPARENCY", level: "P0", message: "APNG background must be transparent" },
    { code: "ANIMATED_STICKER_FILE_SIZE", level: "P0", message: "APNG file size exceeds LINE maximum 1 MB" },
    { code: "ANIMATED_STICKER_ZIP_SIZE", level: "P0", message: "ZIP package exceeds LINE maximum 60 MB" },
    { code: "ANIMATED_STICKER_COUNT", level: "P1", message: "Sticker count must be one of 8, 16, 24" },
    { code: "ANIMATED_STICKER_COLOR_SPACE", level: "P1", message: "Color space must be RGB" },
    { code: "ANIMATED_STICKER_MAIN_IMAGE", level: "P1", message: "Main image must be 240×240" },
    { code: "ANIMATED_STICKER_TAB_IMAGE", level: "P1", message: "Tab image must be 96×74" },
  ];
  for (const rule of riskRules) {
    await prisma.riskRule.upsert({
      where: { code: rule.code },
      update: {},
      create: { teamId: "team_demo_01", ...rule },
    });
  }
  console.log(`✓ ${riskRules.length} risk rules seeded`);

  // ─── Motion Templates ────────────────────────────────────────────────────────
  const motionTemplates = [
    {
      code: "bobble",
      name: "Bobble",
      description: "Gentle vertical oscillation, great for chibi characters",
      riskLevel: "stable",
      definition: JSON.stringify({
        code: "bobble",
        name: "Bobble",
        targetLayers: ["body", "head"],
        parameters: {
          amplitude: { min: 2, max: 10, default: 5 },
          frequency: { min: 0.5, max: 3, default: 1.5 },
          phase: { min: 0, max: 360, default: 0 },
          easing: ["ease-in-out"],
        },
        keyframes: [
          { frame: 0, transforms: [{ layer: "body", translateY: 0 }] },
          { frame: 25, transforms: [{ layer: "body", translateY: -5 }] },
          { frame: 50, transforms: [{ layer: "body", translateY: 0 }] },
          { frame: 75, transforms: [{ layer: "body", translateY: 5 }] },
          { frame: 100, transforms: [{ layer: "body", translateY: 0 }] },
        ],
        recommendedFrameCount: 12,
        riskLevel: "stable",
      }),
    },
    {
      code: "float",
      name: "Float",
      description: "Smooth drifting motion with slight rotation",
      riskLevel: "stable",
      definition: JSON.stringify({
        code: "float",
        name: "Float",
        targetLayers: ["entire"],
        parameters: {
          amplitude: { min: 3, max: 15, default: 8 },
          frequency: { min: 0.3, max: 1.5, default: 0.8 },
          phase: { min: 0, max: 360, default: 0 },
          easing: ["ease-in-out"],
        },
        keyframes: [
          { frame: 0, transforms: [{ layer: "entire", translateY: 0, rotate: 0 }] },
          { frame: 33, transforms: [{ layer: "entire", translateY: -8, rotate: -3 }] },
          { frame: 66, transforms: [{ layer: "entire", translateY: 0, rotate: 3 }] },
          { frame: 100, transforms: [{ layer: "entire", translateY: 0, rotate: 0 }] },
        ],
        recommendedFrameCount: 15,
        riskLevel: "stable",
      }),
    },
    {
      code: "wiggle",
      name: "Wiggle",
      description: "Playful horizontal shake",
      riskLevel: "expressive",
      definition: JSON.stringify({
        code: "wiggle",
        name: "Wiggle",
        targetLayers: ["body"],
        parameters: {
          amplitude: { min: 1, max: 8, default: 4 },
          frequency: { min: 2, max: 8, default: 4 },
          phase: { min: 0, max: 360, default: 0 },
          easing: ["ease-out"],
        },
        keyframes: [
          { frame: 0, transforms: [{ layer: "body", translateX: 0 }] },
          { frame: 25, transforms: [{ layer: "body", translateX: 4 }] },
          { frame: 50, transforms: [{ layer: "body", translateX: -4 }] },
          { frame: 75, transforms: [{ layer: "body", translateX: 2 }] },
          { frame: 100, transforms: [{ layer: "body", translateX: 0 }] },
        ],
        recommendedFrameCount: 10,
        riskLevel: "expressive",
      }),
    },
  ];
  for (const tm of motionTemplates) {
    await prisma.motionTemplate.upsert({
      where: { teamId_code: { teamId: "team_demo_01", code: tm.code } },
      update: {},
      create: { teamId: "team_demo_01", ...tm },
    });
  }
  console.log(`✓ ${motionTemplates.length} motion templates seeded`);

  // ─── Projects ───────────────────────────────────────────────────────────────
  const projects = await Promise.all([
    upsertProject({
      id: "proj_001",
      title: "AUTO 動畫貼圖企劃 A",
      description: "測試用動畫貼圖角色",
      status: "DRAFT",
      userId: "user_admin_01",
      teamId: "team_demo_01",
    }),
    upsertProject({
      id: "proj_002",
      title: "AUTO 動畫貼圖企劃 B",
      description: "第二角色測試",
      status: "PROCESSING",
      userId: "user_editor_01",
      teamId: "team_demo_01",
    }),
    upsertProject({
      id: "proj_003",
      title: "AUTO 動畫貼圖企劃 C",
      description: "第三角色 — 進行中",
      status: "PROCESSING",
      userId: "user_editor_01",
      teamId: "team_demo_01",
    }),
  ]);
  console.log(`✓ ${projects.length} projects seeded`);

  // ─── Sticker Items (project 001 — 8 stickers, valid LINE spec) ──────────────
  for (let i = 1; i <= 8; i++) {
    await prisma.stickerItem.upsert({
      where: { projectId_index: { projectId: "proj_001", index: i } },
      update: {},
      create: {
        projectId: "proj_001",
        index: i,
        status: "PENDING",
        targetWidth: 240,
        targetHeight: 240,
        loopCount: 1,
        playbackSeconds: 1.0,
      },
    });
  }
  console.log("✓ 8 sticker items seeded for proj_001");

  // ─── Sticker Items (project 002 — P0 fail case: 25 frames > 20) ─────────────
  for (let i = 1; i <= 8; i++) {
    await prisma.stickerItem.upsert({
      where: { projectId_index: { projectId: "proj_002", index: i } },
      update: {},
      create: {
        projectId: "proj_002",
        index: i,
        status: "PENDING",
        targetWidth: 240,
        targetHeight: 240,
        loopCount: 4,
        playbackSeconds: 1.5, // 4 × 1.5 = 6s > 4s → P0 fail
      },
    });
  }
  console.log("✓ 8 sticker items seeded for proj_002 (P0 fail case)");

  // ─── QC Report for proj_001 (valid spec — export allowed) ─────────────────
  await prisma.qcReport.upsert({
    where: { projectId: "proj_001" },
    update: {},
    create: {
      projectId: "proj_001",
      stickerCount: 8,
      apngFrames: 10,
      apngWidth: 240,
      apngHeight: 240,
      zipBytes: 5 * 1024 * 1024,
      mainImageW: 240,
      mainImageH: 240,
      tabImageW: 96,
      tabImageH: 74,
      hasTransparent: true,
      colorSpace: "RGB",
      passed: true,
      exportBlocked: false,
      p0Count: 0,
      p1Count: 0,
      p2Count: 0,
      passedChecks: 10,
      totalChecks: 10,
      findingsJson: "[]",
    },
  });
  console.log("✓ QC report seeded for proj_001 (valid — export allowed)");

  // ─── QC Report for proj_002 (P0 fail — export blocked) ──────────────────
  const p0Findings = JSON.stringify([
    {
      code: "APNG_LOOP_DURATION",
      severity: "P0",
      message: "Total loop duration 6s exceeds LINE maximum 4s",
      detail: "playbackSeconds=1.5, loopCount=4",
    },
  ]);
  await prisma.qcReport.upsert({
    where: { projectId: "proj_002" },
    update: {},
    create: {
      projectId: "proj_002",
      stickerCount: 8,
      apngFrames: 25,
      apngWidth: 240,
      apngHeight: 240,
      zipBytes: 5 * 1024 * 1024,
      mainImageW: 240,
      mainImageH: 240,
      tabImageW: 96,
      tabImageH: 74,
      hasTransparent: true,
      colorSpace: "RGB",
      passed: false,
      exportBlocked: true,
      p0Count: 1,
      p1Count: 0,
      p2Count: 0,
      passedChecks: 9,
      totalChecks: 10,
      findingsJson: p0Findings,
    },
  });
  console.log("✓ QC report seeded for proj_002 (P0 fail — export blocked)");

  // ─── Audit Logs ─────────────────────────────────────────────────────────────
  for (const log of [
    {
      teamId: "team_demo_01",
      userId: "user_admin_01",
      action: "PROJECT_CREATE",
      resource: "project:proj_001",
      detail: "Created project 'AUTO 動畫貼圖企劃 A'",
    },
    {
      teamId: "team_demo_01",
      userId: "user_admin_01",
      action: "QC_RUN",
      resource: "project:proj_001",
      detail: "QC passed — 0 P0, 0 P1 findings",
    },
    {
      teamId: "team_demo_01",
      userId: "user_editor_01",
      action: "EXPORT_CREATE",
      resource: "project:proj_001",
      detail: "Export package created",
    },
  ]) {
    await prisma.auditLog.create({ data: log });
  }
  console.log("✓ audit logs seeded");

  console.log("✅ Seeding complete");
  console.log("");
  console.log("Demo accounts:");
  console.log("  admin@demo.local  / admin123  (ADMIN, 1000 credits)");
  console.log("  editor@demo.local / editor123  (EDITOR, 500 credits)");
  console.log("  viewer@demo.local / viewer123 (USER, 0 credits)");
  console.log("");
  console.log("Projects:");
  console.log("  proj_001 — valid spec, export allowed");
  console.log("  proj_002 — P0 fail (loop duration 6s > 4s), export blocked");
  console.log("  proj_003 — no QC report yet");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsertUser(data: {
  id: string; email: string; name: string; password: string;
  role: string; teamId: string; creditBalance: number;
}) {
  return prisma.user.upsert({
    where: { id: data.id },
    update: {},
    create: {
      id: data.id,
      email: data.email,
      name: data.name,
      password: data.password,
      role: data.role,
      creditBalance: data.creditBalance,
    },
  });
}

async function upsertMembership(userId: string, teamId: string, role: string) {
  return prisma.teamMembership.upsert({
    where: { teamId_userId: { teamId, userId } },
    update: {},
    create: { teamId, userId, role },
  });
}

async function upsertProject(data: {
  id: string; title: string; description: string | null;
  status: string; userId: string; teamId: string;
}) {
  return prisma.project.upsert({
    where: { id: data.id },
    update: {},
    create: data,
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
