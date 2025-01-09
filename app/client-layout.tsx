"use client"

import { SideNav } from "@/components/ui/side-nav"
import { Toaster } from "@/components/ui/toaster"
import { ToastProvider } from "@/components/ui/toast"

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <div className="relative h-full">
        <SideNav />
        <main className="lg:pl-64 min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950">
          <div className="max-w-[840px] mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </ToastProvider>
  )
} 