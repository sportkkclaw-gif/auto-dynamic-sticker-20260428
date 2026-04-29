import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LINE Animated Sticker AutoGen",
  description: "LINE 動態貼圖自動化產生系統",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}