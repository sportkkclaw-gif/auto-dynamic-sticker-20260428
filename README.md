# AUTO動態貼圖（LINE Animated Sticker Autogen）

本專案為 AUTO動態貼圖 Web 版，提供：
- 貼圖專案管理（brief/keyframe/motion）
- LINE 規格 QC 檢查與 export gate
- credit / risk rules / audit API

## 環境需求
- Node.js 24+
- npm（或 `node --run`）

## 啟動（WSL/Linux）
```bash
node --run test
node --run build
PORT=3010 node --run start
```

## Windows 啟動與驗收（D:\\WORK）
```bat
cd /d D:\WORK\tmp\auto-sticker_autogen
C:\Progra~1\nodejs\node.exe C:\Progra~1\nodejs\node_modules\npm\bin\npm-cli.js install --no-audit --no-fund
npm run test
npm run build
set PORT=3010
npm run start
```

## 路由驗收建議
- Web: `/` `/dashboard` `/projects` `/qc` `/admin` → 預期 200
- API:
  - `/api/health` → 200
  - `/api/auth/login`（GET）→ 405（method guard）
  - `/api/projects` `/api/qc` `/api/export` `/api/credits` `/api/risk-rules` `/api/audit`（未帶 token）→ 401（auth guard）

## 備註
- 本案依 Jason patch 規範：`JASON_REVIEW_PATCH_20260428.md` 與相關 spec 文件。