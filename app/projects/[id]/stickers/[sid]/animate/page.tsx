import Link from "next/link";

export default async function AnimatePage({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = await params;
  return (
    <main style={{ padding: "2rem" }}>
      <h1>動畫產生</h1>
      <p>專案 ID: {id} / 貼圖 ID: {sid}</p>
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px", maxWidth: "600px" }}>
        <p>依據 keyframes 設定自動產生動畫</p>
        <button style={{ padding: "0.75rem 2rem", background: "#00B900", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", marginTop: "1rem" }}>
          開始產生動畫
        </button>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <Link href="../">← 返回貼圖</Link>
      </div>
    </main>
  );
}
