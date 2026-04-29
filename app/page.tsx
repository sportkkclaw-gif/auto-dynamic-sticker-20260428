import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
        AUTO動態貼圖
      </h1>
      <nav style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <Link href="/dashboard">📊 Dashboard</Link>
        <Link href="/projects">📁 Projects</Link>
        <Link href="/qc">🔍 QC</Link>
        <Link href="/admin">⚙️ Admin</Link>
        <Link href="/api/health">💚 Health API</Link>
      </nav>
    </main>
  );
}