export default function SettingsPage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>設定</h1>
      <p>系統個人化設定</p>
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "600px" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>LINE 官方帳號 ID</label>
        <input type="text" placeholder="輸入 LINE 官方帳號 ID" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem" }} />
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>LINE Channel Secret</label>
        <input type="password" placeholder="輸入 Channel Secret" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem" }} />
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>LINE Channel Access Token</label>
        <input type="password" placeholder="輸入 Access Token" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem" }} />
        <button style={{ padding: "0.75rem 2rem", background: "#00B900", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          儲存設定
        </button>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <a href="/">← 返回首頁</a>
      </div>
    </main>
  );
}
