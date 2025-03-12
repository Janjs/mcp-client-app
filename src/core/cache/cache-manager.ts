import { z } from 'zod';

/**
 * A generic cache manager inspired by TanStack Query
 * It provides a key-based caching system with data validation using Zod schemas
 */

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  validUntil: number;
  queryKey: string;
}

type QueryFunction<T> = () => Promise<T>;
type MutationFunction<T, P = unknown> = (params: P) => Promise<T>;

// Cache configuration options
interface CacheOptions {
  /** Time in milliseconds before the data is considered stale */
  staleTime?: number;
  /** Time in milliseconds before the data is automatically removed from cache */
  gcTime?: number;
  /** Whether to automatically refetch when data is stale */
  refetchOnStale?: boolean;
}

const DEFAULT_OPTIONS: CacheOptions = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 15 * 60 * 1000, // 15 minutes
  refetchOnStale: false,
};

class CacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private queryFunctions = new Map<string, QueryFunction<unknown>>();
  private mutationFunctions = new Map<string, MutationFunction<unknown, unknown>>();
  private subscribers = new Map<string, Set<() => void>>();
  private defaultOptions: CacheOptions;
  
  constructor(options: Partial<CacheOptions> = {}) {
    this.defaultOptions = { ...DEFAULT_OPTIONS, ...options };
    
    // Setup garbage collection
    setInterval(() => this.runGarbageCollection(), 60 * 1000); // Run GC every minute
  }
  
  /**
   * Register a query function with a schema validator
   */
  registerQuery<T>(
    queryKey: string,
    queryFn: QueryFunction<T>, 
    schema: z.ZodType<T>
  ): void {
    // Wrap the query function with validation
    const wrappedQueryFn = async () => {
      const result = await queryFn();
      return schema.parse(result);
    };
    
    this.queryFunctions.set(queryKey, wrappedQueryFn as QueryFunction<unknown>);
  }
  
  /**
   * Register a mutation function with a schema validator
   */
  registerMutation<T, P>(
    mutationKey: string,
    mutationFn: MutationFunction<T, P>,
    schema: z.ZodType<T>,
  ): void {
    // Wrap the mutation function with validation
    const wrappedMutationFn = async (params: P) => {
      const result = await mutationFn(params);
      return schema.parse(result);
    };
    
    this.mutationFunctions.set(mutationKey, wrappedMutationFn as MutationFunction<unknown, unknown>);
  }
  
  /**
   * Execute a query and cache the result
   */
  async query<T>(queryKey: string, options: Partial<CacheOptions> = {}): Promise<T> {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const cachedData = this.cache.get(queryKey);
    const now = Date.now();
    
    // Check if we have valid cached data
    if (cachedData && cachedData.validUntil > now) {
      return cachedData.data as T;
    }
    
    // If we have stale data and don't need to refetch, return it
    if (cachedData && !mergedOptions.refetchOnStale) {
      // Schedule refetch in background if auto-refetch is enabled
      if (mergedOptions.refetchOnStale) {
        this.refetchQuery(queryKey).catch(console.error);
      }
      return cachedData.data as T;
    }
    
    // Execute query function
    return this.refetchQuery<T>(queryKey, mergedOptions);
  }
  
  /**
   * Force refetch a query
   */
  async refetchQuery<T>(queryKey: string, options: Partial<CacheOptions> = {}): Promise<T> {
    const queryFn = this.queryFunctions.get(queryKey);
    if (!queryFn) {
      throw new Error(`Query function not registered for key: ${queryKey}`);
    }
    
    const mergedOptions = { ...this.defaultOptions, ...options };
    const now = Date.now();
    
    try {
      const data = await queryFn();
      
      // Update cache
      this.cache.set(queryKey, {
        data,
        timestamp: now,
        validUntil: now + (mergedOptions.staleTime || 0),
        queryKey,
      });
      
      // Notify subscribers
      this.notifySubscribers(queryKey);
      
      return data as T;
    } catch (error) {
      console.error(`Error executing query ${queryKey}:`, error);
      throw error;
    }
  }
  
  /**
   * Execute a mutation
   */
  async mutate<T, P>(mutationKey: string, params: P): Promise<T> {
    const mutationFn = this.mutationFunctions.get(mutationKey);
    if (!mutationFn) {
      throw new Error(`Mutation function not registered for key: ${mutationKey}`);
    }
    
    try {
      return await mutationFn(params) as T;
    } catch (error) {
      console.error(`Error executing mutation ${mutationKey}:`, error);
      throw error;
    }
  }
  
  /**
   * Invalidate queries that match a certain prefix
   */
  invalidateQueries(queryKeyPrefix: string): void {
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(queryKeyPrefix)) {
        this.cache.delete(key);
        this.notifySubscribers(key);
      }
    }
  }
  
  /**
   * Subscribe to cache changes
   */
  subscribe(queryKey: string, callback: () => void): () => void {
    if (!this.subscribers.has(queryKey)) {
      this.subscribers.set(queryKey, new Set());
    }
    
    const subscribers = this.subscribers.get(queryKey)!;
    subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.subscribers.delete(queryKey);
      }
    };
  }
  
  /**
   * Notify subscribers of cache changes
   */
  private notifySubscribers(queryKey: string): void {
    const subscribers = this.subscribers.get(queryKey);
    if (subscribers) {
      for (const callback of subscribers) {
        try {
          callback();
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      }
    }
  }
  
  /**
   * Run garbage collection to remove expired cache entries
   */
  private runGarbageCollection(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const gcTime = this.defaultOptions.gcTime || DEFAULT_OPTIONS.gcTime;
      if (entry.timestamp + gcTime! < now) {
        this.cache.delete(key);
      }
    }
  }
}

// Create and export a global cache instance
export const cacheManager = new CacheManager();

// Export a function to create a new cache manager with custom options
export const createCacheManager = (options: Partial<CacheOptions> = {}) => {
  return new CacheManager(options);
}; 