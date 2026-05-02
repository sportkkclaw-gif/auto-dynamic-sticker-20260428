export default function AdminRiskRulesPage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>風險規則管理</h1>
      <p>系統管理 - 風險規則設定</p>
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "600px" }}>
        <p>設定系統風險檢查規則</p>
        <ul style={{ marginTop: "1rem", lineHeight: "1.8" }}>
          <li>臉部辨識規則</li>
          <li>敏感內容過濾</li>
          <li>版權檢查規則</li>
        </ul>
        <button style={{ padding: "0.75rem 2rem", background: "#00B900", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "1rem" }}>
          新增規則
        </button>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <a href="/admin">← 返回 Admin</a>
      </div>
    </main>
  );
}
