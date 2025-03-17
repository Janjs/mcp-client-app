import { useState, useEffect, useCallback } from "react";
import {
  FolderIcon,
  FileIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "lucide-react";
import { useVaults } from "../hooks/useVaults";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

// Types for the file tree
interface FileNode {
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
}

// This interface is needed for the fileTree response structure
interface FileTreeRoot {
  tree: FileNode;
}

interface FileNodeProps {
  node: FileNode;
  level: number;
  onNodeSelect: (node: FileNode) => void;
  selectedPath: string[];
}

const FileNode: React.FC<FileNodeProps> = ({
  node,
  level,
  onNodeSelect,
  selectedPath,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const isSelected = selectedPath.includes(node.name);
  const isDirectory = node.type === "directory";

  // Determine if this node is in the current selected path
  const isInSelectedPath =
    selectedPath.length > 0 &&
    level < selectedPath.length &&
    selectedPath[level] === node.name;

  // Auto-expand if this node is in the current selected path
  useEffect(() => {
    if (isInSelectedPath && isDirectory && !expanded) {
      setExpanded(true);
    }
  }, [isInSelectedPath, isDirectory, expanded]);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDirectory) {
        setExpanded(!expanded);
      }
    },
    [isDirectory, expanded],
  );

  const handleClick = useCallback(() => {
    onNodeSelect(node);
  }, [node, onNodeSelect]);

  const handleMouseEnter = useCallback(() => {
    setHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovering(false);
  }, []);

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 px-2 rounded cursor-pointer",
          isSelected
            ? "bg-primary/10 text-primary"
            : hovering
              ? "bg-muted"
              : "",
          `pl-${level * 4 + 2}`,
        )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="mr-1" onClick={handleToggle}>
          {isDirectory &&
            (expanded ? (
              <ChevronDownIcon size={16} />
            ) : (
              <ChevronRightIcon size={16} />
            ))}
        </div>
        <div className="mr-2">
          {isDirectory ? <FolderIcon size={16} /> : <FileIcon size={16} />}
        </div>
        <span className="text-sm truncate">{node.name}</span>
      </div>

      {isDirectory && expanded && node.children && (
        <div className="ml-2">
          {node.children.map((childNode) => (
            <FileNode
              key={childNode.name}
              node={childNode}
              level={level + 1}
              onNodeSelect={onNodeSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC = () => {
  const { activeVault } = useVaults();
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  const fileTreeQuery = useQuery({
    queryKey: ["fileTree", activeVault?.path],
    queryFn: () => {
      if (!activeVault?.path) {
        throw new Error("No active vault path");
      }
      return window.api.vault.readFileTree(activeVault.path);
    },
    enabled: !!activeVault?.path,
  });

  // Explicitly type the result to use the FileTreeRoot interface
  const { data: fileTree, isLoading: isLoadingFileTree } = fileTreeQuery as { 
    data: FileTreeRoot | null | undefined,
    isLoading: boolean 
  };

  const handleNodeSelect = useCallback((node: FileNode) => {
    // Build the full path
    const buildPath = (
      node: FileNode,
      currentPath: string[] = [],
    ): string[] => {
      currentPath.push(node.name);
      return currentPath;
    };

    setSelectedPath(buildPath(node));

    // Handle file/directory selection (e.g., open file, expand directory)
    if (node.type === "file") {
      console.log(`File selected: ${node.name}`);
      // TODO: Implement file opening logic
    }
  }, []);

  if (isLoadingFileTree) {
    return <div className="p-4">Loading file tree...</div>;
  }

  if (!fileTree || !fileTree.tree) {
    return <div className="p-4">No file tree available</div>;
  }

  return (
    <div className="h-full overflow-auto">
      <FileNode
        node={fileTree.tree}
        level={0}
        onNodeSelect={handleNodeSelect}
        selectedPath={selectedPath}
      />
    </div>
  );
};
