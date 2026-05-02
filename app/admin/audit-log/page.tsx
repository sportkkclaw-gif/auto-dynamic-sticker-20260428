export default function AdminAuditLogPage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>審計日誌</h1>
      <p>系統管理 - 操作日誌</p>
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "800px" }}>
        <p>系統操作日誌記錄</p>
        <table style={{ width: "100%", marginTop: "1rem", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: "0.5rem", textAlign: "left" }}>時間</th>
              <th style={{ padding: "0.5rem", textAlign: "left" }}>使用者</th>
              <th style={{ padding: "0.5rem", textAlign: "left" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "0.5rem" }}>2026-05-01 10:00</td>
              <td style={{ padding: "0.5rem" }}>admin</td>
              <td style={{ padding: "0.5rem" }}>建立專案</td>
            </tr>
            <tr>
              <td style={{ padding: "0.5rem" }}>2026-05-01 10:05</td>
              <td style={{ padding: "0.5rem" }}>admin</td>
              <td style={{ padding: "0.5rem" }}>匯出貼圖</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <a href="/admin">← 返回 Admin</a>
      </div>
    </main>
  );
}
