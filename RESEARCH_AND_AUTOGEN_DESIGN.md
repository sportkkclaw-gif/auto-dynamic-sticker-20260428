# LINE 動態貼圖製作方式、規格與自動生成方案研究

- 任務：查詢 LINE 動態貼圖製作方式與規格，並設計可自動生成的產品/技術方案
- 狀態：research_complete；可進一步升級成大型 WEB 開發案，但本文件先不 `plan.ready`
- 時間：2026-04-28

---

## 1. 官方規格摘要（LINE Creators Market Animated Stickers）

### 1.1 上架素材組成
| 素材 | 數量 | 尺寸 | 格式 | 重要限制 |
|---|---:|---|---|---|
| Main image 主圖 | 1 | 240 × 240 px | PNG/APNG | 1MB 以下 |
| Animated sticker image 動態貼圖 | 8 / 16 / 24 張 | 最大 320 × 270 px | APNG（副檔名 .png） | 每張 1MB 以下；ZIP 60MB 以下 |
| Chat thumbnail icon 聊天縮圖 | 1 | 96 × 74 px | PNG（非 APNG） | 右上播放符號由 LINE 自動加，不可自加 |

補充限制：
- 圖片需 RGB、至少 72 dpi、透明背景。
- 寬與高都必須是偶數。
- 動態貼圖的寬或高任一邊至少 270px；若高度為長邊，通常以 270px 為基準。
- 建議去除多餘透明邊界，但圖像周圍保留約 10px 安全邊距，避免聊天視窗中貼邊。

### 1.2 APNG 動畫規格
| 項目 | 規格 |
|---|---|
| 每張 APNG 幀數 | 5–20 幀 |
| 單次播放時間 | 1 / 2 / 3 / 4 秒，只能整秒，不可 1.5 秒 |
| 循環次數 | 1–4 次 |
| 總播放時間 | 播放時間 × 循環次數 ≤ 4 秒 |
| 第一幀 | 會作為未播放、舊版 LINE、商店預覽的靜態圖，必須單獨成立 |

### 1.3 常見退件/失敗點
1. 格式錯：尺寸、透明背景、RGB、檔案大小、APNG 幀數/秒數不符。
2. APNG 工具合併重複幀：若多張幀完全相同，APNG Assembler 可能合併，導致實際幀數低於 5。
3. 全幀完全靜態：所有幀資料相同會上傳錯誤。
4. 檔案過大：大面積漸層、背景大範圍動畫、火焰/速度線/閃光特效容易超過 1MB。
5. 圖像品質：純文字、缺乏變化、可視性差、過長全身角色、拼字錯誤、主圖/縮圖與貼圖不一致。
6. 內容審核：暴力、性暗示、賭博、政治宗教宣傳、第三方通訊軟體、URL、廣告促銷、商標/肖像/版權問題。

---

## 2. 官方/技術來源

- LINE 動態貼圖指南：https://creator.line.me/en/guideline/animationsticker/detail/
- LINE 靜態貼圖指南：https://creator.line.me/en/guideline/sticker/
- LINE 審核準則：https://creator.line.me/en/review_guideline/
- LINE Sticker Maker：https://creator.line.me/en/stickermaker/
- LINE Creators FAQ：https://help2.line.me/creators/web/pc?lang=en
- APNG Assembler / apngasm：https://github.com/apngasm/apngasm
- Pillow APNG support：https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html#apng-sequences
- rembg 去背工具：https://github.com/danielgatis/rembg
- Diffusers ControlNet：https://huggingface.co/docs/diffusers/main/en/using-diffusers/controlnet
- Diffusers IP-Adapter：https://huggingface.co/docs/diffusers/main/en/using-diffusers/ip_adapter

---

## 3. 自動生成產品構想：AUTO動態貼圖 LINE 動態貼圖生成器

### 3.1 一句話定位
把「角色設定、台詞、情緒、動作」自動轉成可上傳 LINE Creators Market 的 8/16/24 張 APNG 動態貼圖包，並在輸出前自動做尺寸、幀數、檔案大小、第一幀、透明背景與審核風險檢查。

### 3.2 目標客群
1. LINE 貼圖創作者：想提高產能、快速測試多套角色。
2. 社群小編/品牌設計：要做活動貼圖，但不熟 APNG 技術規格。
3. 插畫師：已有角色，想批次生成情緒/動作變體。
4. 小型電商/自媒體：想快速產出品牌吉祥物貼圖，但無動畫師預算。

### 3.3 核心價值
- 不是單張 AI 圖片生成器，而是「LINE 規格化交付器」。
- 自動處理最麻煩的規格：透明背景、APNG、幀數、loop、大小、ZIP、命名、縮圖。
- 讓創作者在送審前先看到退件風險，降低反覆修改成本。

---

## 4. 自動生成流程設計

### Stage A：輸入與企劃生成
使用者輸入：
- 角色來源：使用者上傳角色圖 / 既有角色 reference sheet / 品牌吉祥物素材；不提供文字直接生成新角色作為主流程。
- 貼圖數量：8 / 16 / 24。
- 語言與文字風格：繁中、日文、英文；可選是否在圖上放字。
- 情緒包模板：日常、上班、可愛、情侶、品牌客服、遊戲社群等。
- 風格：扁平色、Q版、手繪、像素、3D 軟糖感等。

系統輸出：
- 8/16/24 個 sticker brief：每張包含 `emotion`、`phrase`、`pose`、`motion`、`first_frame_requirement`、`risk_tags`。
- 自動避免：URL、促銷、政治宗教、第三方 IP、疑似侵權角色描述。

### Stage B：角色一致性建立
推薦技術：
- 使用 reference image + IP-Adapter / image prompt 保持角色外觀一致。
- 使用 ControlNet / pose skeleton 控制姿勢與輪廓。
- 需要穩定商用時，可為單一品牌角色訓練 LoRA；但初版可先用 reference image + prompt constraints。

輸出：
- `character_sheet.png`：正面、側面、表情基準。
- `style_lock.json`：顏色、線條、眼睛、髮型、服裝、禁用元素。

### Stage C：單張貼圖關鍵幀生成
每張貼圖先生成 3–5 個 keyframes：
1. 第一幀：情緒可單獨讀懂。
2. 中間幀：動作高點，例如跳起、揮手、爆哭。
3. 結尾幀：回彈或停格。

處理原則：
- 優先做「小幅循環」：眨眼、手揮、身體 bounce、汗滴、愛心、驚嚇震動。
- 避免大面積背景動畫，背景固定透明。
- 避免過多粒子、漸層與閃光，降低 APNG 大小。

### Stage D：補幀與動畫合成
可行做法分三層：

**方案 1：Template motion（最穩）**
- 對角色圖做 2D transform：scale、rotate、translate、squash/stretch、blink mask、手部/道具分層。
- 優點：可控、檔案小、審核穩。
- 缺點：動作較簡單。

**方案 2：AI keyframe + interpolation（效果較好）**
- AI 生成 3–5 張 keyframes，再用 frame interpolation 補到 8–20 幀。
- 優點：自然。
- 缺點：角色漂移、手部變形、邊緣閃爍，需要 QC。

**方案 3：骨架/分層 puppet（專業版）**
- 自動切出頭、手、身體、道具，建立簡易骨架動畫。
- 優點：一致性最高。
- 缺點：前處理複雜。

建議產品初版採「方案 1 + 少量 AI keyframe」：先保證 LINE 可上傳與可控產能。

### Stage E：去背、裁切、尺寸與安全邊距
自動處理：
- rembg / segmentation 去背景。
- 透明區 trim，但保留 10px 安全邊距。
- resize 到 320×270 內，寬高取偶數。
- 若內容太窄/太高，提示重新構圖。
- 統一 RGB/RGBA、72dpi metadata。

### Stage F：APNG 封裝
封裝策略：
- 每張貼圖輸出 5–20 幀。
- 常用建議：10 幀 × 2 秒 × 2 loops = 4 秒；或 20 幀 × 4 秒 × 1 loop。
- 使用 apngasm 或 Pillow `save_all=True` 產生 APNG。
- 輸出副檔名為 `.png`，但 MIME/內容為 APNG。

### Stage G：自動壓縮與合規驗證
驗證清單：
- [ ] 主圖 240×240，1MB 以下。
- [ ] 每張動態貼圖 ≤ 320×270，寬高偶數，任一邊 ≥270。
- [ ] 每張 APNG 5–20 幀。
- [ ] playback time 為 1/2/3/4 秒。
- [ ] playback × loop ≤4 秒。
- [ ] 每張 APNG 1MB 以下。
- [ ] ZIP 60MB 以下。
- [ ] 透明背景。
- [ ] 第一幀可獨立辨識情緒。
- [ ] 無 URL、廣告、政治宗教、第三方商標/IP、高風險詞。

### Stage H：輸出包
```
line_sticker_pack.zip
├── main.png                 # 240x240
├── tab.png                  # 96x74 static PNG
├── 01.png                   # APNG sticker
├── 02.png
├── ...
├── metadata.json            # title, description, copyright, phrases
├── qc_report.html           # 規格檢查與退件風險
└── source_frames/
    ├── 01/frame_001.png
    └── ...
```

---

## 5. 系統架構建議

### 5.1 模組
1. Prompt Planner：生成整組貼圖的情緒、短語與動作 brief。
2. Character Consistency Engine：reference image、style lock、LoRA/IP-Adapter 管理。
3. Frame Generator：產生第一幀與 keyframes。
4. Motion Engine：template animation / interpolation / puppet。
5. Compliance Processor：尺寸、透明、裁切、APNG、壓縮。
6. Review Risk Scanner：文字與圖像風險掃描。
7. Packager：輸出 LINE 可上傳 ZIP。
8. Human Review UI：逐張預覽、重生、改字、鎖定角色。

### 5.2 最小可行 API 介面
- `POST /projects`：建立貼圖專案。
- `POST /projects/:id/briefs/generate`：產生 8/16/24 張 sticker brief。
- `POST /projects/:id/character-lock`：建立角色一致性設定。
- `POST /stickers/:id/keyframes/generate`：生成關鍵幀。
- `POST /stickers/:id/animate`：產生幀序列與 APNG。
- `POST /stickers/:id/qc`：單張貼圖 QC。
- `POST /projects/:id/package`：打包 LINE ZIP。
- `GET /projects/:id/qc-report`：取得合規報告。

### 5.3 資料模型草案
- `projects`：貼圖包專案、目標數量、語言、風格、狀態。
- `characters`：角色描述、reference image、style lock、授權狀態。
- `sticker_briefs`：情緒、短語、動作、第一幀要求、風險標籤。
- `generated_frames`：幀序列、尺寸、hash、透明度、模型版本。
- `apng_outputs`：播放秒數、loop、幀數、檔案大小、QC 狀態。
- `qc_reports`：錯誤、警告、修正建議。
- `export_packages`：ZIP 位置、metadata、版本。

---

## 6. 自動 QC 規則設計（核心差異化）

### P0 硬性規格檢查
只要不合格就不能輸出：尺寸、檔案大小、幀數、播放秒數、loop、透明背景、ZIP 大小。

### P1 審核風險檢查
- OCR 掃描圖中文字：URL、促銷語、錯字、過短/過長。
- Logo/商標偵測：疑似 LINE、Disney、Sanrio、Pokemon 等高風險 IP。
- 圖像安全分類：性、暴力、政治、宗教、賭博、自傷、毒品、仇恨。
- 人臉/肖像：若像真人照片，要求使用者確認授權。

### P2 可讀性檢查
- 第一幀縮到聊天視窗尺寸仍能辨識。
- 對比不足、文字太小、角色太細長、動作幅度不足。
- 整組貼圖風格不一致、角色漂移。

---

## 7. 開發可行性判斷

### 技術可行
- APNG 生成可由 apngasm 或 Pillow 完成。
- 去背可由 rembg/segmentation 完成。
- 圖像生成可用任何商用文生圖/圖生圖模型；角色一致性用 reference image、IP-Adapter、ControlNet 或 LoRA。
- 最需要產品化的不是生成模型本身，而是「LINE 規格化、QC、批次重生、可上傳 ZIP」。

### 商業成立點
- LINE 貼圖創作者與品牌需求明確，但技術門檻在 APNG、尺寸、審核與一致性。
- 可採 credit 制：每組 8/16/24 張收費，或月訂閱包含若干輸出包。
- B2B 品牌可加價：角色授權管理、品牌字詞庫、人工審核、商用授權紀錄。

### 主要風險
1. 角色一致性：若平台從零生成角色，多張容易漂移；本案改為使用者自帶角色圖，以 reference lock、分層與差異檢查控制延展品質。
2. 智財權：若使用者輸入知名角色，需明確阻擋或要求授權聲明。
3. 審核不保證：產品只能降低風險，不能承諾 LINE 必過。
4. 動畫品質：若完全依賴 AI 影片生成，APNG 體積與角色閃爍風險高；建議先用 template motion。

---

## 8. 建議下一步

若 Jason 要把此題升級成正式開發案，建議定位為「大型 WEB / AI-first 創作者工具」：
- 不是普通貼圖產生器，而是 LINE Creators Market 送審前的全流程工作台。
- 核心頁面應包含：專案 dashboard、角色設定、情緒包企劃、單張貼圖編輯、動畫預覽、QC 報告、輸出中心、授權/風險紀錄、收費/credit。
- 正式規格需再補：16+ 頁面、14+ API、18+ tables、Mock fallback、seed data、測試與驗收腳本後才可交 Sebastian。
