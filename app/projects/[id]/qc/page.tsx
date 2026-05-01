import Link from "next/link";

export default async function ProjectQCMode({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main style={{ padding: "2rem" }}>
      <h1>QC 檢驗</h1>
      <p>專案 ID: {id}</p>
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "600px" }}>
        <p>LINE 官方貼圖規格檢驗</p>
        <ul style={{ marginTop: "1rem", lineHeight: "1.8" }}>
          <li>✅ 檔案格式檢查</li>
          <li>✅ 解析度檢查</li>
          <li>✅ 檔案大小檢查</li>
          <li>✅ 動畫帧數檢查</li>
          <li>✅ 背景透明檢查</li>
        </ul>
        <button style={{ padding: "0.75rem 2rem", background: "#00B900", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "1rem" }}>
          執行 QC 檢驗
        </button>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <Link href="../">← 返回專案</Link>
      </div>
    </main>
  );
}
