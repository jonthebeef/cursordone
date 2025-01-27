import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/components/providers/auth-provider'
import { GeistSans } from 'geist/font/sans'

export const metadata: Metadata = {
  title: "CursorDone",
  description: "A modern task management system for developers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className={cn(
        GeistSans.className,
        "min-h-screen bg-zinc-900 text-zinc-50 antialiased"
      )}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
