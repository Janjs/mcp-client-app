import { QueryCache, QueryClient } from "@tanstack/react-query";

export const appQueryCache = new QueryCache({});

export const appQueryClient = new QueryClient({
  queryCache: appQueryCache,
});
