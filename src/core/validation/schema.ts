import { z } from 'zod';

/**
 * Base schemas for vault-related data structures
 */

// Basic schema for McpServerSettings
export const McpServerSchema = z.object({
  url: z.string().url(),
  apiKey: z.string().optional(),
  isEnabled: z.boolean(),
});

// Schema for VaultConfig
export const VaultPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  fontSize: z.number().min(8).max(24).optional(),
}).catchall(z.unknown());

export const VaultConfigSchema = z.object({
  mcpServer: McpServerSchema.optional(),
  defaultFileExtension: z.string().optional(),
  syncIntervalMinutes: z.number().min(0).optional(),
  lastAccessed: z.string().optional(),
  preferences: VaultPreferencesSchema.optional(),
});

// Schema for Vault
export const VaultSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  path: z.string().min(1),
});

// Schema for ConfiguredVault
export const ConfiguredVaultSchema = VaultSchema.extend({
  config: VaultConfigSchema,
});

// Schema for VaultRegistry
export const VaultRegistrySchema = z.object({
  vaults: z.array(ConfiguredVaultSchema),
});

// File listing schema
export const VaultFileSchema = z.object({
  name: z.string(),
  path: z.string(),
  isDirectory: z.boolean(),
});

// Export types from the schemas
export type McpServerSettingsZ = z.infer<typeof McpServerSchema>;
export type VaultConfigZ = z.infer<typeof VaultConfigSchema>;
export type VaultZ = z.infer<typeof VaultSchema>;
export type ConfiguredVaultZ = z.infer<typeof ConfiguredVaultSchema>;
export type VaultRegistryZ = z.infer<typeof VaultRegistrySchema>;
export type VaultFileZ = z.infer<typeof VaultFileSchema>; 