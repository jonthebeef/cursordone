import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { SideNav } from "@/components/ui/side-nav";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster"
import { ClientLayout } from "./client-layout"
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
        "font-inter h-full bg-zinc-900 text-zinc-50"
      )}>
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
