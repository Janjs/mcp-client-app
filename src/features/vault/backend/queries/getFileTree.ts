import {
  queryOptions,
  QueryOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import { readFileTree, generateFileTree } from "../services/file-tree";
import { appQueryClient } from "@core/queries/client";
import { FileTreeRoot } from "@features/vault/preload/vault-api";

export const getFileTreeQueryKey = (vaultPath: string) => [
  "fileTree",
  vaultPath,
];

const FILE_TREE_STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const getFileTreeQueryOptions = (
  vaultPath: string,
  ops?: QueryOptions,
) =>
  queryOptions({
    queryKey: getFileTreeQueryKey(vaultPath),
    staleTime: FILE_TREE_STALE_TIME,
    queryFn: async () => {
      try {
        const fileTree = await readFileTree(vaultPath);
        if (!fileTree?.generatedAt) {
          return await generateFileTree(vaultPath);
        }
        return fileTree;
      } catch (e) {
        if (e instanceof Error && e.message.includes("ENOENT")) {
          await generateFileTree(vaultPath);
          return await readFileTree(vaultPath);
        }
        console.error("Failed to read file tree:", e);
        return null;
      }
    },
    ...ops,
  }) as UseQueryOptions<FileTreeRoot | null, Error>;

export const invalidateFileTreeQuery = (vaultPath: string) => {
  appQueryClient.invalidateQueries({
    queryKey: getFileTreeQueryKey(vaultPath),
  });
};

export const getFileTreeQuery = async (
  vaultPath: string,
  queryOptions?: QueryOptions,
) => {
  return await appQueryClient.fetchQuery(
    getFileTreeQueryOptions(vaultPath, queryOptions),
  );
};

// File Tree Generation - This is more of a mutation but returns data
export const generateFileTreeQuery = async (vaultPath: string) => {
  try {
    await generateFileTree(vaultPath);
    // Invalidate the file tree query to ensure we get fresh data
    invalidateFileTreeQuery(vaultPath);
    return await getFileTreeQuery(vaultPath);
  } catch (error) {
    console.error("Failed to generate file tree:", error);
    return null;
  }
};
