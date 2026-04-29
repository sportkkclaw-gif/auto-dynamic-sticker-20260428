# PROVIDER_ABSTRACTION_SPEC.md

建立 StyleAnalysisProvider、BriefGenerationProvider、KeyframeGenerationProvider、BackgroundRemovalProvider、ApngRenderProvider。每個 provider 都有 mock implementation 與 external interface。無 AI key 時完整跑通 style lock/briefs/keyframes/APNG placeholder；QC/export/audit/billing 必須仍是真流程。有 AI key 時不得純文字生成新角色，所有生成必須引用 characterAssetId 或 styleLockId，provider failure 要 fallback 或明確錯誤。
