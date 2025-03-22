"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Checkbox } from "./checkbox";
import type { Components } from "react-markdown";

interface MarkdownPreviewProps {
  content: string;
  isEditable?: boolean;
  onCheckboxChange?: (index: number, checked: boolean) => void;
}

export function MarkdownPreview({
  content,
  isEditable = false,
  onCheckboxChange,
}: MarkdownPreviewProps) {
  let checkboxIndex = 0;

  const components: Components = {
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
    code: ({ inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      return !inline ? (
        <pre className="bg-zinc-900 p-4 rounded-lg overflow-x-auto">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code {...props} className="bg-zinc-900 px-1.5 py-0.5 rounded text-sm">
          {children}
        </code>
      );
    },
    table: (props) => (
      <div className="overflow-x-auto">
        <table {...props} className="border-collapse table-auto w-full my-4" />
      </div>
    ),
    th: (props) => (
      <th {...props} className="border border-zinc-600 px-4 py-2 text-left" />
    ),
    td: (props) => (
      <td {...props} className="border border-zinc-600 px-4 py-2" />
    ),
    ol: ({ className, ordered, children, ...props }) => (
      <ol
        className={`list-decimal pl-4 space-y-1 ${className || ""}`}
        {...props}
      >
        {children}
      </ol>
    ),
    ul: ({ className, children }) => (
      <ul className={`list-disc pl-4 space-y-1 ${className || ""}`}>
        {children}
      </ul>
    ),
    li: ({
      checked,
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"li"> & {
      checked?: boolean | null;
    }) => {
      if (checked !== null && checked !== undefined) {
        const currentIndex = checkboxIndex++;
        return (
          <li
            {...props}
            className="flex items-start gap-3 -ml-2 my-1 marker:content-none"
          >
            <Checkbox
              checked={checked}
              disabled={!isEditable}
              onCheckedChange={
                isEditable && onCheckboxChange
                  ? (checked) =>
                      onCheckboxChange(currentIndex, checked as boolean)
                  : undefined
              }
              className="mt-1 border-zinc-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <span className="leading-normal">{children}</span>
          </li>
        );
      }
      return <li {...props}>{children}</li>;
    },
  };

  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
