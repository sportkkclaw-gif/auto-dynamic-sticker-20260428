import Link from "next/link";

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main style={{ padding: "2rem" }}>
      <h1>預覽</h1>
      <p>專案 ID: {id}</p>
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "600px" }}>
        <p>預覽所有動態貼圖效果</p>
        <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} style={{ padding: "2rem", border: "1px solid #ddd", borderRadius: "8px", textAlign: "center", background: "#f9f9f9" }}>
              貼圖 {i}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <Link href="../">← 返回專案</Link>
      </div>
    </main>
  );
}
