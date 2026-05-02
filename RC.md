# RC — AUTO動態貼圖

updated_at: 2026-05-02T14:09:06+08:00
status: returned_for_fix
formal_status: returned_for_fix
next_event: null
next_agent: sebastian
current_lane: 04_打回修改/sebastian

## Controller verification — 2026-05-02T11:16:54+08:00
- SUPAGENT-first 修復與測試完成；controller canonical 重跑：`node --run test` **193/193 PASS**、`node --run build` **PASS (25 routes)**。
- SUPAGENT cloud live probe：`POST /api/auth/login`（admin@demo.local/admin123）仍 **500**、無 cookie；`GET /api/projects`（with/without cookie）皆 **401**。
- redeploy 能力檢查：`which vercel` 無輸出；`VERCEL_TOKEN=0`、`VERCEL_API_TOKEN=0`（環境未注入）。

## Controller no-DB coverage verification — 2026-05-02T11:44:25+08:00
- 以 `DATABASE_URL=file:/no-such-path/dev.db` + `PORT=3114 node --run start` 進行 login→authenticated probes。
- 已覆蓋並確認「不回 500」：
  - `GET /api/projects`=200（demo）
  - `GET /api/projects/[id]`/`qc-report`/`briefs/generate`/`exports/[id]/download`/`stickers/[id]/animate`/`stickers/[id]/keyframes/generate`=503
  - `POST /api/projects/[id]/character-lock`、`PUT /api/briefs/[id]`、`POST /api/stickers/[id]/qc`=503
  - 先前已驗證 `credits/audit/export/qc/motion-templates/risk-rules` 皆為 200-demo 或 503。
- 另外以掃描檢查：所有含 Prisma 查詢的 `app/api/**/route.ts` 均已存在 `isDatabaseAvailable` guard。

## Current blocker
- vercel cli missing; VERCEL_TOKEN and VERCEL_API_TOKEN absent; redeploy cannot be triggered; cloud login remains 500 until redeploy.

## Controller blocker recheck — 2026-05-02T14:09:06+08:00
- SUPAGENT audit + controller canonical recheck: `vercel/npm/npx` not found; env-key checks `VERCEL_TOKEN=false`, `VERCEL_API_TOKEN=false`.
- Blocker unchanged: cannot redeploy preview; cloud login 500 issue remains unresolved until CLI+token are provisioned.
