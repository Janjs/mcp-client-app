import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModelProviderForm } from './ModelProviderForm';
import { ConfiguredProvider } from '../../types/models';

interface ModelProviderFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (provider: ConfiguredProvider) => void;
  provider: ConfiguredProvider | null;
  isSubmitting: boolean;
}

/**
 * ModelProviderFormDialog Component
 * 
 * Dialog containing the form to add or edit an AI model provider
 */
export const ModelProviderFormDialog: React.FC<ModelProviderFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  provider,
  isSubmitting,
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px] lg:min-w-[600px] xl:min-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {provider ? "Edit Model Provider" : "Add New Model Provider"}
          </DialogTitle>
          <DialogDescription>
            {provider 
              ? "Edit the settings for this model provider." 
              : "Configure a new AI model provider to use in your vault."}
          </DialogDescription>
        </DialogHeader>

        <ModelProviderForm
          provider={provider}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}; 