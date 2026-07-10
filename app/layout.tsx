import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aieconomyledger.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI Economy Ledger",
    template: "%s | AI Economy Ledger"
  },
  description: "Open-source accounting for the AI economy.",
  applicationName: "AI Economy Ledger",
  alternates: { canonical: "/" },
  openGraph: {
    title: "AI Economy Ledger",
    description: "A source-linked model for AI capital, revenue, debt, compute commitments, and circularity.",
    siteName: "AI Economy Ledger",
    type: "website",
    url: "/"
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
