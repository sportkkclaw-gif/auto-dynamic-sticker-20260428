import Link from "next/link";

export default async function StickerDetailPage({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id, sid } = await params;
  return (
    <main style={{ padding: "2rem" }}>
      <h1>貼圖詳情</h1>
      <p>專案 ID: {id} / 貼圖 ID: {sid}</p>
      <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Link href="keyframes">keyframes 設定</Link>
        <Link href="animate">🎬 動畫產生</Link>
        <Link href="../">← 返回貼圖列表</Link>
      </div>
    </main>
  );
}
