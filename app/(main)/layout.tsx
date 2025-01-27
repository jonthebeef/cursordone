"use client"

import { SideNav } from "@/components/ui/side-nav"
import { AuthCheck } from "@/components/auth/auth-check"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthCheck>
      <div className="relative h-full">
        <SideNav />
        <main className="lg:pl-64">
          <div className="max-w-[840px] mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
    </AuthCheck>
  )
} 