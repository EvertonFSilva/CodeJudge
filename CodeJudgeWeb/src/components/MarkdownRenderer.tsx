import React from "react";
import { marked } from "marked";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function normalizeMarkdownCodeFences(text: string): string {
  if (!text) return "";
  let str = text;
  str = str.replace(/^(?!```)(.+?)[ \t]*(```[a-zA-Z0-9_+#-]*)$/gm, "$1\n$2");
  str = str.replace(/^(?!```)(.+?)[ \t]*(```[a-zA-Z0-9_+#-]*)[ \t]+([^\r\n]+)$/gm, "$1\n$2\n$3");
  str = str.replace(/^(?!```)(.+?)[ \t]*(```\s*)$/gm, "$1\n```");
  return str;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  const html = React.useMemo(() => {
    try {
      const normalized = normalizeMarkdownCodeFences(content || "");
      return marked.parse(normalized, { breaks: true, gfm: true }) as string;
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
