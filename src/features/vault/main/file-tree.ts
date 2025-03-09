import * as fs from "fs/promises";
import * as path from "path";
import * as yaml from "yaml";

// File tree node structure
interface FileNode {
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
}

// Root structure for the YAML file
interface FileTreeRoot {
  tree: FileNode;
  generatedAt: string;
}

/**
 * Scans a directory and builds a file tree structure
 */
async function scanDirectory(dirPath: string): Promise<FileNode> {
  const baseName = path.basename(dirPath);

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const children: FileNode[] = [];

    for (const entry of entries) {
      // Skip hidden files and the .vault directory itself
      if (entry.name.startsWith(".")) {
        continue;
      }

      const entryPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        children.push(await scanDirectory(entryPath));
      } else if (entry.isFile()) {
        children.push({
          name: entry.name,
          type: "file",
        });
      }
    }

    return {
      name: baseName,
      type: "directory",
      children,
    };
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
    return {
      name: baseName,
      type: "directory",
      children: [],
    };
  }
}

/**
 * Generates the file tree for a vault and saves it to .vault/filetree.yaml
 */
export async function generateFileTree(vaultPath: string): Promise<void> {
  try {
    // Create the .vault directory if it doesn't exist
    const vaultDir = path.join(vaultPath, ".vault");
    await fs.mkdir(vaultDir, { recursive: true });

    // Scan the directory to create the tree structure
    const rootNode = await scanDirectory(vaultPath);

    // Create the YAML content
    const fileTreeContent: FileTreeRoot = {
      generatedAt: new Date().toISOString(),
      tree: rootNode,
    };
    const yamlContent = yaml.stringify(fileTreeContent);

    // Write to the YAML file
    const filePath = path.join(vaultDir, "filetree.yaml");
    await fs.writeFile(filePath, yamlContent, "utf8");

    console.log(`File tree successfully generated at ${filePath}`);
  } catch (error) {
    console.error("Failed to generate file tree:", error);
    throw error;
  }
}

/**
 * Reads the file tree from .vault/filetree.yaml
 */
export async function readFileTree(
  vaultPath: string,
): Promise<FileTreeRoot | null> {
  try {
    const filePath = path.join(vaultPath, ".vault", "filetree.yaml");
    const content = await fs.readFile(filePath, "utf8");
    return yaml.parse(content) as FileTreeRoot;
  } catch (error) {
    console.error("Failed to read file tree:", error);
    throw error;
  }
}
