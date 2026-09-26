import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible, Inter } from "next/font/google";
import "./globals.css";
import { A11Y_PREPAINT_SCRIPT } from "@/lib/a11y";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Only downloaded when the "Readable font" accessibility setting is on.
const readable = Atkinson_Hyperlegible({
  variable: "--font-readable",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});


export const metadata: Metadata = {
  title: "GradeMatrix",
  description: "Track your courses, grades, and GPA — built for York University students",
  applicationName: "GradeMatrix",
  appleWebApp: {
    capable: true,
    title: "GradeMatrix",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Content extends under notches / rounded corners; .app-shell pads it back.
  viewportFit: "cover",
  // Never block pinch-zoom — capping it at 1 would fail WCAG 1.4.4.
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F4F7" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { AccessibilityProvider } from "@/components/AccessibilityProvider";
import TermsGate from "@/components/TermsGate";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: A11Y_PREPAINT_SCRIPT }} />
      </head>
      <body
        className={`${inter.variable} ${readable.variable} antialiased bg-background text-foreground selection:bg-primary selection:text-[#FFFFFF] overflow-x-hidden min-h-dvh`}
        suppressHydrationWarning
      >
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <AccessibilityProvider>
              <ToastProvider>
                {children}
                <TermsGate />
              </ToastProvider>
            </AccessibilityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
