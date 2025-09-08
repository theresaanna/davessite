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
import Header from "@/components/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Header />
        <main className="site-main container">{children}</main>
        <footer className="site-footer container">
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <small>
              © {new Date().getFullYear()} <a 
                href="mailto:creative.disonance@yahoo.com" 
                className="footer-email-link"
                style={{ 
                  color: "inherit", 
                  textDecoration: "none",
                  borderBottom: "1px dotted #6b7280",
                  transition: "border-bottom 0.2s ease"
                }}
              >
                Dave Todd
              </a>. All rights reserved.
            </small>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <AuthControls />
              <Link 
                href="/privacy" 
                style={{ 
                  fontSize: "0.875rem", 
                  color: "#6b7280",
                  textDecoration: "none" 
                }}
              >
                Privacy
              </Link>
              <Link 
                href="/terms" 
                style={{ 
                  fontSize: "0.875rem", 
                  color: "#6b7280",
                  textDecoration: "none" 
                }}
              >
                Terms
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
