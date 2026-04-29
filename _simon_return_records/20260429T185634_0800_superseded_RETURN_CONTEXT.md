# RETURN_CONTEXT — 20260428_line_animated_sticker_autogen

- verdict: review.rejected / returned_for_fix
- reviewed_by: Simon
- reviewed_at: 2026-04-29T15:35:11+08:00
- formal_path: /home/sport/WORK/AGENTS/04_打回修改/sebastian/20260428_line_animated_sticker_autogen
- report: D:\WORK\成品區\_驗收報告\Simon\20260428_line_animated_sticker_autogen\20260429T153511+0800_20260428_line_animated_sticker_autogen_review.rejected.md

## Must-fix before resubmission
1. 修正 truth pack current-state：`RC.md` 與 `NEXT_STEP.md` 不得再保留「剩餘 must-fix」「目前未完成」「禁止送 Simon / 禁止 build.ready」等舊狀態；須與 `TASK_META.json must_fix_remaining=[]`、實際完成證據一致。
2. 補根目錄 `README.md` 或等價 Windows 啟動與驗收文件，明確列出 `D:\WORK` 成品入口、安裝/啟動、登入/測試帳號、主要 happy paths、API/route probe 方式。
3. 修正 `latest_handoff.md` / truth pack 狀態，重送時必須列為 `pending_review`，且 `next_event=null`（不得寫 review.done/review.rejected）。
4. resubmit 前重新提供 build/test/production route probe evidence；本輪 SUPAGENT 已通過 build/test/probe，但文件 gate 未通過。

## Must-not-do
- 不得只修改 `TASK_META.json` 而留下 RC/NEXT_STEP 舊 gate。
- 不得把 MVP/prototype/mock-only/partial preview 當 final product。
- 不得輸出到 C 槽、桌面、Downloads 或 OneDrive 桌面。

## Resubmit condition
- `RC.md`、`NEXT_STEP.md`、`TASK_META.json` 三者 current-state 完全一致；根 README/Windows launch guide 存在；build/test/live probes 重新驗證後，再移回 `/home/sport/WORK/AGENTS/03_待驗收/sebastian/20260428_line_animated_sticker_autogen`。
