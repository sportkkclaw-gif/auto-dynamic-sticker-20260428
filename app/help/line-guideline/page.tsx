import Link from "next/link";

export default function LineGuidelinePage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>LINE 貼圖製作指南</h1>
      <p>LINE 官方貼圖規格與規範</p>
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>靜態貼圖規格</h2>
        <ul style={{ lineHeight: "1.8" }}>
          <li>尺寸：120 × 120 px 至 1024 × 1024 px</li>
          <li>檔案格式：PNG（背景透明）</li>
          <li>檔案大小：最大 1MB</li>
        </ul>
      </div>
      <div style={{ marginTop: "1.5rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>動態貼圖規格</h2>
        <ul style={{ lineHeight: "1.8" }}>
          <li>尺寸：同靜態貼圖</li>
          <li>檔案格式：APNG（動畫 PNG）</li>
          <li>檔案大小：最大 1MB</li>
          <li>帧數：最少 16 帧，最多 96 帧</li>
          <li>幀率：8-20 fps</li>
        </ul>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <Link href="/">← 返回首頁</Link>
      </div>
    </main>
  );
}
