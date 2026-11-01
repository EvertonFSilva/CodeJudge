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
      className={`dark-markdown-body p-3 rounded ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
