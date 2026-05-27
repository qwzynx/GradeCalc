import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "Futuristic Grade Calculator",
  description: "Calculate your grades in style",
};

import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased bg-background text-foreground selection:bg-primary selection:text-white overflow-x-hidden`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
