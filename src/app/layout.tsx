import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dave's Site",
  description: "Portfolio and blog for Dave",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

import AuthControls from "@/components/AuthControls";
import { getSession } from "@/lib/session";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header className="site-header">
          <div className="container" style={{ gap: "1rem" }}>
            <h1 className="site-title">
              <Link href="/">Dave’s Site</Link>
            </h1>
            <nav className="site-nav" aria-label="Primary">
              <ul>
                <li>
                  <Link href="/about">About</Link>
                </li>
                <li>
                  <Link href="/blog">Blog</Link>
                </li>
                <li>
                  <Link href="/works">Works</Link>
                </li>
              </ul>
            </nav>
            <div className="auth-controls">
              <AuthControls user={session.user ?? null} />
            </div>
          </div>
        </header>
        <main className="site-main container">{children}</main>
        <footer className="site-footer container">
          <small>© Dave</small>
        </footer>
      </body>
    </html>
  );
}
