# proposal_full.md — AUTO動態貼圖 LINE 規格化貼圖工作台

updated_at: 2026-04-28T19:59:42+08:00
status: developer_ready_planning_complete
product_mode: web_first / SaaS / PWA

> 本案是一次性完整開發規格，不是 MVP、不是影片生成器、不是一般 AI 生圖玩具，也不是平台替使用者創造新角色。核心是「使用者上傳自有角色圖 → 一般貼圖 + LINE 規格內高階動態貼圖」的全流程 Web 工作台：角色 reference upload、授權聲明、角色一致性、關鍵幀/模板動作、APNG 壓縮、LINE 合規 QC、ZIP 輸出、審核風險報告。

---

# 0. 題目基本資訊
- 命題編號：20260428_line_animated_sticker_autogen
- 題目名稱：AUTO動態貼圖 LINE 規格化貼圖工作台
- 專案類型：大型 WEB / SaaS / PWA / AI-first Creator Tool
- 核心定位：將角色、情緒、台詞、動作模板轉成 LINE Creators Market 可上傳的靜態/動態貼圖包。
- 主要角色：Creator、Brand Manager、Reviewer、Admin、Billing Owner。
- 完整交付目標：從登入、專案建立、角色鎖定、貼圖企劃、AI keyframe、template motion、APNG/QC、ZIP export、credit billing、audit log、mock fallback 到 Windows Web 驗收入口一次完成。

# 1. 市場研究摘要
## 1.1 市場熱度
1. LINE Creators Market 官方規格完整且門檻明確：動態貼圖 8/16/24 張、APNG、5–20 幀、1/2/3/4 秒、loop≤4秒、單張≤1MB、ZIP≤60MB。
2. 使用者自帶角色圖降低「角色從零生成」的不確定性；產品價值集中在把既有角色轉成 LINE-ready 靜態/動態貼圖，並處理規格、壓縮、角色一致性、審核風險與輸出包。
3. 品牌社群、創作者、插畫師持續需要低成本產出吉祥物/角色貼圖，且動態貼圖比靜態貼圖有更高感知價值。
## 1.2 高頻痛點
- 使用者不懂 APNG/幀數/loop/透明背景/檔案大小，反覆退件。
- AI 生成多張圖時角色漂移，整套貼圖不一致。
- 動畫效果若走影片路線，易超過 1MB 或壓縮後失真。
- 審核風險（侵權、URL、政治宗教、商標、肖像）需要送審前預警。
## 1.3 現有替代方案抱怨
1. LINE Sticker Maker 操作簡單但不解決高階動態、角色一致性與批次 QC。
2. 一般 AI 圖片工具多半以從零生圖為主，不是以使用者自帶角色圖延展為主流程，也不懂 LINE APNG 尺寸、loop、ZIP 包與送審限制。
3. 動畫/設計工具可做高品質動畫，但學習成本高、難批次輸出 LINE 合規包。
## 1.4 缺口判斷
缺口不是「再做一個生圖器」，而是 user-owned character → LINE-specific delivery layer：上傳角色圖、授權聲明、角色一致性、動作模板、APNG 壓縮、LINE QC、ZIP export、audit/授權紀錄。
## 1.5 成立性結論
成立。若只做一般貼圖商業價值普通；若做 LINE 規格內高階動態 + QC/輸出工作台，具備付費理由。

# 2. 產品一句話定義
AUTO動態貼圖 是 LINE 貼圖創作者工作台：輸入角色/台詞/情緒/動作，系統以 AI 輔助企劃與關鍵幀、deterministic 動作模板與 QC 產出可上傳 LINE Creators Market 的靜態/動態貼圖 ZIP 與審核風險報告。

# 3. 不可偏移核心原則
1. **LINE 規格優先**：不得把影片級動畫當賣點；所有輸出必須受 APNG/1MB/幀數/loop/QC 約束。
2. **AI-first 但不可 AI-only**：AI 可做企劃、關鍵幀、修正建議；正式 APNG、大小預估、QC、ZIP、audit 必須 deterministic。
3. **兩入口簡單化**：只保留一般貼圖與動態貼圖兩個核心入口，不膨脹成全功能動畫軟體。
4. **使用者自帶角色圖是產品前提**：平台不主打創角；style lock、reference upload、授權聲明、批次差異檢查不得省略。
5. **不承諾 LINE 必過審**：產品只能降低風險並產出 QC 報告，不可保證官方審核通過。
6. **一次性完整交付**：不得以 MVP/V1/V2 產品版本拆分；可有施工批次，但交付須完整可驗收。

# 4. 題目成立理由
AI 生圖讓素材供給增加，但 LINE 送審規格仍是非專家痛點。產品必須做成工作台而非 landing page，因為需要 workspace、專案狀態、批次產物、檔案儲存、角色資料、QC、審核紀錄、credit、export 與 audit。

# 5. 產品定位
核心客群：LINE 貼圖創作者、品牌社群小編、插畫師/設計工作室、小型電商/自媒體。付費動機是省下動畫師/APNG/退件修改成本，快速產出可送審 ZIP。

# 6. 角色 / 權限 / 使用結構
- Creator：建立專案、上傳角色、生成/編輯貼圖、下載 ZIP。
- Brand Manager：管理品牌角色、授權紀錄、審核整包輸出。
- Reviewer：檢視 QC/風險、批准 export、要求修改。
- Billing Owner：管理 credit、方案、發票與團隊席位。
- Admin：管理動作模板、風險詞、審核案例、系統設定。

# 7. 最終交付內容
## 7.1 前端頁面 / 功能區（18）
1. `/login` 登入與 demo 帳號。 2. `/dashboard` 專案/credit/最近輸出。 3. `/projects/new` 建立貼圖包。 4. `/projects/[id]` 專案總覽。 5. `/projects/[id]/character` 角色設定與 reference。 6. `/projects/[id]/briefs` 情緒/短語企劃。 7. `/projects/[id]/stickers/[sid]` 單張編輯。 8. `/projects/[id]/stickers/[sid]/keyframes` 關鍵幀。 9. `/projects/[id]/stickers/[sid]/animate` 動畫預覽。 10. `/projects/[id]/qc` QC 報告。 11. `/projects/[id]/preview` 整包預覽。 12. `/projects/[id]/export` ZIP 輸出。 13. `/credits` credit/訂閱。 14. `/settings` 個人/團隊/API key。 15. `/help/line-guideline` LINE 規格指南。 16. `/admin/templates` 動作模板管理。 17. `/admin/risk-rules` 風險規則。 18. `/admin/audit-log` audit log。
## 7.2 API（18）
`POST /api/auth/login`, `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/:id`, `POST /api/projects/:id/briefs/generate`, `PUT /api/briefs/:id`, `POST /api/projects/:id/character-lock`, `POST /api/stickers/:id/keyframes/generate`, `POST /api/stickers/:id/animate`, `POST /api/stickers/:id/qc`, `GET /api/projects/:id/qc-report`, `POST /api/projects/:id/package`, `GET /api/exports/:id/download`, `GET /api/credits/balance`, `POST /api/credits/purchase`, `GET/POST /api/admin/templates`, `GET/POST /api/admin/risk-rules`, `GET /api/audit-logs`.
## 7.3 資料表（20）
users, teams, memberships, projects, characters, character_assets, style_locks, sticker_briefs, sticker_items, generated_frames, animation_jobs, motion_templates, apng_outputs, qc_reports, risk_rules, export_packages, credit_plans, credit_transactions, audit_logs, notifications.

# 8. 資料模型正式規格
詳見 `SPEC.md`。所有 20 張表均有 TypeScript interface，開發者可擴充不得刪除核心欄位。

# 9. 核心業務流程
登入 → 建立專案 → 選 8/16/24 與語言/風格 → 建立角色/上傳 reference → AI 產生 sticker briefs → 人工確認 → 生成 keyframes → 選 motion template → APNG 產生/壓縮 → QC 報告 → 修正或批准 → 產出 LINE ZIP → audit/credit 扣款。
失敗回退：AI 失敗 → mock planner/template motion；APNG 超標 → 減幀/減色/減粒子/縮小動作區；QC P0 失敗 → 禁止 export。

# 10. 系統模組拆解
1. Auth/RBAC。2. Project Workspace。3. Character Consistency Engine。4. Brief Planner。5. Keyframe Generator。6. Motion/Animation Engine。7. APNG/QC Processor。8. Export Packager。9. Billing/Credit。10. Admin Risk/Template Console。11. Audit/Analytics。

# 11. API 端點正式規格
詳見 `SPEC.md`，每組 API 均需 request/response/error JSON；所有 AI API 必須有 mock fallback。

# 12. Mock Service / Fallback 規格
無外部 AI key 時，系統使用 deterministic sticker brief seed、內建角色 placeholder、template motion frames、fake APNG metadata、QC rule engine 產生完整可驗收流程；不得只回傳一行假文字。

# 13. Seed Data 完整規格
需包含 Free/Creator Pro/Studio/Enterprise 四方案、12 個情緒包、16 個動作模板、20 條風險規則、4 個 demo user、3 個 demo project、24 張 sticker brief、至少 20 筆 demo sticker/QC/export 記錄。

# 14. 配額與訂閱邏輯
Free：每月 1 個靜態包、不可下載商用報告；Creator Pro：每月 10 包、含動態與 QC；Studio：團隊席位/品牌角色；Enterprise：私有模板、人工審核、商用授權紀錄。Credit 於產生 export package 時扣除，AI keyframe 可預扣/失敗退回。

# 15. Analytics 埋點
project_created, briefs_generated, character_asset_uploaded, character_lock_created, keyframes_generated, motion_template_applied, apng_budget_warning, qc_failed, qc_passed, export_created, zip_downloaded, credit_purchased, risk_rule_triggered。

# 16. 錯誤處理規格
APNG_TOO_LARGE、INVALID_LINE_DIMENSION、FRAME_COUNT_OUT_OF_RANGE、LOOP_TIME_INVALID、AI_PROVIDER_UNAVAILABLE、CHARACTER_DRIFT_HIGH、IP_RISK_DETECTED、INSUFFICIENT_CREDITS、EXPORT_BLOCKED_BY_P0_QC 均需明確 UI 訊息與補救動作。

# 17. 測試要求
Unit 12+：dimension/loop/frame/qc/credit/style-lock/risk rules。API 12+：projects/briefs/keyframes/animate/qc/package/credits/admin。E2E 5+：一般貼圖、動態貼圖、QC fail 修正、mock fallback、credit/export。

# 18. 驗收標準
至少完成登入、專案、角色、brief、keyframes、motion、APNG metadata、QC、export ZIP、credit、admin templates、risk rules、audit、mock fallback、README、Windows Web 入口；任一 P0 QC 可被無視即失敗。

# 19. 完整施工順序（8 批）
1. 專案骨架/RBAC/seed。2. Project/Character/Brief 資料流。3. Sticker editor/keyframe UI。4. Motion template/APNG mock processor。5. QC rule engine。6. Export/ZIP/metadata。7. Billing/credit/admin/audit。8. 測試、README、Windows 驗收入口與 polish。

# 20. 建議專案目錄結構
Next.js 15 App Router + TypeScript + Prisma/PostgreSQL + Tailwind；`app/`, `components/`, `lib/qc`, `lib/apng`, `lib/mock-ai`, `prisma/`, `tests/unit`, `tests/api`, `tests/e2e`, `public/demo-assets`。

# 21. README 必含項目
產品定位、不可偏移紅線、環境變數、安裝/seed/build/test、demo 帳號、主要路由、API 摘要、mock fallback、LINE 規格限制、驗收腳本、已知風險。

# 22. 驗收操作腳本
詳見 `ACCEPTANCE.md`：A 一般貼圖、B 動態貼圖、C QC 失敗與自動降級、D mock fallback、E admin/template/risk、F credit/export。

# 23. 給開發 Agent 的最終指令
詳見 `SEBASTIAN_START_PROMPT.md`。請一次完成完整 Web 產品，不得改成影片生成器、純生圖器或文件 demo。

# 24. 商業化與延展
付費來自動態貼圖包 credit、高階 motion template、品牌角色鎖定、商用授權紀錄、團隊協作與人工審核。留存來自角色庫、模板庫、審核歷史、品牌字詞與 QC 規則。

# 25. 最終結論
推薦立項：是。推薦等級：A-。成立理由：LINE 規格與 APNG/QC 門檻創造產品化空間；AI 只做素材/企劃不足以付費，LINE-specific delivery layer 才是商業核心。

# 26. 自我檢查
- [x] 市場研究在先，已有官方規格/審核/技術來源。
- [x] 3+ 市場/痛點信號。
- [x] 16+ pages（18）。
- [x] 14+ APIs（18）。
- [x] 18+ tables（20）。
- [x] TS models in SPEC。
- [x] Mock fallback。
- [x] Seed data。
- [x] Unit/API/E2E tests。
- [x] 4+ acceptance scripts。
- [x] AI-first 重構：AI 企劃/關鍵幀；deterministic QC/export/audit。
- [x] 不使用 MVP/V1/V2 產品切分。
- [x] 可交 Sebastian 接手。


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
