import React from "react";
import { MarkdownViewer } from "@/components/shared/markdown-viewer";

interface TextPartProps {
  text: string;
  isStreaming?: boolean;
}

/**
 * Renders text content with optional streaming indicator
 */
export const TextPart: React.FC<TextPartProps> = ({
  text,
  isStreaming = false,
}) => {
  return (
    <div className="prose prose-sm prose-p:m-0 w-full max-w-none">
      <MarkdownViewer markdown={text} />
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-current opacity-75 animate-pulse" />
      )}
    </div>
  );
};
