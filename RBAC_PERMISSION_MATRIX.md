# RBAC_PERMISSION_MATRIX.md

權限至少包含：project:create/read/update、asset:upload、stylelock:create、brief:generate、sticker:render、motion:apply、qc:run、export:create/download、credit:purchase、billing:read、admin:template:write、admin:riskRule:write、audit:read。前端隱藏按鈕不算權限控管；API route 必須檢查 session、team scope、role permission。
