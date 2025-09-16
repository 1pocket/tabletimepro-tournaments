import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TableTimePro — Tournaments",
  description: "Run and display pool tourneys with greens fees, payouts, and calcutta.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100`}>
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  );
}
