// layout.tsx — TruthDNA Root Layout
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TruthDNA — Forensic Media Analysis",
  description:
    "AI-powered forensic media analysis. Never returns binary verdicts — delivers Evidence, Confidence & Uncertainty diagnostics.",
  keywords: ["media forensics", "deepfake detection", "image analysis", "forensic AI"],
  openGraph: {
    title: "TruthDNA — Forensic Media Analysis",
    description: "3-pillar forensic diagnostic: Evidence · Confidence · Uncertainty",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
