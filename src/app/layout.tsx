import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WellnessProvider } from "@/components/layout/WellnessProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "MindCare | AI-Powered Student Mental Wellness Tracker",
  description: "Monitor your emotional well-being, manage exam stress, track sleep and study hours, get burnout risk detection, and connect with CalmGuide - your empathetic AI wellness coach.",
  keywords: ["mental wellness", "student stress tracker", "exam prep support", "burnout risk prediction", "JEE stress helper", "NEET mental wellness", "UPSC stress tracker"],
  authors: [{ name: "MindCare" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans transition-colors duration-500">
        <WellnessProvider>
          <Header />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
            {children}
          </main>
          <Footer />
        </WellnessProvider>
      </body>
    </html>
  );
}

