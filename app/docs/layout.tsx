import { SideNav } from "@/components/ui/side-nav"

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen pt-[52px]">
      <SideNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 