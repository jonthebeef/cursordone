import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/components/providers/auth-provider'
import { GeistSans } from 'geist/font/sans'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Todo List",
  description: "A simple todo list application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className={cn(
        inter.variable,
        GeistMono.variable,
        GeistSans.variable,
        "font-inter h-full bg-zinc-900 text-zinc-50"
      )}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
