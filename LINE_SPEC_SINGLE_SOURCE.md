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
