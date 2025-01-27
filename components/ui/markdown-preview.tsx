"use client";

import ReactMarkdown from "react-markdown";

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        components={{
          a: (props) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            />
          ),
          img: (props) => (
            <img {...props} className="rounded-lg max-h-96 object-contain" />
          ),
          pre: (props) => (
            <pre
              {...props}
              className="bg-zinc-900 p-4 rounded-lg overflow-x-auto"
            />
          ),
          code: ({ inline = false, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                {...props}
                className="bg-zinc-900 px-1.5 py-0.5 rounded text-sm"
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
