import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "my21staff | The CRM that grows with you",
  description: "Scale your business with an adaptive digital workforce. AI-powered WhatsApp automation and database management in one system.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "my21staff | The CRM that grows with you",
    description: "Scale your business with an adaptive digital workforce. AI-powered WhatsApp automation and database management in one system.",
    siteName: "my21staff",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "my21staff | The CRM that grows with you",
    description: "Scale your business with an adaptive digital workforce. AI-powered WhatsApp automation and database management in one system.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.variable} ${inter.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
