# Core Validation and Caching System

This directory contains a robust validation and caching system for handling JSON data in the application, built with Zod for schema validation.

## Overview

The system consists of several key components:

1. **Zod Schemas** - Define the shape and validation rules for your data structures
2. **Cache Manager** - Provides a TanStack Query-like caching system
3. **JSON File Utilities** - Helper functions for reading and writing validated JSON data

## Zod Schemas

Located in `validation/schema.ts`, these schemas define the data structures used throughout the application. Each schema is used to validate data at runtime, ensuring type safety and data integrity.

```typescript
import { z } from 'zod';

// Example schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
});

// Get type from schema
export type User = z.infer<typeof UserSchema>;
```

## Cache Manager

Located in `cache/cache-manager.ts`, this provides a powerful caching system similar to TanStack Query.

Key features:
- Key-based caching with stale time management
- Automatic validation of data via Zod schemas
- Subscription system for reactive updates
- Automatic garbage collection

Example usage:

```typescript
import { cacheManager } from '@/core/cache/cache-manager';
import { UserSchema } from '@/core/validation/schema';

// Register a query
cacheManager.registerQuery(
  'users',
  fetchUsers, // Async function that returns data
  z.array(UserSchema) // Schema for validation
);

// Execute the query (returns from cache if available)
const users = await cacheManager.query('users');

// Force refetch
const freshUsers = await cacheManager.refetchQuery('users');

// Subscribe to changes
const unsubscribe = cacheManager.subscribe('users', () => {
  console.log('Users data changed!');
});
```

## JSON File Utilities

Located in `utils/json-file-utils.ts`, these utilities make it easy to read and write JSON files with automatic validation.

```typescript
import { readJsonFile, writeJsonFile, updateJsonFile } from '@/core/utils/json-file-utils';
import { UserSchema } from '@/core/validation/schema';

// Read and validate JSON file
const user = await readJsonFile('user.json', UserSchema, defaultUser);

// Write validated data
await writeJsonFile('user.json', userData, UserSchema);

// Update data
await updateJsonFile('user.json', 
  (currentData) => ({ ...currentData, lastLogin: new Date() }),
  UserSchema,
  defaultUser
);
```

## Integration Example

The Vault feature demonstrates how to use this system:

1. Define Zod schemas for vault data structures
2. Create utility functions for file operations with validation
3. Create a service layer that uses cache manager
4. Update API interfaces to use the validated types

## Best Practices

1. Always define schemas before using them in the application
2. Use `z.infer<typeof MySchema>` instead of manual type definitions
3. Register queries before executing them
4. Use cache invalidation when data changes
5. Subscribe to cache changes for reactive UIs
6. Provide meaningful error messages in validation schemas 