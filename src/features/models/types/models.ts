import z from "zod";

import { CoreMessage } from "ai";

/**
 * A model provider
 */
const provider = z.enum(["openai", "anthropic"]);

/**
 * An instance of a model by a provider
 */
export const providerModel = z.object({
  provider,
  model: z.string(),
  enabled: z.boolean(),
});
export type ProviderModel = z.infer<typeof providerModel>;

export const providerModelList = z.array(providerModel);
export type ProviderModelList = z.infer<typeof providerModelList>;

/**
 * A list of configured model providers
 */
export const configuredProvider = z.object({
  provider: provider,
  settings: z
    .object({
      apiKey: z.string().optional(),
      baseUrl: z.string().optional(),
    })
    .passthrough(),
});
export type ConfiguredProvider = z.infer<typeof configuredProvider>;

export const configuredProviderList = z.array(configuredProvider);
export type ConfiguredProviderList = z.infer<typeof configuredProviderList>;

export const modelRegistry = z.object({
  providers: configuredProviderList,
  models: providerModelList,
});
export type ModelRegistry = z.infer<typeof modelRegistry>;
