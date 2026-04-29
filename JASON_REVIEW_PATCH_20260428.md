
# JASON_REVIEW_PATCH_20260428.md — AUTO動態貼圖 開發案規格硬化補丁

updated_at: 2026-04-28T22:05:00+08:00
source_feedback: Jason 對原 StickerForge 開發案的 P0/P1/UI/法務修正意見
new_product_name: AUTO動態貼圖

---

## 0. 名稱修正

本案正式名稱改為：**AUTO動態貼圖 開發案**。

舊名 `StickerForge` 僅視為歷史內部稱呼，不得出現在使用者可見 UI、README、網站標題、產品 Logo、主要文案或交付報告中。若現有 task_id / 資料夾仍保留 `20260428_line_animated_sticker_autogen`，只作 workflow 索引，不代表產品名稱。

---

## 1. P0：LINE 規格矛盾必須先修

### 1.1 APNG frame 與 QC mockup 修正
所有 mock data、mockup copy、QC sample 狀態、seed data 必須與 LINE 規格一致：

- 動態貼圖張數：8 / 16 / 24 張。
- 動態貼圖單張尺寸：最大 320×270。
- 動態 APNG frame 數：5–20 frames。
- loop 次數：1–4。
- 總播放時間：playbackSeconds × loopCount ≤ 4 秒。
- 單張 APNG / PNG：≤ 1 MB。
- ZIP：≤ 60 MB。
- 背景：透明。
- 色彩：RGB。
- main image：240×240。
- tab image：96×74。

任何 APNG 超過 20 frames、超過 1MB、loop 總長超過 4 秒、尺寸超過 320×270、背景不透明者，必須標示為 **P0 fail** 並 disable export。不得在 mockup 或 seed data 中出現超規格卻標為 OK 的資料。

### 1.2 Readiness score 修正
QC / Export mockup 與所有 UI copy 不得出現 `92 / 1100` 或其他明顯錯誤分母。Readiness score 必須使用：
- `0–100` 百分制；或
- `passedChecks / totalChecks`，例如 `92 / 100` 或 `18 / 20`。

若採百分制，UI 顯示 `92% Ready`，不得混用錯誤分母。

---

## 2. P0：建立單一 LINE 規格來源

請建立：

```txt
lib/line-spec/lineSpec.ts
```

內容至少包含：

```ts
export const LINE_STATIC_STICKER_SPEC = {
  mainImage: { width: 240, height: 240 },
  tabImage: { width: 96, height: 74 },
  stickerImage: { maxWidth: 370, maxHeight: 320 },
  allowedCounts: [8, 16, 24, 32, 40],
  maxFileBytes: 1_048_576,
  maxZipBytes: 60 * 1024 * 1024,
  transparentRequired: true,
} as const;

export const LINE_ANIMATED_STICKER_SPEC = {
  mainImage: { width: 240, height: 240 },
  tabImage: { width: 96, height: 74 },
  stickerImage: { maxWidth: 320, maxHeight: 270 },
  allowedCounts: [8, 16, 24],
  minFrames: 5,
  maxFrames: 20,
  allowedLoopCount: [1, 2, 3, 4],
  maxTotalLoopSeconds: 4,
  maxFileBytes: 1_048_576,
  maxZipBytes: 60 * 1024 * 1024,
  transparentRequired: true,
  colorSpace: 'RGB',
} as const;
```

所有 QC、UI badge、Export button、seed data、README、測試都只能引用 `lineSpec.ts`，不得在各處 hard-code 規格數字。

---

## 3. P0：完整交付必須用 Gate 驗收防假做

本案仍要求一次完整交付，但開發必須按 Gate 交付與自測；每個 Gate 未通過，不得宣稱完成。

- Gate 0：`npm install` / `npm run dev` / `npm run build` 必須通過。
- Gate 1：demo login + RBAC + seed users 通過。
- Gate 2：project create + character upload + license declaration 通過。
- Gate 3：style lock + brief planner + sticker grid 通過。
- Gate 4：motion workspace + frame timeline + APNG budget 通過。
- Gate 5：QC engine 真正根據 `lineSpec.ts` 計算 pass/fail。
- Gate 6：P0 fail 禁止 export，P0 pass 才能產生 ZIP。
- Gate 7：三張 UI evidence screenshot 與三條 E2E 腳本通過。

注意：Gate 是工程驗收順序，不是產品版本分段；最終仍需一次性交付完整版本。

---

## 4. P1：Export 必須產生實際 ZIP

Export 不得只回傳 manifest JSON。必須產生實際可下載 ZIP 檔。

ZIP 內至少包含：
- `main.png`
- `tab.png`
- `01.png ... 08/16/24.png`
- `manifest.json`
- `qc_report.json`

若是 animated project，`01.png...` 必須是 APNG 格式但副檔名維持 `.png`。若 renderer 仍為 mock，也必須產生有效 placeholder PNG/APNG 檔案與正確 metadata，不得只有文字或空檔。

---

## 5. P1：QC 狀態必須由真資料計算

所有 `OK / Review / Risk / P0 / P1 / P2` badge 必須由 QC engine 根據 sticker item、APNG output、`lineSpec.ts`、risk rules 計算產生。UI 不得 hard-code QC 結果。

Export button disabled/enabled 必須只根據：

```ts
qcReport.exportBlocked === true | false
```

不得由前端手寫 if 文案或 mock badge 決定。

---

## 6. P1：Prisma schema 必須完整

請建立完整 `prisma/schema.prisma`，不得只寫 TypeScript interface。

必須包含：
- enum definitions
- foreign keys
- relation fields
- `createdAt` / `updatedAt`
- indexes
- unique constraints
- `teamId` / `projectId` scope
- `deletedAt` 或明確刪除策略
- 不同 role 的可存取資料邏輯

必須鎖好關係：

```txt
Team -> Membership -> User
Team -> Project
Project -> CharacterAsset
Project -> StyleLock
Project -> StickerBrief
Project -> StickerItem
StickerItem -> GeneratedFrame
StickerItem -> ApngOutput
Project -> QcReport -> QcFinding
Project -> ExportPackage
Team -> CreditTransaction
Team/User -> AuditLog
```

---

## 7. P1：RBAC 權限矩陣

請實作 RBAC permission matrix，不得只在 UI 顯示角色名稱。

權限至少包含：
- `project:create`
- `project:read`
- `project:update`
- `asset:upload`
- `stylelock:create`
- `brief:generate`
- `sticker:render`
- `motion:apply`
- `qc:run`
- `export:create`
- `export:download`
- `credit:purchase`
- `billing:read`
- `admin:template:write`
- `admin:riskRule:write`
- `audit:read`

前端隱藏按鈕不算權限控管。API route 必須檢查 session、team scope、role permission。

---

## 8. P1：安全要求

1. 所有 API 必須檢查登入狀態。
2. 所有 project / asset / export 必須檢查 team ownership。
3. 上傳檔案必須檢查 MIME、extension、size、image dimensions。
4. 禁止 SVG 上傳，避免 script injection。
5. 檔名需 sanitize，不得直接使用使用者原始檔名作為儲存路徑。
6. session cookie 必須 httpOnly / secure in production。
7. 表單與 mutation endpoint 必須有基本 CSRF 或 same-site 保護。
8. auth endpoint 需要 rate limit。
9. audit log 不得記錄敏感 token、API key、完整信用卡資訊。
10. `.env.example` 不得包含真實 key。

---

## 9. P1：Provider abstraction

請建立 provider abstraction：

- `StyleAnalysisProvider`
- `BriefGenerationProvider`
- `KeyframeGenerationProvider`
- `BackgroundRemovalProvider`
- `ApngRenderProvider`

每個 provider 都要有 mock implementation 與 external implementation interface。

無 AI key 時：
- style lock 使用 mock/sample analysis。
- briefs 使用 deterministic generator。
- keyframes 使用 placeholder frame generator。
- APNG 使用 deterministic renderer 或 placeholder APNG。
- QC/export/audit/billing 必須仍是真流程。

有 AI key 時：
- 不得繞過 `characterAssetId` / `styleLockId`。
- 不得純文字生成新角色。
- provider failure 必須 fallback 或顯示明確錯誤。

---

## 10. P1：Motion template 必須是可執行資料結構

Motion template 不得只是按鈕或下拉選單。請建立：

```ts
export type MotionTemplateDefinition = {
  code: string;
  name: string;
  targetLayers: string[];
  parameters: {
    amplitude?: { min: number; max: number; default: number };
    frequency?: { min: number; max: number; default: number };
    phase?: { min: number; max: number; default: number };
    easing?: string[];
  };
  keyframes: Array<{
    frame: number;
    transforms: Array<{
      layer: string;
      translateX?: number;
      translateY?: number;
      rotate?: number;
      scaleX?: number;
      scaleY?: number;
      opacity?: number;
    }>;
  }>;
  recommendedFrameCount: number;
  riskLevel: 'stable' | 'expressive' | 'extreme_limited';
};
```

Motion Workspace 必須依 template definition 更新 canvas/timeline/budget，而不是只切換 UI 標籤。

---

## 11. UI Fidelity 升級

### 11.1 Evidence screenshot 改為可驗收條件
請提供 Playwright screenshots：
- `1440x900`
- `1536x1024`
- `1920x1080`

每張 evidence screenshot 必須包含指定核心區塊。驗收以核心區塊完整度為主，不以 Agent 自評百分比為準。

### 11.2 指定頁面核心區塊
Character upload 頁必須包含：sidebar、topbar、upload card、license checkboxes、style lock cards、right preview panel。

Motion workspace 頁必須包含：left layer panel、motion templates、center 320×270 canvas、timeline、parameter panel、right LINE constraints inspector。

QC export 頁必須包含：24-grid、status badges、QC summary、readiness panel、package assets、credit summary、export CTA、P0 disabled state。

### 11.3 不得假 UI
不得把 mockup 當圖片貼到頁面上。必須是可操作、可點擊、資料狀態會變化的真 UI。

### 11.4 Browser chrome 排除
mockup 中若出現 browser chrome / URL bar，只作為展示情境，不得實作成產品 UI。Evidence screenshot 應以實際瀏覽器截圖為準，頁面本身只需實作 app 內部 layout。

---

## 12. 法務與使用者權利聲明

網站與 README 必須明確標示：

```txt
AUTO動態貼圖 is not affiliated with, endorsed by, or sponsored by LINE or LY Corporation. LINE and related marks belong to their respective owners.
```

中文：

```txt
AUTO動態貼圖 並非 LINE 官方產品，亦未受 LINE 或 LY Corporation 贊助、認可或背書。LINE 相關商標與名稱屬其權利人所有。
```

使用者上傳角色時必須確認：
1. 我擁有該角色著作權，或已取得合法授權。
2. 我未使用第三方品牌、明星、動漫、遊戲、VTuber、商標角色作為仿製對象。
3. 我理解 AUTO動態貼圖 只能做規格檢查與風險提示，不保證 LINE 審核通過。
4. 我同意平台可為產生貼圖目的暫存與處理上傳素材。
5. 我可刪除素材，刪除後系統不再用於新輸出。

---

## 13. 強制補充：不得假做

1. 先修正所有 mockup / seed data / UI copy 與 LINE 規格不一致的地方。
2. 建立 `lib/line-spec/lineSpec.ts` 作為唯一 LINE 規格來源。
3. QC badge 必須由 QC engine 算出，UI 不得寫死。
4. Export 必須產生實際 ZIP。
5. 補完整 Prisma schema。
6. 實作 API 層 RBAC。
7. 建立 provider abstraction。
8. Motion template 必須可執行。
9. UI fidelity 必須提供 Playwright evidence screenshots。
10. Browser chrome 不得實作進 app UI。
11. 補安全要求。
12. 補法務與角色權利聲明。
13. 完成後回報：npm install、npm run build、prisma migrate/seed、demo accounts、三張 evidence screenshots、Playwright E2E、export ZIP 實際路徑、QC P0 fail 測試、mock fallback 測試、已知限制。
