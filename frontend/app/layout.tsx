import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { Navbar } from "@/components/layout/Navbar";
import { CompareProvider } from "@/features/compare/components/CompareProvider";
import { CompareTray } from "@/features/compare/components/CompareTray";
import { CompareTraySpacer } from "@/features/compare/components/CompareTraySpacer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stayzy",
  description: "Search, compare, and book hotels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-base font-sans text-text-primary antialiased">
        <CompareProvider>
          <Navbar />
          <main className="min-h-screen bg-base pt-16">{children}</main>
          <CompareTraySpacer />
          <CompareTray />
        </CompareProvider>
      </body>
    </html>
  );
}
