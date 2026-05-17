import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Approval Workflow",
  description: "Kurumsal onay akış yönetim sistemi",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}