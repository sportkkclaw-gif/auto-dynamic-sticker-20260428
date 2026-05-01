# Simon QC Review — REJECTED

- task_id: 20260428_line_animated_sticker_autogen
- reviewed_at: 2026-05-01T18:34:32+08:00
- verdict: REJECTED
- responsibility: OP_DELIVERY_DEFECT
- return_to: OP / Sebastian
- formal_path_at_review: /home/sport/WORK/AGENTS/03_待驗收/sebastian/20260428_line_animated_sticker_autogen
- final_review_package_expected: D:\WORK\成品區\待最終審核\sebastian\20260428_line_animated_sticker_autogen
- report_d: /mnt/d/WORK/成品區/_驗收報告/Simon/20260428_line_animated_sticker_autogen/20260501T183432_+0800_20260428_line_animated_sticker_autogen_review.rejected.md

## 必修項
1. 補齊正式 `PRODUCT_SPEC.md` 或明確指定 `SPEC.md` 為唯一正式規格，並補 `TEST_RESULT.md`。
2. 將本輪最新完整可執行 Web 成品包部署到 `D:\WORK\成品區\待最終審核\sebastian\20260428_line_animated_sticker_autogen`，不可只留在 `_退回修改`。
3. 修復 production local auth cookie/session：`POST /api/auth/login` 於 `http://127.0.0.1:3010` 不得設 Secure 導致 cookie jar / browser local protected API 401；或更新正式規格/README 為可重現契約。
4. 重送前需重新跑 build/test/live route/auth probes，並同步 source 與 D 槽 truth pack。

## 實測證據
- `node --run test`: PASS，7 files / 178 tests。
- `node --run build`: PASS，Next.js 15.2.4，25 static pages / app routes listed；source BUILD_ID `uxEnl24xoSmHThPsVAjiT`。
- production live `PORT=3010 node --run start`: 18 spec pages + `/api/health` 200；protected APIs unauth 401 guard OK。
- protected-session probe: login `admin@demo.local/admin123` 回 200 且 Set-Cookie 含 `Secure; HttpOnly`；同 cookie jar GET `/api/projects` 回 401 `Unauthorized. Please log in.`。
- D final-review package: `/mnt/d/WORK/成品區/待最終審核/sebastian/20260428_line_animated_sticker_autogen` 不存在；只找到 `_退回修改` 舊包 `/mnt/d/WORK/成品區/_退回修改/sebastian/20260428_line_animated_sticker_autogen`。
- truth pack: `PRODUCT_SPEC.md` missing（已讀 `SPEC.md` 替代）；`TEST_RESULT.md` missing；checklist checked=26, unchecked=0, p0_unchecked=0。

## resubmit 條件
- OP 修正上述 4 個必修項。
- 重新提交 `pending_review + build.ready`，附 clean build/test、auth cookie protected API、全部 spec route、D package freshness 證據。
