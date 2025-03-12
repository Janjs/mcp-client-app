import React from "react";
import { ConfiguredProvider } from "../../types/models";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, TrashIcon } from "lucide-react";

interface ModelProviderCardProps {
  provider: ConfiguredProvider;
  onEdit: (provider: ConfiguredProvider) => void;
  onRemove: (provider: ConfiguredProvider) => void;
  isUpdating: boolean;
  isRemoving: boolean;
}

/**
 * ModelProviderCard Component
 *
 * Displays a single model provider with relevant information and action buttons
 */
export const ModelProviderCard: React.FC<ModelProviderCardProps> = ({
  provider,
  onEdit,
  onRemove,
  isRemoving,
  isUpdating,
}) => {
  console.log({ provider });
  const hasApiKey = Boolean(provider.settings.apiKey);

  // Handle edit button click
  const handleEditClick = () => {
    onEdit(provider);
  };

  const handleRemoveClick = () => {
    if (confirm("Are you sure you want to remove this provider?")) {
      console.log("Removing provider:", provider);
      onRemove(provider);
    }
  };

  // Format provider name to be more user-friendly
  const formatProviderName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <Card className="overflow-hidden border py-0">
      <CardHeader className="bg-gray-50 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-medium">
              {formatProviderName(provider.provider)}
            </CardTitle>
            <CardDescription className="text-xs mt-1 sr-only">
              AI model provider
            </CardDescription>
          </div>
          <Badge variant={hasApiKey ? "success" : "destructive"}>
            {hasApiKey ? "Configured" : "Not Configured"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">
                API Key Status
              </p>
              <p className="text-sm mt-1">
                {hasApiKey ? "API Key configured" : "No API Key"}
              </p>
            </div>
            {provider.settings.baseUrl && (
              <div>
                <p className="text-sm font-medium text-gray-500">Base URL</p>
                <p
                  className="text-sm mt-1 truncate"
                  title={provider.settings.baseUrl}
                >
                  {provider.settings.baseUrl}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="border-t bg-gray-50 px-6 py-3">
        <div className="flex justify-end w-full space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            disabled={isUpdating}
          >
            <PencilIcon className="h-4 w-4 mr-1" />
            Edit Provider
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveClick}
            disabled={isRemoving}
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Remove Provider
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
