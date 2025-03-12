import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ConfiguredProvider } from "../../types/models";

const MODELS_QUERY_KEY = ["models-providers"];

/**
 * Custom hook for managing AI model providers and models
 */
export function useModels() {
  const queryClient = useQueryClient();

  // Fetch all providers
  const {
    data: providers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: MODELS_QUERY_KEY,
    queryFn: async () => {
      return await window.api.models.getProviders();
    },
  });

  // Add a new provider
  const addProviderMutation = useMutation({
    mutationFn: async (provider: ConfiguredProvider) => {
      return await window.api.models.addProvider(provider);
    },
    onSuccess: () => {
      // Invalidate and refetch the providers query
      queryClient.invalidateQueries({ queryKey: MODELS_QUERY_KEY });
    },
  });

  // Update an existing provider
  const updateProviderMutation = useMutation({
    mutationFn: async ({
      providerName,
      provider,
    }: {
      providerName: string;
      provider: ConfiguredProvider;
    }) => {
      return await window.api.models.updateProvider(providerName, provider);
    },
    onSuccess: () => {
      // Invalidate and refetch the providers query
      queryClient.invalidateQueries({ queryKey: MODELS_QUERY_KEY });
    },
  });

  // Remove an existing provider
  const removeProviderMutation = useMutation({
    mutationFn: async (provider: ConfiguredProvider) => {
      return await window.api.models.removeProvider(provider);
    },
    onSuccess: () => {
      // Invalidate and refetch the providers query
      queryClient.invalidateQueries({ queryKey: MODELS_QUERY_KEY });
    },
  });

  return {
    providers,
    isLoading,
    error,
    refetch,
    addProvider: addProviderMutation,
    updateProvider: updateProviderMutation,
    isAddingProvider: addProviderMutation.isPending,
    isUpdatingProvider: updateProviderMutation.isPending,
    removeProvider: removeProviderMutation,
    isRemovingProvider: removeProviderMutation.isPending,
  };
}
