import React, { useState } from "react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";

interface ToolResultPartProps {
  result: unknown;
}

/**
 * Renders tool result content with collapsible functionality
 */
export const ToolResultPart: React.FC<ToolResultPartProps> = ({ result }) => {
  const [isOpen, setIsOpen] = useState(false);
  const resultText = JSON.stringify(result, null, 2);
  
  // Truncate the result for preview if it's too long
  const getPreviewText = () => {
    if (typeof resultText !== 'string') return 'Result preview unavailable';
    
    const lines = resultText.split('\n');
    const firstLine = lines[0].length > 60 ? lines[0].substring(0, 60) + '...' : lines[0];
    
    if (lines.length <= 1) return firstLine;
    return `${firstLine}${lines.length > 2 ? '...' : '\n' + lines[1]}`;
  };

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className="mt-2"
    >
      <div className="bg-gray-200 dark:bg-gray-700 rounded">
        <CollapsibleTrigger className="w-full p-2 text-xs font-mono flex justify-between items-center text-left">
          <span className="whitespace-nowrap overflow-hidden text-ellipsis">
            {getPreviewText()}
          </span>
          <span className="ml-2 flex-shrink-0">
            {isOpen ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 15l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre className="text-xs overflow-auto p-2 max-w-full whitespace-pre-wrap border-t border-gray-300 dark:border-gray-600">
            {resultText}
          </pre>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}; 