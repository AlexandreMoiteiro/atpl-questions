import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Skill Test Prep",
    template: "%s | Skill Test Prep",
  },
  description:
    "Examiner-focused oral preparation for CPL, IR with PBN and SEP skill tests.",
  applicationName: "Skill Test Prep",
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
        {children}
      </body>
    </html>
  );
}
