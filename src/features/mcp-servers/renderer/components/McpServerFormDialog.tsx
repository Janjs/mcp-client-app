import React from 'react';
import { McpServerZ } from '@core/validation/mcp-servers-schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { McpServerForm } from './McpServerForm';

interface McpServerFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (server: McpServerZ) => void;
  server: McpServerZ | null;
  isSubmitting: boolean;
}

/**
 * MCP Server Form Dialog Component
 *
 * Dialog that contains the MCP server form
 */
export const McpServerFormDialog: React.FC<McpServerFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  server,
  isSubmitting,
}) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {server ? 'Edit MCP Server' : 'Add New MCP Server'}
          </DialogTitle>
        </DialogHeader>
        
        <McpServerForm 
          server={server} 
          onSubmit={onSubmit} 
          isSubmitting={isSubmitting} 
        />
      </DialogContent>
    </Dialog>
  );
};
