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
  ],
  authors: [{ name: "Shine" }],
  icons: {
    icon: "/shine-logo.png",
  },
  openGraph: {
    title: "Premium Laundry & Cleaning | Shine",
    description:
      "Free Pickup · 24h Delivery · Eco-friendly Process",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // NUCLEAR cache buster: kills any existing Service Worker and all caches.
  // Runs before React hydrates. The old SW was cache-first and serving stale JS.
  // After reload, no SW will be active — all requests go to network.
  const swBusterScript = `
    (function(){
      if('serviceWorker' in navigator){
        navigator.serviceWorker.getRegistrations().then(function(regs){
          if(regs && regs.length > 0){
            Promise.all(regs.map(function(r){ return r.unregister(); })).then(function(){
              if('caches' in window){
                caches.keys().then(function(ks){
                  return Promise.all(ks.map(function(k){ return caches.delete(k); }));
                }).catch(function(){});
              }
              window.location.reload();
            });
          }
        }).catch(function(){});
      }
    })();
  `.trim();

  const firebaseConfigScript = `
    window.__FIREBASE_CONFIG__ = ${JSON.stringify({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    })};
    window.__STRIPE_PK__ = "${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}";
  `.trim();

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: swBusterScript }} />
        <script dangerouslySetInnerHTML={{ __html: firebaseConfigScript }} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#a855f7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* PWA manifest disabled — Service Worker was caching stale JS.
            Re-enable after implementing a proper cache-busting strategy. */}
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