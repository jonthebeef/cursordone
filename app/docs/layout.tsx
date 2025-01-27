import { SideNav } from "@/components/ui/side-nav"

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen pt-[52px]">
      <SideNav />
      <main className="lg:pl-64">
        <div className="max-w-[840px] mx-auto p-4">
          {children}
        </div>
      </main>
    </div>
  )
} 