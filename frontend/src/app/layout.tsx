// layout.tsx — TruthDNA Root Layout
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TruthDNA — Media Forensic Diagnostic",
  description:
    "Forensic media analysis protocol delivering 3-pillar diagnostics: Evidence, Confidence Calibration, and Explicit Uncertainties.",
  keywords: [
    "media forensics",
    "digital provenance",
    "error level analysis",
    "forensic verification",
    "truthdna",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-zinc-800 selection:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
