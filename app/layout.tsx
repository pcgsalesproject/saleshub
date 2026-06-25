import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Sales Hub",
  description: "Employee & IT Asset Tracking System",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IT Asset Tracker",
  },
  icons: {
    icon: ["/icon-192x192.png", "/icon-512x512.png"],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full bg-gray-50 font-[var(--font-geist)]">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
