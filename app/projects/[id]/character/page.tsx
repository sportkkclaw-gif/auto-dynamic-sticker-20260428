import Link from "next/link";

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main style={{ padding: "2rem" }}>
      <h1>角色設定</h1>
      <p>專案 ID: {id}</p>
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "600px" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>角色名稱</label>
        <input type="text" placeholder="輸入角色名稱" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem" }} />
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>角色描述</label>
        <textarea placeholder="輸入角色描述" style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "1rem", minHeight: "100px" }} />
        <button style={{ padding: "0.75rem 2rem", background: "#00B900", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
          儲存角色
        </button>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <Link href="../">← 返回專案</Link>
      </div>
    </main>
  );
}
