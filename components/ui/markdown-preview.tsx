'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300" />
          ),
          img: (props) => (
            <img {...props} className="rounded-lg max-h-96 object-contain" />
          ),
          pre: (props) => (
            <pre {...props} className="bg-zinc-900 p-4 rounded-lg overflow-x-auto" />
          ),
          code: (props) => {
            const { children, className, node, ...rest } = props
            const match = /language-(\w+)/.exec(className || '')
            return match ? (
              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto">
                <code className={className} {...rest}>
                  {children}
                </code>
              </pre>
            ) : (
              <code {...rest} className="bg-zinc-900 px-1.5 py-0.5 rounded text-sm">
                {children}
              </code>
            )
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
} 