import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Flowboard — AI Architecture Workspace",
  description: "Design system architectures visually, let AI propose verifiable topological improvements, and compile graphs into implementation artifacts.",
  keywords: [
    "system architecture",
    "software architecture diagram",
    "microservices design",
    "AI architecture copilot",
    "React Flow",
    "docker-compose generator",
  ],
  authors: [{ name: "Flowboard Team" }],
  openGraph: {
    title: "Flowboard — Design systems. Think clearly.",
    description: "AI-powered visual workspace for software architecture design, bottleneck diagnostics, and artifact compilation.",
    url: "https://flowboard.vercel.app",
    siteName: "Flowboard",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flowboard — Design systems. Think clearly.",
    description: "Visual system architecture design powered by deterministic AI mutations.",
  },
};

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('flowboard:theme');
                if (saved === 'dark') {
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.classList.remove('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
