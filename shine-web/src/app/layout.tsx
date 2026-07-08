import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shinecleann.com"),
  title: "Premium Laundry & Cleaning | Shine",
  description:
    "Premium laundry service with free home pickup, 24h delivery, and eco-friendly process. Get a quote in seconds.",
  keywords: [
    "laundry",
    "cleaning",
    "premium laundry",
    "home pickup",
    "dry cleaning",
    "home cleaning",
    "laundry delivery",
    "wash and fold",
    "house cleaning service",
  ],
  authors: [{ name: "Shine" }],
  icons: {
    icon: "/shine-logo.png",
    apple: "/shine-logo.png",
  },
  openGraph: {
    title: "Premium Laundry & Cleaning | Shine",
    description: "Free Pickup · 24h Delivery · Eco-friendly Process",
    type: "website",
    url: "https://shinecleann.com",
    siteName: "Shine",
    locale: "en_US",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#a855f7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
