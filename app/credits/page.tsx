export default function CreditsPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Credits</h1>
      <p>LINE 動態貼圖自動化產生系統</p>
      <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>技術支援</h2>
        <p>本系統使用以下技術：</p>
        <ul style={{ marginTop: "1rem", lineHeight: "1.8" }}>
          <li>Next.js 15</li>
          <li>React 19</li>
          <li>Prisma</li>
          <li>LINE Messaging API</li>
        </ul>
      </div>
      <div style={{ marginTop: "2rem" }}>
        <a href="/">← 返回首頁</a>
      </div>
    </main>
  );
}
