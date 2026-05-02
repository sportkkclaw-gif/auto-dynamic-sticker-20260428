# NEXT_STEP — AUTO動態貼圖

updated_at: 2026-05-02T14:09:06+08:00
status: returned_for_fix
formal_status: returned_for_fix
next_event: null
next_agent: sebastian

## 已完成
- SUPAGENT-first 修復完成並新增 no-DB auth 測試；controller canonical `node --run test`=193 PASS、`node --run build`=PASS。
- SUPAGENT cloud live probe 已重跑：login 仍 500（無 cookie），/api/projects with/without cookie 皆 401。

## 下一步
- 先補齊 Vercel redeploy 能力（CLI + `VERCEL_TOKEN` 或 `VERCEL_API_TOKEN`），再以 SUPAGENT 觸發 preview redeploy。
- redeploy 後重跑 login→authenticated API probe；login 不得 500 且需有 cookie。
- 以同一組 cookie 重探針 `/api/projects`、`/api/credits`、`/api/audit`、`/api/export`（至少四條）確認雲端端點行為與本地 no-DB 結果一致，再決定是否送 `build.ready`。
