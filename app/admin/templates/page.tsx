export default function AdminTemplatesPage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>範本管理</h1>
      <p>系統管理 - 範本設定</p>
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "600px" }}>
        <p>管理 LINE 動態貼圖範本</p>
        <button style={{ padding: "0.75rem 2rem", background: "#00B900", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "1rem" }}>
          新增範本
        </button>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <a href="/admin">← 返回 Admin</a>
      </div>
    </main>
  );
}
