import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { SettingsProvider } from "@/components/providers/settings-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CursorDone",
  description: "A modern task management system with AI integration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark">
      <body
        className={cn(
          inter.className,
          "min-h-screen bg-zinc-900 text-zinc-50 antialiased",
        )}
      >
        <AuthProvider>
          <SettingsProvider>
            {children}
            <Toaster />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
