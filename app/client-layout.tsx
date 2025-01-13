"use client"

import { usePathname } from 'next/navigation'
import { SideNav } from "@/components/ui/side-nav"
import { Toaster } from "@/components/ui/toaster"
import { ToastProvider } from "@/components/ui/toast"

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')

  return (
    <ToastProvider>
      <div className="relative h-full">
        {!isAuthPage && <SideNav />}
        <main className={!isAuthPage ? "lg:pl-64" : ""}>
          <div className={!isAuthPage ? "max-w-[840px] mx-auto p-4" : ""}>
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </ToastProvider>
  )
} 