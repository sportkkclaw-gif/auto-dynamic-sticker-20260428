import Link from "next/link";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main style={{ padding: "2rem" }}>
      <h1>專案詳情</h1>
      <p>專案 ID: {id}</p>
      <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Link href="/projects">← 返回專案列表</Link>
        <Link href="character">角色設定</Link>
        <Link href="briefs">簡報設定</Link>
        <Link href="stickers">貼圖列表</Link>
        <Link href="qc">QC 檢驗</Link>
        <Link href="preview">預覽</Link>
        <Link href="export">匯出</Link>
      </div>
    </main>
  );
}
