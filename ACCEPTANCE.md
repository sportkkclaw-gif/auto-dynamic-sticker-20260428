# ACCEPTANCE.md — AUTO動態貼圖 驗收標準與操作腳本

updated_at: 2026-04-28T19:59:42+08:00

## 必須通過（15+）
1. Web 入口可於 Windows 瀏覽器打開。2. Demo login 可切角色。3. Dashboard 顯示 project/credit。4. 可建立 8/16/24 靜態或動態專案。5. 必須先上傳使用者自有角色圖，才可建立 character/style lock。6. 可生成/編輯 briefs。7. 可基於已上傳角色圖生成 keyframes（mock 可）；不得純文字生成新角色。8. 可套 motion template。9. 可產生 APNG metadata/預覽。10. QC P0/P1/P2 可見。11. P0 fail 禁止 export。12. 自動降級可讓超標項回到可輸出。13. ZIP package manifest 可下載/檢視。14. Credit 扣款/交易紀錄可見。15. Admin 可管理 templates/risk rules。16. Audit log 記錄關鍵操作。17. 無 AI key 時 mock fallback 完整跑通。18. README 驗收腳本可重跑。

## 紅線失敗
- 任意 P0 QC fail 仍可 export。
- 產品變成影片生成器或純生圖器。
- 缺 mock fallback。
- 缺 Windows Web 入口。
- 使用 C 槽作為正式驗收輸出。

## Script A：一般貼圖包
登入 creator@example.com → 新建 static 8 張 → 建角色 → 生成 briefs → 批次確認 → 預覽 → QC pass → export ZIP。預期：ZIP manifest 含 main/tab/01-08/metadata/qc_report。

## Script B：動態貼圖包
新建 animated 8 張 → 選 blink/bounce/wave templates → keyframes generate → animate → budget meter 顯示≤1MB → QC pass → export。預期：每張 5–20 frames、playback/loop 合法。

## Script C：QC fail 與自動降級
把某張設定成 20 frames + heavy sparkle mock → QC 顯示 APNG_TOO_LARGE P0 → 點 auto degrade → frame/particle/color 降級 → QC pass。預期：fail 前不可 export，pass 後可 export。

## Script D：無 AI key fallback
清空 AI provider env → 重跑 brief/keyframe/animate/qc/export。預期：provider 顯示 mock，流程不斷。

## Script E：admin 規則
登入 admin → 新增 risk rule `forbidden-brand` → creator brief 放入該詞 → QC 顯示 P1/P0（依設定）。預期：audit log 有規則新增與命中紀錄。

## Script F：credit/export
檢查 balance → export 扣 credit → 交易紀錄顯示 reason=export_package → 失敗 export 不扣或 refund。預期：balance 正確。


---

# 2026-04-28 Jason P0/P1 強制補丁

本文件已受 `JASON_REVIEW_PATCH_20260428.md` 約束；若本文任何舊內容與該補丁衝突，以補丁為準。產品正式名稱為 **AUTO動態貼圖**。不得再使用舊名作為使用者可見產品名。

必讀補充檔：`LINE_SPEC_SINGLE_SOURCE.md`、`GATED_DELIVERY_PLAN.md`、`EXPORT_ZIP_AND_QC_ENGINE_SPEC.md`、`PRISMA_SCHEMA_REQUIREMENTS.md`、`RBAC_PERMISSION_MATRIX.md`、`SECURITY_REQUIREMENTS.md`、`PROVIDER_ABSTRACTION_SPEC.md`、`MOTION_TEMPLATE_DEFINITION_SPEC.md`、`UI_EVIDENCE_SPEC.md`、`LEGAL_AND_USER_RIGHTS_SPEC.md`。
