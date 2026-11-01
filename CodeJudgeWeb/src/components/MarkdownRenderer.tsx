import React from "react";
import { marked } from "marked";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  const html = React.useMemo(() => {
    try {
      return marked.parse(content || "", { breaks: true, gfm: true }) as string;
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div
      className={`markdown-body p-3 bg-light rounded border ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
