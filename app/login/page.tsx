import Link from "next/link";

export default function LoginPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>登入</h1>
      <p>LINE 動態貼圖自動化產生系統</p>
      <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <button style={{ padding: "0.75rem", background: "#00B900", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          使用 LINE 帳號登入
        </button>
        <button style={{ padding: "0.75rem", background: "#333", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          使用 Email 登入
        </button>
      </div>
      <div style={{ marginTop: "2rem", padding: "1rem", background: "#f5f5f5", borderRadius: "8px" }}>
        <p style={{ fontSize: "0.875rem", color: "#666" }}>測試模式：可直接進入系統</p>
        <Link href="/dashboard" style={{ display: "block", marginTop: "0.5rem", color: "#00B900" }}>跳過登入 →</Link>
      </div>
    </main>
  );
}
