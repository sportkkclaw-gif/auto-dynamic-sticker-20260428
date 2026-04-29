# PRISMA_SCHEMA_REQUIREMENTS.md

必須建立完整 prisma/schema.prisma，不得只用 TypeScript interface。必備 enum、foreign keys、relation fields、createdAt/updatedAt、indexes、unique constraints、teamId/projectId scope、deletedAt 或明確刪除策略。核心關係：Team->Membership->User、Team->Project、Project->CharacterAsset/StyleLock/StickerBrief/StickerItem、StickerItem->GeneratedFrame/ApngOutput、Project->QcReport->QcFinding、Project->ExportPackage、Team->CreditTransaction、Team/User->AuditLog。
