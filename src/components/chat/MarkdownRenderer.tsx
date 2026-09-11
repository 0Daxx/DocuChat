import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Components } from "react-markdown";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

export function MarkdownRenderer({ content, className = "", isUser = false }: MarkdownRendererProps) {
  if (!content) return null;

  const components: Components = {
    // Code blocks (with language)
    pre: ({ children, ...props }) => {
      // Extract language and code from the child code element
      const child = React.Children.toArray(children)[0] as React.ReactElement<any>;
      if (!child || child.type !== "code") {
        return <pre {...props}>{children}</pre>;
      }

      const codeString = String(child.props.children).replace(/\n$/, "");
      const match = /language-(\w+)/.exec(child.props.className || "");
      const language = match ? match[1] : "";

      return (
        <CodeBlock language={language} code={codeString} />
      );
    },
    // Inline code (without language)
    code: ({ children, className, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match && !className;

      if (isInline) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      // If we reach here, it's a code block child - just render the text
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    // Links - open in new tab
    a: ({ children, href, ...props }) => {
      const isExternal = href?.startsWith("http");
      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          {...props}
        >
          {children}
        </a>
      );
    },
    // Tables - wrap in scrollable container
    table: ({ children, ...props }) => (
      <div className="overflow-x-auto my-2 rounded border border-border">
        <table className="w-full" {...props}>
          {children}
        </table>
      </div>
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

interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="code-block-wrapper">
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
          background: "var(--color-code-bg)",
          borderRadius: 0,
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
            fontSize: "0.8125rem",
            lineHeight: "1.5",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
