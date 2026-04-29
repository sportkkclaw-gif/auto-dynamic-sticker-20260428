# RISKS.md — AUTO動態貼圖 風險與回退策略

updated_at: 2026-04-28T19:59:42+08:00

1. LINE 官方規格變更：README 與 help page 標明來源，QC 規則集中設定。
2. APNG 1MB 過小：預設低色、局部動作、10–15 幀、auto degrade。
3. 使用者期待影片級動畫：產品文案明確禁止影片/AE承諾。
4. AI 角色漂移：style lock、reference、相似度提示；mock 不依賴 AI。
5. 智財權侵權：授權聲明、風險詞、商標/IP 提醒，不能保證合法。
6. LINE 審核不通過：只能提供風險降低與 QC 報告，不保證通過。
7. AI provider 無 key/失敗：deterministic mock planner/keyframe/motion/QC/export。
8. ZIP/檔案處理在瀏覽器限制：server-side packaging；失敗時保留 manifest/download retry。
9. Credit 扣款爭議：export 成功才 post transaction，失敗 refund。
10. Scope 膨脹：只做一般貼圖+動態貼圖+QC/export，不做全功能動畫軟體。


---

# 2026-04-28 Jason P0/P1 強制補丁

本文件已受 `JASON_REVIEW_PATCH_20260428.md` 約束；若本文任何舊內容與該補丁衝突，以補丁為準。產品正式名稱為 **AUTO動態貼圖**。不得再使用舊名作為使用者可見產品名。

必讀補充檔：`LINE_SPEC_SINGLE_SOURCE.md`、`GATED_DELIVERY_PLAN.md`、`EXPORT_ZIP_AND_QC_ENGINE_SPEC.md`、`PRISMA_SCHEMA_REQUIREMENTS.md`、`RBAC_PERMISSION_MATRIX.md`、`SECURITY_REQUIREMENTS.md`、`PROVIDER_ABSTRACTION_SPEC.md`、`MOTION_TEMPLATE_DEFINITION_SPEC.md`、`UI_EVIDENCE_SPEC.md`、`LEGAL_AND_USER_RIGHTS_SPEC.md`。
