import Link from "next/link";

export default function NewProjectPage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>建立新專案</h1>
      <p>建立新的 LINE 動態貼圖專案</p>
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "600px" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>專案名稱</label>
        <input type="text" placeholder="輸入專案名稱" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem" }} />
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>LINE 官方帳號</label>
        <input type="text" placeholder="輸入 LINE 官方帳號 ID" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem" }} />
        <button style={{ padding: "0.75rem 2rem", background: "#00B900", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          建立專案
        </button>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <Link href="/projects">← 返回專案列表</Link>
      </div>
    </main>
  );
}
