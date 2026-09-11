import React, { useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";
import { Check, Copy, ExternalLink } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

export function MarkdownRenderer({ content, className = "", isUser = false }: MarkdownRendererProps) {
  if (!content) return null;

  const components: Components = {
    // Paragraphs
    p: ({ children, ...props }) => (
      <p className="mb-3 last:mb-0 leading-relaxed" {...props}>
        {children}
      </p>
    ),

    // Headings
    h1: ({ children, ...props }) => (
      <h1 className="text-xl font-bold mb-3 mt-5 first:mt-0" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="text-sm font-semibold mb-1.5 mt-3 first:mt-0" {...props}>
        {children}
      </h4>
    ),

    // Lists
    ul: ({ children, ...props }) => (
      <ul className="list-disc list-inside mb-3 space-y-1 ml-1" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal list-inside mb-3 space-y-1 ml-1" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    ),

    // Links - open in new tab with icon
    a: ({ children, href, ...props }) => {
      const isExternal = href?.startsWith("http");
      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="inline-flex items-center gap-0.5 text-blue-500 hover:text-blue-600 underline underline-offset-2 decoration-blue-500/30 hover:decoration-blue-500 transition-colors break-all"
          {...props}
        >
          {children}
          {isExternal && <ExternalLink className="w-3 h-3 inline shrink-0 opacity-60" />}
        </a>
      );
    },

    // Inline code
    code: ({ children, className, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match && !className;

      if (isInline) {
        return (
          <code
            className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[0.85em] font-mono font-medium"
            {...props}
          >
            {children}
          </code>
        );
      }

      // Block code - handled by pre, just render children
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },

    // Code blocks with syntax highlighting
    pre: ({ children, ...props }) => {
      const child = React.Children.toArray(children)[0] as React.ReactElement<any>;
      if (!child || child.type !== "code") {
        return <pre {...props}>{children}</pre>;
      }

      const codeString = extractTextFromChildren(child.props.children).replace(/\n$/, "");
      const match = /language-(\w+)/.exec(child.props.className || "");
      const language = match ? match[1] : "";

      return <CodeBlock language={language} code={codeString} />;
    },

    // Blockquotes
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 py-1 my-3 text-muted-foreground italic"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Tables
    table: ({ children, ...props }) => (
      <div className="my-3 overflow-x-auto rounded-md border border-border">
        <table className="min-w-full text-sm" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-muted/50" {...props}>
        {children}
      </thead>
    ),
    th: ({ children, ...props }) => (
      <th
        className="px-3 py-2 text-left font-semibold border-b border-border whitespace-nowrap"
        {...props}
      >
        {children}
      </th>
    ),
    td: ({ children, ...props }) => (
      <td className="px-3 py-2 border-b border-border" {...props}>
        {children}
      </td>
    ),
    tr: ({ children, ...props }) => (
      <tr className="even:bg-muted/30 hover:bg-muted/50 transition-colors" {...props}>
        {children}
      </tr>
    ),
    tbody: ({ children, ...props }) => (
      <tbody {...props}>{children}</tbody>
    ),

    // Horizontal rule
    hr: (props) => (
      <hr className="my-4 border-border" {...props} />
    ),

    // Strong & emphasis
    strong: ({ children, ...props }) => (
      <strong className="font-semibold" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),

    // Images
    img: ({ src, alt, ...props }) => (
      <img
        src={src}
        alt={alt || ""}
        className="max-w-full rounded-md my-2"
        loading="lazy"
        {...props}
      />
    ),

    // Task lists (GFM)
    input: ({ ...props }) => (
      <input
        className="mr-2 align-middle accent-primary"
        type="checkbox"
        disabled
        {...props}
      />
    ),

    // Strikethrough (GFM)
    del: ({ children, ...props }) => (
      <del className="line-through text-muted-foreground" {...props}>
        {children}
      </del>
    ),
  };

  return (
    <div className={isUser ? `user-markdown ${className}` : `markdown-content ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Code block with header and copy button
interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [code]);

  return (
    <div className="code-block-wrapper my-3 rounded-md overflow-hidden border border-zinc-700">
      <div className="code-block-header">
        <span className="language-label">{language || "text"}</span>
        <button
          onClick={handleCopy}
          className={`copy-button ${copied ? "copied" : ""}`}
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || "text"}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "var(--color-code-bg, hsl(240 6% 10%))",
          borderRadius: 0,
          fontSize: "0.8125rem",
          lineHeight: "1.6",
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            fontSize: "0.8125rem",
            lineHeight: "1.6",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// Helper to recursively extract text from React children
function extractTextFromChildren(children: unknown): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join("");
  if (React.isValidElement(children)) {
    const props = children.props as Record<string, unknown>;
    if (props.children) {
      return extractTextFromChildren(props.children);
    }
  }
  return "";
}
