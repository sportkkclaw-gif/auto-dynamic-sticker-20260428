import Link from "next/link";

export default async function StickersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main style={{ padding: "2rem" }}>
      <h1>貼圖列表</h1>
      <p>專案 ID: {id}</p>
      <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Link href="stickers/new">新增貼圖 +</Link>
        <Link href="../">← 返回專案</Link>
      </div>
    </main>
  );
}
