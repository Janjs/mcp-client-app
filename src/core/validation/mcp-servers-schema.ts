import { z } from 'zod';

/**
 * MCP Server schemas for validation
 */

// MCP Server Command Config
export const McpServerCommandConfigSchema = z.object({
  command: z.string().min(1),
  config: z.record(z.unknown()).optional(),
});

// MCP Server SSE Config
export const McpServerSSEConfigSchema = z.object({
  url: z.string().url(),
});

// MCP Server with discriminated union based on type
export const McpServerSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    type: z.literal('command'),
    config: McpServerCommandConfigSchema,
  }),
  z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    type: z.literal('sse'),
    config: McpServerSSEConfigSchema,
  }),
]);

// MCP Server Registry
export const McpServerRegistrySchema = z.object({
  servers: z.record(z.string(), McpServerSchema),
});

// Export types from the schemas
export type McpServerCommandConfigZ = z.infer<typeof McpServerCommandConfigSchema>;
export type McpServerSSEConfigZ = z.infer<typeof McpServerSSEConfigSchema>;
export type McpServerZ = z.infer<typeof McpServerSchema>;
export type McpServerRegistryZ = z.infer<typeof McpServerRegistrySchema>;