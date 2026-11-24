import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "@/components/AuthProvider";
import AuthControls from "@/components/AuthControls";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecipeShare — good food, shared",
  description: "Discover and share recipes from kitchens around the world.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <header className="site-header">
            <div className="header-inner">
              <Link className="brand" href="/">
                <span className="brand-mark" aria-hidden="true">R</span>
                <span>recipe<span className="brand-light">share</span></span>
              </Link>
              <nav aria-label="Main navigation">
                <Link href="/">Explore</Link>
                <Link className="nav-cta" href="/add">Share a recipe <span aria-hidden="true">+</span></Link>
                <AuthControls />
              </nav>
            </div>
          </header>
          {children}
          <footer className="site-footer">
            <Link className="brand footer-brand" href="/">
              <span className="brand-mark" aria-hidden="true">R</span>
              <span>recipe<span className="brand-light">share</span></span>
            </Link>
            <p>Made for good food and the people who share it.</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
