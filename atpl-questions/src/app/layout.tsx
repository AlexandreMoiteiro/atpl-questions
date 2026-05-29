import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: {
    default: "ATPL QBank",
    template: "%s | ATPL QBank",
  },
  description: "Personal ATPL question bank for aviation study.",
  applicationName: "ATPL QBank",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f8b400",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-100 text-slate-950 antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
