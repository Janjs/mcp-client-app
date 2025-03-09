import { FileNode } from "@features/vault/preload/vault-api";
import { FolderOpen, File, ChevronDown, ChevronRight } from "lucide-react";
import { 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarMenuSub 
} from "@/components/ui/sidebar";
import { useState, useEffect, useRef } from "react";

interface FileTreeProps {
  tree: FileNode;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
}

export function FileTree({ tree, expandedFolders, onToggleFolder }: FileTreeProps) {
  if (!tree) return null;
  return (
    <FileTreeNode 
      node={tree} 
      path="" 
      expandedFolders={expandedFolders} 
      onToggleFolder={onToggleFolder} 
    />
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  path: string;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
}

export function FileTreeNode({ node, path, expandedFolders, onToggleFolder }: FileTreeNodeProps) {
  const currentPath = path ? `${path}/${node.name}` : node.name;
  const isExpanded = expandedFolders.has(currentPath);

  if (node.type === "directory") {
    return (
      <FileTreeFolder 
        node={node} 
        path={currentPath} 
        isExpanded={isExpanded} 
        onToggle={() => onToggleFolder(currentPath)} 
        expandedFolders={expandedFolders} 
        onToggleFolder={onToggleFolder} 
      />
    );
  } else {
    return <FileTreeFile node={node} path={currentPath} />;
  }
}

interface FileTreeFolderProps {
  node: FileNode;
  path: string;
  isExpanded: boolean;
  onToggle: () => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
}

export function FileTreeFolder({ 
  node, 
  path, 
  isExpanded, 
  onToggle, 
  expandedFolders, 
  onToggleFolder 
}: FileTreeFolderProps) {
  return (
    <SidebarMenuItem key={path}>
      <SidebarMenuButton
        onClick={onToggle}
        className="gap-2"
      >
        {isExpanded ? (
          <ChevronDown className="size-3.5 flex-shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 flex-shrink-0" />
        )}
        <FolderOpen className="size-4 flex-shrink-0 text-sidebar-accent" />
        <span className="truncate">{node.name}</span>
      </SidebarMenuButton>

      {isExpanded && node.children && (
        <SidebarMenuSub>
          {node.children.map((child) => (
            <FileTreeNode 
              key={`${path}/${child.name}`}
              node={child} 
              path={path} 
              expandedFolders={expandedFolders} 
              onToggleFolder={onToggleFolder} 
            />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

interface FileTreeFileProps {
  node: FileNode;
  path: string;
}

export function FileTreeFile({ node, path }: FileTreeFileProps) {
  return (
    <SidebarMenuItem key={path}>
      <SidebarMenuButton className="gap-2">
        <div className="w-3.5" /> {/* Spacer to align with folder icons */}
        <File className="size-4 flex-shrink-0 text-sidebar-muted" />
        <span className="truncate">{node.name}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function FileTreeRoot({ 
  tree, 
  expandedFolders,
  onToggleFolder 
}: { 
  tree: FileNode;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
}) {
  if (!tree) return null;
  
  return (
    <FileTree 
      tree={tree} 
      expandedFolders={expandedFolders} 
      onToggleFolder={onToggleFolder} 
    />
  );
}