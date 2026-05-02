import Link from "next/link";

export default async function KeyframesPage({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = await params;
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Keyframes 設定</h1>
      <p>專案 ID: {id} / 貼圖 ID: {sid}</p>
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "800px" }}>
        <p>設定各影格的姿勢與屬性</p>
        <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} style={{ padding: "1rem", border: "1px solid #ddd", borderRadius: "8px", textAlign: "center" }}>
              Frame {i}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <Link href="../">← 返回貼圖</Link>
      </div>
    </main>
  );
}
