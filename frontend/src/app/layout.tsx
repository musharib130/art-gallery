import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthBootstrap } from "@/components/layout/AuthBootstrap";
import { NavBar } from "@/components/layout/NavBar";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Art Gallery",
  description: "Discover galleries and artworks from artists.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AuthBootstrap />
        <NavBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
