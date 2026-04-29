# EXPORT_ZIP_AND_QC_ENGINE_SPEC.md

Export 必須產生實際 ZIP，不得只回傳 manifest JSON。ZIP 至少包含 main.png、tab.png、01.png...08/16/24.png、manifest.json、qc_report.json。Animated project 的 01.png... 必須是 APNG 格式但副檔名維持 .png。所有 OK/Review/Risk/P0/P1/P2 badge 必須由 QC engine 根據 sticker item、apng output、lineSpec.ts、risk rules 計算；UI 不得 hard-code。Export enable/disable 只讀 qcReport.exportBlocked。
