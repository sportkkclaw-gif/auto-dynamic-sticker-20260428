# SEBASTIAN_START_PROMPT.md — AUTO動態貼圖 開發啟動指令

你要開發的是 AUTO動態貼圖 LINE 規格化貼圖工作台：一般貼圖 + LINE 規格內高階動態貼圖的 Web/PWA SaaS。

這不是影片生成器、不是全功能動畫軟體、不是純 AI 生圖 demo。核心是：LINE Creators Market 可上傳交付閉環（角色/brief/keyframe/template motion/APNG QC/ZIP/audit/credit）。

必讀：proposal_full.md → SPEC.md → FULL_BUILD_CHECKLIST.md → ACCEPTANCE.md → RISKS.md → RESEARCH_AND_AUTOGEN_DESIGN.md → HIGH_END_ANIMATION_FEASIBILITY.md。

最低完成標準：
1. Next.js 15 + TS + Prisma。2. 18 pages。3. 18 APIs。4. 20 tables。5. Demo seed。6. 一般貼圖流程。7. 動態貼圖流程。8. Mock AI fallback。9. Deterministic QC。10. Auto degrade。11. ZIP package。12. Credit。13. Admin templates/risk rules。14. Audit log。15. Tests。16. Build pass。17. README。18. Windows Web 驗收入口。

完成後回報：啟動 URL、demo 帳號、build/test 結果、API/route 清單、資料表/seed、mock fallback 證據、QC/ZIP 證據、credit/admin/audit 證據、已知限制、成品區路徑。


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
