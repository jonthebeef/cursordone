import { getAllDocs } from "@/lib/docs"
import { DocsPage } from "@/components/ui/docs-page"

export default async function Page() {
  const docs = await getAllDocs()
  return <DocsPage initialDocs={docs} />
} 