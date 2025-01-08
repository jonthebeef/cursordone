import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistMono } from 'geist/font/mono';
import "./globals.css";
import { SideNav } from "@/components/ui/side-nav";
import { cn } from "@/lib/utils";

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
        <div className="relative h-full">
          <SideNav />
          <main className="lg:pl-64 min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950">
            <div className="max-w-[840px] mx-auto p-4">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
