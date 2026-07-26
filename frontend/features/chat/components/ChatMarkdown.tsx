"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-2 list-disc pl-4 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal pl-4 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="mb-0.5 last:mb-0">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        a: ({ children, href }) => (
          <a href={href} className="text-accent-text underline underline-offset-2">
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded bg-subtle px-1 py-0.5 font-mono text-xs">{children}</code>
        ),
        table: ({ children }) => (
          <div className="scrollbar-none mb-2 overflow-x-auto last:mb-0">
            <table className="w-full border-collapse text-left text-xs">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-border-default">{children}</thead>
        ),
        tr: ({ children }) => (
          <tr className="border-b border-border-default last:border-0">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-2 py-1.5 font-medium whitespace-nowrap text-text-secondary">
            {children}
          </th>
        ),
        td: ({ children }) => <td className="px-2 py-1.5 align-top">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
