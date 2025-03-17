import React, { useState } from "react";
import { useModels } from "../hooks/useModels";
import { ModelProviderFormDialog } from "./ModelProviderFormDialog";
import { ModelProviderCard } from "./ModelProviderCard";
import { ConfiguredProvider } from "../../types/models";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Empty State Component
 */
const EmptyState = () => (
  <Card className="text-center py-6 border-2 border-dashed">
    <CardContent>
      <p className="text-gray-500">
        No model providers configured. Click the button above to add one.
      </p>
    </CardContent>
  </Card>
);

/**
 * Loading State Component
 */
const LoadingState = () => (
  <div className="flex justify-center items-center h-full">
    <p className="text-muted-foreground">Loading model providers...</p>
  </div>
);

/**
 * Error State Component
 */
const ErrorState = ({ error }: { error: Error }) => (
  <Card className="border-red-200 bg-red-50">
    <CardContent className="p-4">
      <p className="text-red-500">
        Error loading model providers: {error.toString()}
      </p>
    </CardContent>
  </Card>
);

/**
 * Header Component
 */
const ModelListHeader = ({
  onAddClick,
  isAdding,
}: {
  onAddClick: () => void;
  isAdding: boolean;
}) => (
  <div className="flex justify-between items-center mb-6">
    <CardTitle className="text-2xl font-bold">AI Model Providers</CardTitle>
    <Button onClick={onAddClick} disabled={isAdding}>
      Add New Provider
    </Button>
  </div>
);

/**
 * Model List Component
 *
 * Displays a list of AI model providers with add and edit capabilities
 */
export const ModelList: React.FC = () => {
  const {
    providers,
    isLoading,
    error,
    addProvider,
    updateProvider,
    removeProvider,
    isAddingProvider,
    isUpdatingProvider,
    isRemovingProvider,
  } = useModels();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<ConfiguredProvider | null>(null);

  // Open the form dialog to add a new provider
  const handleAddClick = () => {
    setSelectedProvider(null);
    setFormOpen(true);
  };

  // Open the form dialog to edit an existing provider
  const handleEditClick = (provider: ConfiguredProvider) => {
    console.log("Editing provider:", provider);
    setSelectedProvider(provider);
    setFormOpen(true);
  };

  // Handle remove click
  const handleRemoveClick = (provider: ConfiguredProvider) => {
    removeProvider.mutateAsync(provider);
  };

  // Handle form submission
  const handleFormSubmit = (provider: ConfiguredProvider) => {
    console.log("Form submitted:", provider);

    if (selectedProvider) {
      // Update existing provider
      console.log("Updating provider:", provider);
      updateProvider.mutateAsync({
        providerName: selectedProvider.provider,
        provider,
      });
    } else {
      // Add new provider
      addProvider.mutateAsync(provider);
    }
    setFormOpen(false);
  };

  // Close the form dialog
  const handleFormClose = () => {
    setFormOpen(false);
  };

  return (
    <Card className="p-6 max-w-6xl mx-auto">
      <CardHeader className="p-0 pb-6">
        <ModelListHeader
          onAddClick={handleAddClick}
          isAdding={isAddingProvider}
        />
      </CardHeader>

      <CardDescription className="p-0">
        <p className="text-sm text-gray-500">
          Configure AI model providers to use them in your vault. You need to
          add an API key for each provider to use its models.
        </p>
      </CardDescription>

      <CardContent className="p-0 mt-6">
        {isLoading && <LoadingState />}

        {error && <ErrorState error={error} />}

        {!isLoading && !error && providers.length === 0 && <EmptyState />}

        {!isLoading && !error && providers.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {providers.map((provider) => (
              <ModelProviderCard
                key={provider.provider}
                provider={provider}
                onEdit={handleEditClick}
                onRemove={handleRemoveClick}
                isUpdating={isUpdatingProvider}
                isRemoving={isRemovingProvider}
              />
            ))}
          </div>
        )}
      </CardContent>

      <ModelProviderFormDialog
        open={formOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        provider={selectedProvider}
        isSubmitting={selectedProvider ? isUpdatingProvider : isAddingProvider}
      />
    </Card>
  );
};
