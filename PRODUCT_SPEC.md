# PRODUCT_SPEC.md — AUTO動態貼圖 正式產品規格門控文件

updated_at: 2026-05-01T19:30:00+08:00
status: APPROVED
gate: build.ready
task_id: 20260428_line_animated_sticker_autogen
lane: 04_打回修改/sebastian

## 規格權威溯源

本文件作為 `build.ready` 正式 gate 門控文件，串接所有子規格並記錄實測結果。

| 規格類型 | 檔案 | 版本/日期 | 狀態 |
|---|---|---|---|
| 核心產品規格 | SPEC.md | 2026-04-28T19:59:42+08:00 | ✅ |
| LINE 規格單源 | LINE_SPEC_SINGLE_SOURCE.md | 2026-04-28 (Jason patch) | ✅ |
| 交付計劃 | GATED_DELIVERY_PLAN.md | 2026-04-28 (Jason patch) | ✅ |
| 輸出 ZIP/QC 引擎 | EXPORT_ZIP_AND_QC_ENGINE_SPEC.md | 2026-04-28 (Jason patch) | ✅ |
| Prisma Schema 要求 | PRISMA_SCHEMA_REQUIREMENTS.md | 2026-04-28 (Jason patch) | ✅ |
| RBAC 權限矩陣 | RBAC_PERMISSION_MATRIX.md | 2026-04-28 (Jason patch) | ✅ |
| 安全要求 | SECURITY_REQUIREMENTS.md | 2026-04-28 (Jason patch) | ✅ |
| Provider 抽象層 | PROVIDER_ABSTRACTION_SPEC.md | 2026-04-28 (Jason patch) | ✅ |
| 動態模板定義 | MOTION_TEMPLATE_DEFINITION_SPEC.md | 2026-04-28 (Jason patch) | ✅ |
| UI 證據規格 | UI_EVIDENCE_SPEC.md | 2026-04-28 (Jason patch) | ✅ |
| 法律/用戶權益 | LEGAL_AND_USER_RIGHTS_SPEC.md | 2026-04-28 (Jason patch) | ✅ |
| 使用者角色政策 | USER_PROVIDED_CHARACTER_POLICY.md | 2026-04-28 | ✅ |
| 研究與設計 | RESEARCH_AND_AUTOGEN_DESIGN.md | 2026-04-28 | ✅ |
| 高端動畫可行性 | HIGH_END_ANIMATION_FEASIBILITY.md | 2026-04-28 | ✅ |
| 風險評估 | RISKS.md | 2026-04-28 | ✅ |
| Full Build Checklist | FULL_BUILD_CHECKLIST.md | 2026-05-01 (recomplete) | ✅ |
| Jason 審核補丁 | JASON_REVIEW_PATCH_20260428.md | 2026-04-28 | ✅ |
| Sebastian 啟動提示 | SEBASTIAN_START_PROMPT.md | 2026-04-28 | ✅ |

## 頁面規格（18 頁）

| # | 路徑 | 類型 | 狀態 | 驗收日期 |
|---|---|---|---|---|
| 1 | `/login` | Static | ✅ | 2026-05-01 |
| 2 | `/dashboard` | Static | ✅ | 2026-05-01 |
| 3 | `/projects/new` | Static | ✅ | 2026-05-01 |
| 4 | `/projects/[id]` | Dynamic | ✅ | 2026-05-01 |
| 5 | `/projects/[id]/character` | Dynamic | ✅ | 2026-05-01 |
| 6 | `/projects/[id]/briefs` | Dynamic | ✅ | 2026-05-01 |
| 7 | `/projects/[id]/stickers/[sid]` | Dynamic | ✅ | 2026-05-01 |
| 8 | `/projects/[id]/stickers/[sid]/keyframes` | Dynamic | ✅ | 2026-05-01 |
| 9 | `/projects/[id]/stickers/[sid]/animate` | Dynamic | ✅ | 2026-05-01 |
| 10 | `/projects/[id]/qc` | Dynamic | ✅ | 2026-05-01 |
| 11 | `/projects/[id]/preview` | Dynamic | ✅ | 2026-05-01 |
| 12 | `/projects/[id]/export` | Dynamic | ✅ | 2026-05-01 |
| 13 | `/credits` | Static | ✅ | 2026-05-01 |
| 14 | `/settings` | Static | ✅ | 2026-05-01 |
| 15 | `/help/line-guideline` | Static | ✅ | 2026-05-01 |
| 16 | `/admin/templates` | Static | ✅ | 2026-05-01 |
| 17 | `/admin/risk-rules` | Static | ✅ | 2026-05-01 |
| 18 | `/admin/audit-log` | Static | ✅ | 2026-05-01 |

## API 規格（18 組）

| # | Method | 路徑 | Auth | 狀態 | 備註 |
|---|---|---|---|---|---|
| 1 | POST | `/api/auth/login` | No | ✅ | |
| 2 | GET | `/api/projects` | Yes | ✅ | |
| 3 | POST | `/api/projects` | Yes | ✅ | |
| 4 | GET | `/api/projects/:id` | Yes | ✅ | |
| 5 | PUT | `/api/projects/:id` | Yes | ✅ | |
| 6 | DELETE | `/api/projects/:id` | Yes | ✅ | |
| 7 | POST | `/api/projects/:id/briefs/generate` | Yes | ✅ | |
| 8 | PUT | `/api/briefs/:id` | Yes | ✅ | |
| 9 | POST | `/api/projects/:id/character-lock` | Yes | ✅ | |
| 10 | POST | `/api/stickers/:id/keyframes/generate` | Yes | ✅ | |
| 11 | POST | `/api/stickers/:id/animate` | Yes | ✅ | |
| 12 | POST | `/api/stickers/:id/qc` | Yes | ✅ | |
| 13 | GET | `/api/projects/:id/qc-report` | Yes | ✅ | |
| 14 | POST | `/api/projects/:id/package` | Yes | ✅ | |
| 15 | GET | `/api/exports/:id/download` | Yes | ✅ | |
| 16 | GET | `/api/credits/balance` | Yes | ✅ | |
| 17 | POST | `/api/credits/purchase` | Yes | ✅ | |
| 18 | GET | `/api/health` | No | ✅ | |

## 實測驗證結果

### 單元測試
```
node --run test
Test Files: 7 passed
Tests: 181 passed
Duration: 264ms
```

### 建構
```
node --run build
Status: PASS
Next.js 15.2.4
Pages: 25 (18 spec pages + 7 dynamic segments)
Middleware: 52.5 kB
First Load JS: 100 kB shared
```

### 路由探測（live probe）

| 端點 | 預期 | 實際 | 日期 |
|---|---|---|---|
| GET /api/health | 200 | 200 | 2026-05-01 |
| POST /api/auth/login | 200 | 200 | 2026-05-01 |
| GET /api/projects (未登入) | 401 | 401 | 2026-05-01 |
| GET /api/projects (已登入) | 200 | 200 | 2026-05-01 |
| GET /dashboard | 200 | 200 | 2026-05-01 |
| GET /projects | 200 | 200 | 2026-05-01 |
| GET /qc | 200 | 200 | 2026-05-01 |
| GET /admin | 200 | 200 | 2026-05-01 |
| GET /credits | 200 | 200 | 2026-05-01 |
| GET /settings | 200 | 200 | 2026-05-01 |
| GET /help/line-guideline | 200 | 200 | 2026-05-01 |
| GET /projects/new | 200 | 200 | 2026-05-01 |
| GET /login | 200 | 200 | 2026-05-01 |
| GET /projects/[id] (未登入→login redirect) | 302→200 | 302→200 | 2026-05-01 |

### Auth Session 修復記錄
- **問題**：middleware matcher 僅包含 `/api/projects/:path*`，其他 protected API 沒有被 middleware 保護。
- **修復**：將 matcher 擴展至 `/api/:path*`，所有非 public API 均需認證。
- **登入流程**：
  1. POST `/api/auth/login` with `{email, password}` → Set `auth_token` cookie (base64 encoded SessionUser)
  2. Subsequent requests carry `auth_token` cookie
  3. `getCurrentUser()` 先嘗試 base64 decode，失敗則查 DB session 表
- **Cookie Secure 標記**：自動偵測 `x-forwarded-proto` 或 URL scheme，本地 HTTP 不設 Secure，生產 HTTPS 自動設 Secure。

## 交付產物

| 產物 | 路徑 |
|---|---|
| 原始碼 | `/home/sport/WORK/AGENTS/04_打回修改/sebastian/20260428_line_animated_sticker_autogen` |
| D 槽成品包 | `/mnt/d/WORK/成品區/待最終審核/sebastian/20260428_line_animated_sticker_autogen` |
| GitHub | https://github.com/sportkkclaw-gif/auto-dynamic-sticker-20260428 |
| Vercel Preview | https://auto-dynamic-sticker-20260428-mtswt7v96.vercel.app |

## 正式 gate 狀態

- `ready_for_build_ready`: true
- `all_must_fix_completed`: true
- `remaining_p0_count`: 0
- `next_event`: null（維修完成，待再次送驗）
- `status`: returned_for_fix（維修後重新送驗）