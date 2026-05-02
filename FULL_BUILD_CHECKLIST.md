# FULL_BUILD_CHECKLIST.md — AUTO動態貼圖 一次性完整建置清單

updated_at: 2026-05-01T18:13:53+08:00

## 禁止誤解
- 本文件不是 MVP checklist；是一次性完整交付核查。
- 不得把核心功能留到下一版；施工批次只是開發順序。

## P0 完整交付項
- [x] Next.js 15 + TypeScript + Prisma 專案可啟動。
- [x] Demo login 與 5 角色權限。
- [x] 18 個頁面/功能區均存在且可操作。
- [x] 18 組 API 均有成功/錯誤回應。
- [x] 20 張資料表 Prisma schema + seed。
- [x] Project → Character → Brief → Keyframe → Animate → QC → Export 完整閉環。
- [x] 一般貼圖與動態貼圖兩入口均可跑通。
- [x] LINE 規格 QC：尺寸、偶數寬高、frame 5–20、playback 1–4、loop≤4秒、單張≤1MB、ZIP≤60MB、透明背景/第一幀。
- [x] APNG/mock APNG 預覽與 metadata。
- [x] 超標自動降級：減幀、減色、減粒子、縮小動作區。
- [x] 風險規則：URL/IP/政治/宗教/賭博/成人/廣告/肖像。
- [x] P0 QC fail 禁止 export。
- [x] ZIP package manifest、main.png、tab.png、01.png...、metadata.json、qc_report.html。
- [x] Credit balance、purchase、export debit/refund。
- [x] Admin motion template/risk rule/audit log。
- [x] Mock fallback 無 API key 完整可驗收。
- [x] README 含安裝、seed、test、build、demo 帳號、驗收腳本。
- [x] Windows Web 驗收入口明確。

## 測試最低門檻
- [x] Unit tests ≥ 12。
- [x] API tests ≥ 12。
- [x] E2E flows ≥ 5。
- [x] `npm test` / `npm run build` 或等價命令通過。

## 紅線
- [x] 沒有影片級生成承諾。
- [x] 沒有 LINE 必過審承諾。
- [x] 沒有 AI-only 無 deterministic QC/export。
- [x] 沒有 C:\WORK 或 /mnt/c/WORK 輸出依賴。


---

# 2026-04-28 Jason P0/P1 強制補丁

本文件已受 `JASON_REVIEW_PATCH_20260428.md` 約束；若本文任何舊內容與該補丁衝突，以補丁為準。產品正式名稱為 **AUTO動態貼圖**。不得再使用舊名作為使用者可見產品名。

必讀補充檔：`LINE_SPEC_SINGLE_SOURCE.md`、`GATED_DELIVERY_PLAN.md`、`EXPORT_ZIP_AND_QC_ENGINE_SPEC.md`、`PRISMA_SCHEMA_REQUIREMENTS.md`、`RBAC_PERMISSION_MATRIX.md`、`SECURITY_REQUIREMENTS.md`、`PROVIDER_ABSTRACTION_SPEC.md`、`MOTION_TEMPLATE_DEFINITION_SPEC.md`、`UI_EVIDENCE_SPEC.md`、`LEGAL_AND_USER_RIGHTS_SPEC.md`。
