import Link from "next/link";

export default async function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main style={{ padding: "2rem" }}>
      <h1>匯出</h1>
      <p>專案 ID: {id}</p>
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "600px" }}>
        <p>匯出 LINE 官方要求的 zip 檔案</p>
        <button style={{ padding: "0.75rem 2rem", background: "#00B900", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "1rem" }}>
          匯出 ZIP
        </button>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <Link href="../">← 返回專案</Link>
      </div>
    </main>
  );
}
