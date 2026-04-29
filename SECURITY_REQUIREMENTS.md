# SECURITY_REQUIREMENTS.md

所有 API 檢查登入；所有 project/asset/export 檢查 team ownership；上傳檢查 MIME、extension、size、dimensions；禁止 SVG；檔名 sanitize；production cookie httpOnly/secure；mutation endpoint 需 CSRF/same-site 保護；auth rate limit；audit log 不記 token/API key/完整信用卡；.env.example 不得含真 key。
