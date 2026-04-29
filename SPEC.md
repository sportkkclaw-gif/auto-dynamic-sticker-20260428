# SPEC.md — AUTO動態貼圖 LINE 規格化貼圖工作台正式規格

updated_at: 2026-04-28T19:59:42+08:00
stack_authority: Next.js 15 App Router + TypeScript + Prisma/PostgreSQL + Tailwind + mock AI/QC processors

## A. 技術紅線
- Windows 可操作 Web 驗收入口為最終交付形式。
- AI provider 不可用時，mock planner/keyframe/motion/QC/export 必須完整跑通。
- 不做影片級生成；APNG/LINE 規格是核心約束。

## B. 頁面規格（18）
1. `/login` demo login / role switch。
2. `/dashboard` 專案卡、狀態、credit、最近 ZIP。
3. `/projects/new` 選 static/animated、8/16/24、語言、風格、模板。
4. `/projects/[id]` 專案總覽，全部 sticker 狀態矩陣。
5. `/projects/[id]/character` reference upload、style lock、授權聲明。
6. `/projects/[id]/briefs` AI brief 產生/編輯/批次確認。
7. `/projects/[id]/stickers/[sid]` 單張貼圖文字、情緒、構圖編輯。
8. `/projects/[id]/stickers/[sid]/keyframes` 3–5 keyframes 預覽/重生。
9. `/projects/[id]/stickers/[sid]/animate` motion template、budget meter、APNG 預覽。
10. `/projects/[id]/qc` P0/P1/P2 QC 報告與修正建議。
11. `/projects/[id]/preview` 主圖/tab/8-24 sticker 整包播放。
12. `/projects/[id]/export` metadata、copyright、ZIP 產生/下載。
13. `/credits` plans、交易紀錄、購買 credit。
14. `/settings` profile/team/API/mock mode。
15. `/help/line-guideline` 內建 LINE 規格速查。
16. `/admin/templates` motion templates CRUD。
17. `/admin/risk-rules` 審核風險規則 CRUD。
18. `/admin/audit-log` 操作與 export audit。

## C. TypeScript 資料模型（20 tables）
```ts
export interface User { id:string; email:string; name:string; role:'creator'|'brand_manager'|'reviewer'|'billing_owner'|'admin'; createdAt:Date; updatedAt:Date }
export interface Team { id:string; name:string; planId:string; creditBalance:number; createdAt:Date; updatedAt:Date }
export interface Membership { id:string; userId:string; teamId:string; role:string; createdAt:Date; updatedAt:Date }
export interface Project { id:string; teamId:string; title:string; mode:'static'|'animated'; stickerCount:8|16|24; language:'zh-TW'|'ja'|'en'; style:string; status:'draft'|'briefed'|'generating'|'qc_failed'|'qc_passed'|'exported'; createdBy:string; createdAt:Date; updatedAt:Date }
export interface Character { id:string; projectId:string; name:string; description:string; licenseStatus:'self_owned'|'licensed'|'unknown'; createdAt:Date; updatedAt:Date }
export interface CharacterAsset { id:string; characterId:string; fileUrl:string; kind:'reference'|'sheet'|'mask'|'thumbnail'; width:number; height:number; hash:string; createdAt:Date; updatedAt:Date }
export interface StyleLock { id:string; characterId:string; palette:string[]; lineStyle:string; forbiddenElements:string[]; consistencyNotes:string; createdAt:Date; updatedAt:Date }
export interface StickerBrief { id:string; projectId:string; slot:number; emotion:string; phrase:string; pose:string; motion:string; firstFrameRequirement:string; riskTags:string[]; status:'draft'|'approved'; createdAt:Date; updatedAt:Date }
export interface StickerItem { id:string; projectId:string; briefId:string; title:string; status:'empty'|'keyframed'|'animated'|'qc_failed'|'qc_passed'; currentApngOutputId?:string; createdAt:Date; updatedAt:Date }
export interface GeneratedFrame { id:string; stickerItemId:string; frameIndex:number; fileUrl:string; width:number; height:number; bytes:number; hash:string; source:'ai'|'mock'|'template'; createdAt:Date; updatedAt:Date }
export interface AnimationJob { id:string; stickerItemId:string; motionTemplateId:string; frameCount:number; playbackSeconds:1|2|3|4; loopCount:1|2|3|4; status:'queued'|'running'|'failed'|'completed'; createdAt:Date; updatedAt:Date }
export interface MotionTemplate { id:string; name:string; category:string; defaultFrameCount:number; riskLevel:'low'|'medium'|'high'; paramsJson:Record<string,unknown>; enabled:boolean; createdAt:Date; updatedAt:Date }
export interface ApngOutput { id:string; stickerItemId:string; fileUrl:string; width:number; height:number; frameCount:number; playbackSeconds:number; loopCount:number; bytes:number; isLineCompliant:boolean; createdAt:Date; updatedAt:Date }
export interface QcReport { id:string; projectId:string; stickerItemId?:string; level:'project'|'sticker'; p0Errors:string[]; p1Warnings:string[]; p2Suggestions:string[]; passed:boolean; createdAt:Date; updatedAt:Date }
export interface RiskRule { id:string; code:string; category:'ip'|'content'|'format'|'text'|'policy'; pattern:string; severity:'P0'|'P1'|'P2'; enabled:boolean; createdAt:Date; updatedAt:Date }
export interface ExportPackage { id:string; projectId:string; zipUrl:string; metadataJson:Record<string,unknown>; bytes:number; status:'blocked'|'ready'|'downloaded'; createdAt:Date; updatedAt:Date }
export interface CreditPlan { id:string; code:string; name:string; monthlyCredits:number; price:number; features:string[]; createdAt:Date; updatedAt:Date }
export interface CreditTransaction { id:string; teamId:string; amount:number; reason:string; projectId?:string; status:'pending'|'posted'|'refunded'; createdAt:Date; updatedAt:Date }
export interface AuditLog { id:string; actorId:string; teamId:string; action:string; entityType:string; entityId:string; diffJson:Record<string,unknown>; createdAt:Date; updatedAt:Date }
export interface Notification { id:string; userId:string; type:string; title:string; body:string; readAt?:Date; createdAt:Date; updatedAt:Date }
```

## D. API 規格摘要（request/response/error）
所有 API 回錯格式：`{ "error": { "code": string, "message": string, "details"?: unknown } }`。

### 1 POST /api/auth/login
Request `{ "email":"creator@example.com", "password":"demo" }`; Response `{ "token":"jwt", "user": {"id":"u1","role":"creator"} }`。
### 2 GET /api/projects
Response `{ "projects": Project[] }`。
### 3 POST /api/projects
Request `{ "title":"Mochi Cat", "mode":"animated", "stickerCount":8, "language":"zh-TW", "style":"flat-kawaii" }`; Response `{ "project": Project }`。
### 4 GET /api/projects/:id
Response `{ "project": Project, "character": Character|null, "stickers": StickerItem[], "qcSummary": object }`。
### 5 PUT /api/projects/:id
Request `{ "title"?:string, "status"?:string }`; Response `{ "project": Project }`。
### 6 DELETE /api/projects/:id
Response `{ "deleted": true }`。
### 7 POST /api/projects/:id/briefs/generate
Request `{ "theme":"daily office", "tone":"cute", "count":8 }`; Response `{ "briefs": StickerBrief[], "provider":"mock|ai" }`。
### 8 PUT /api/briefs/:id
Request `{ "emotion"?:string, "phrase"?:string, "motion"?:string }`; Response `{ "brief": StickerBrief }`。
### 9 POST /api/projects/:id/character-lock
Request `{ "name":"Mochi", "sourceAssetIds":["asset_1"], "licenseStatus":"self_owned", "ownershipDeclaration":true }`; Response `{ "character": Character, "styleLock": StyleLock }`。所有後續生成必須引用 characterAssetId/styleLockId，不得純文字創角。
### 10 POST /api/stickers/:id/keyframes/generate
Request `{ "briefId":"b1", "quality":"stable" }`; Response `{ "frames": GeneratedFrame[], "provider":"mock|ai" }`。
### 11 POST /api/stickers/:id/animate
Request `{ "motionTemplateId":"blink-bounce", "frameCount":10, "playbackSeconds":2, "loopCount":2 }`; Response `{ "animationJob": AnimationJob, "apngOutput": ApngOutput }`。
### 12 POST /api/stickers/:id/qc
Request `{ "apngOutputId":"a1" }`; Response `{ "report": QcReport }`。
### 13 GET /api/projects/:id/qc-report
Response `{ "projectReport": QcReport, "stickerReports": QcReport[] }`。
### 14 POST /api/projects/:id/package
Request `{ "copyright":"© Demo", "title":"Mochi Cat" }`; Response `{ "exportPackage": ExportPackage, "creditCharged": number }`；P0 未過回 `EXPORT_BLOCKED_BY_P0_QC`。
### 15 GET /api/exports/:id/download
Response: ZIP binary 或 `{ "downloadUrl":"..." }`。
### 16 GET /api/credits/balance
Response `{ "balance":120, "plan":"creator_pro" }`。
### 17 POST /api/credits/purchase
Request `{ "planCode":"creator_pro" }`; Response `{ "transaction": CreditTransaction }`。
### 18 GET/POST /api/admin/templates, /api/admin/risk-rules, GET /api/audit-logs
Admin CRUD with RBAC。

## E. Mock fallback
- `mockBriefPlanner`: 依 theme 產生 8/16/24 briefs。
- `mockKeyframeGenerator`: 產生 SVG/PNG placeholder frame metadata。
- `mockMotionEngine`: 產生 10-frame APNG-like output metadata 與可預覽 sprite。
- `deterministicQcEngine`: 以尺寸/幀數/秒數/loop/bytes/riskRules 判定 P0/P1/P2。
- `mockZipPackager`: 產生 ZIP manifest 與可下載 mock zip。

## F. Seed data
Demo users: creator@example.com, brand@example.com, reviewer@example.com, admin@example.com / password demo。Plans: free, creator_pro, studio, enterprise。Motion templates: blink, nod, shake, bounce, wave, sorry-bow, angry-shake, crying-tears, sweat-drop, heart-pop, sparkle-lite, ok-pop, thank-you, question-mark, cheer, sleep-breath。Risk rules 20+ include URL, LINE logo misuse, Disney/Sanrio/Pokemon strings, political, gambling, adult, sale/promo.

## G. 測試要求
Unit：line dimension, even size, frame count, playback*loop≤4, 1MB budget, risk rule matcher, credit debit/refund, brief count, style lock validation, export block, mock provider, audit writer。
API：auth/projects/briefs/character/keyframes/animate/qc/report/package/credits/admin/audit 正負案例。
E2E：static pack export, animated pack export, QC fail auto-degrade, mock fallback no API key, admin updates template/risk rule.


---

# 使用者自帶角色圖政策（User-provided Character First）

## Jason 校正
本產品不得以「平台幫使用者生成全新角色」作為核心功能。正式產品方向改為：

> 使用者自己提供角色圖式 / 吉祥物 / 插畫 / reference sheet，App 只負責把該角色轉成一般 LINE 貼圖與 LINE 規格內高階動態貼圖。

## 不做事項
1. 不提供「文字描述直接生成全新角色」作為主流程。
2. 不鼓勵使用者輸入知名 IP、明星、第三方角色做仿製。
3. 不把產品定位成 AI 角色生成器或泛用文生圖工具。
4. 不承諾 AI 能憑空維持角色一致性；一致性來自使用者上傳的 reference assets。

## 可做事項
1. 上傳角色圖、reference sheet、品牌吉祥物、表情基準圖。
2. 自動去背、裁切、線條/色盤分析、角色區域分割。
3. 建立 style lock：色盤、線條、五官、服裝、禁用變形。
4. 從上傳角色延展：表情、姿勢、簡單手勢、道具、小幅動態。
5. 以 AI 輔助生成 keyframe，但 keyframe 必須以使用者角色圖為條件，不得創造新角色。
6. 分層/puppet/template 動畫、APNG 壓縮、LINE 規格 QC、ZIP 輸出。

## 產品定位修正版
原定位「AI 生成貼圖」需改為：

> 使用者上傳自己的角色圖，系統將角色自動整理成 LINE 一般貼圖與 LINE 規格內高階動態貼圖包。

## 商業價值修正
此校正讓產品更有商機，原因：
1. 使用者已有角色/IP/品牌吉祥物，付費意願更高。
2. 避免平台承擔「生成角色像不像、是不是侵權」的主要風險。
3. 動態門檻仍存在：分層、APNG、壓縮、QC、ZIP 是真正付費理由。
4. 產品可服務插畫師、品牌小編、IP 經營者、LINE 創作者。

## 開發驗收新增紅線
- 建立專案時若選擇貼圖生成，必須先上傳至少 1 張角色 reference image。
- 未上傳角色圖時，不能進入 keyframe / animation generation。
- Demo seed 可以內建授權示範角色，但 UI 必須明確標示為 sample licensed asset。
- 所有 AI 生成 endpoint 必須接收 `characterAssetId` 或 `styleLockId`，不得只靠文字 prompt 生成角色。


---

# 2026-04-28 Jason P0/P1 強制補丁

本文件已受 `JASON_REVIEW_PATCH_20260428.md` 約束；若本文任何舊內容與該補丁衝突，以補丁為準。產品正式名稱為 **AUTO動態貼圖**。不得再使用舊名作為使用者可見產品名。

必讀補充檔：`LINE_SPEC_SINGLE_SOURCE.md`、`GATED_DELIVERY_PLAN.md`、`EXPORT_ZIP_AND_QC_ENGINE_SPEC.md`、`PRISMA_SCHEMA_REQUIREMENTS.md`、`RBAC_PERMISSION_MATRIX.md`、`SECURITY_REQUIREMENTS.md`、`PROVIDER_ABSTRACTION_SPEC.md`、`MOTION_TEMPLATE_DEFINITION_SPEC.md`、`UI_EVIDENCE_SPEC.md`、`LEGAL_AND_USER_RIGHTS_SPEC.md`。
